import json
import os
import re
import uuid
import datetime
from bs4 import BeautifulSoup
import requests
from scrapling.fetchers import StealthyFetcher, StealthySession, AsyncStealthySession
from langchain_ollama import OllamaLLM
import iocextract
import httpx

# ---------------------------------------------------------------------------
# IOC Whitelist — Benign domains that must NEVER be stored as threat indicators
# ---------------------------------------------------------------------------
WHITELIST: set[str] = {
    "google.com", "t.co", "twitter.com", "facebook.com", "youtube.com",
    "linkedin.com", "cybernews.com", "bleepingcomputer.com", "reddit.com",
    "wikipedia.org", "microsoft.com", "apple.com", "amazon.com", "github.com",
    "cloudflare.com", "w3.org", "mozilla.org", "nytimes.com", "cnn.com",
    "bbc.com", "forbes.com", "wired.com", "theregister.com", "arstechnica.com",
    "vice.com", "medium.com", "substack.com", "techcrunch.com",
}

# ---------------------------------------------------------------------------
# MITRE Heuristic Mapper — Maps common keywords to T-codes if LLM misses them
# ---------------------------------------------------------------------------
MITRE_MAP = {
    "phishing": "T1566",
    "ransomware": "T1486",
    "brute-force": "T1110",
    "sql injection": "T1190",
    "persistence": "T1078",
    "exfiltration": "T1041",
    "privilege escalation": "T1068",
    "backdoor": "T1543",
    "command and control": "T1071",
}


class ParseEngine:
    def __init__(self):
        # 1. Configuration Globale (V6.0 Universal Engine)
        # On active le mode adaptatif pour une meilleure extraction structurelle
        StealthyFetcher.configure(adaptive=True)
        
        # Configuration des labels TLP 2.0 officiels
        self.tlp_config = {
            "TLP:RED": "#FF0000",
            "TLP:AMBER": "#FFBF00",
            "TLP:GREEN": "#32CD32",
            "TLP:CLEAR": "#FFFFFF"
        }
        
        # Initialize the local instance of Ollama (using qwen2.5:7b or similar)
        # format='json' is supported by Ollama directly
        self.llm = OllamaLLM(
            model="qwen2.5-coder:3b", 
            temperature=0, 
            num_ctx=8192,  # Increased for larger articles
            num_predict=4096,
            format="json",
        )

    # ------------------------------------------------------------------ #
    #  iocextract Pipeline — Phase 2 (Pre) & Phase 4 (Post)            #
    # ------------------------------------------------------------------ #

    def _refang_text(self, text: str) -> str:
        """
        Undo common defanging transforms so the LLM reads real IOCs.
        Handles: hxxp→http, [.]→., (.)→., [://]→://, [at]→@
        """
        text = re.sub(r'hxxp(s?)', r'http\1', text, flags=re.IGNORECASE)
        text = re.sub(r'\[\.\]|\(\.\)', '.', text)
        text = re.sub(r'\[://\]|\(://\)', '://', text)
        text = re.sub(r'\[at\]|\(at\)', '@', text, flags=re.IGNORECASE)
        return text

    def pre_process(self, raw_text: str) -> tuple:
        """
        Phase 2 — Pre-processing (iocextract):
        - Refangs defanged IOCs so the LLM interprets them correctly
        - Extracts initial IOC seeds to guide the AI prompt
        Returns: (refanged_text: str, initial_iocs: dict)
        """
        refanged = self._refang_text(raw_text)
        try:
            ips     = list(set(str(ip) for ip in iocextract.extract_ipv4s(raw_text, refang=True)))[:20]
            urls    = list(set(str(u)  for u  in iocextract.extract_urls(raw_text,  refang=True)))[:15]
            emails  = list(set(str(e)  for e  in iocextract.extract_emails(raw_text, refang=True)))[:10]
            hashes  = list(set(str(h)  for h  in iocextract.extract_hashes(raw_text)))[:10]
        except Exception:
            ips, urls, emails, hashes = [], [], [], []
        initial_iocs = {"ips": ips, "urls": urls, "emails": emails, "hashes": hashes}
        return refanged, initial_iocs

    async def _enrich_geoip(self, ip: str) -> dict | None:
        """
        Enriches an IP address with Geographical metadata using ip-api.com.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org,as")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        return {
                            "country": data.get("country"),
                            "country_code": data.get("countryCode"),
                            "city": data.get("city"),
                            "isp": data.get("isp"),
                            "lat": data.get("lat"),
                            "lon": data.get("lon"),
                        }
        except Exception as e:
            print(f"🌍 Geo-IP enrichment failed for {ip}: {str(e)}")
        return None

    def post_validate(self, attributes: list) -> list:
        """
        Phase 4 — Post-processing (iocextract validation):
        - Drops IOCs whose value contains any whitelisted domain
        - Deduplicates by value
        Returns: cleaned, validated attribute list
        """
        if not attributes:
            return []
        seen: set[str] = set()
        cleaned = []
        for attr in attributes:
            value = str(attr.get("value", "")).strip()
            if not value or value in seen:
                continue

            # --- URL Normalization (Fix for LLM dropping //) ---
            if attr.get("type") == "url":
                # Fix http:example.com -> http://example.com
                value = re.sub(r'^(https?):(?![/]{2})', r'\1://', value, flags=re.IGNORECASE)
                attr["value"] = value

            # Whitelist guard
            if any(w in value.lower() for w in WHITELIST):
                continue
            seen.add(value)
            cleaned.append(attr)
        return cleaned

    def _scraper_api_fetch(self, url: str) -> str | None:
        """
        Strategy C — ScraperAPI (CAPTCHA + Residential Proxies).
        Triggered automatically when Strategies A & B are blocked.
        Requires SCRAPER_API_KEY env var (free tier: 1 000 req/month).
        Sign up at https://www.scraperapi.com
        """
        api_key = os.environ.get("SCRAPER_API_KEY", "")
        if not api_key:
            print("⚠️  SCRAPER_API_KEY not set — Strategy C unavailable. Add it to your .env file.")
            return None

        print("🌐 Strategy C → ScraperAPI (CAPTCHA + Residential proxies)...")
        try:
            params = {
                "api_key":    api_key,
                "url":        url,
                "render":     "true",   # JavaScript rendering (handles SPAs)
                "premium":    "true",   # Residential IP pool (bypasses most blocks)
                "country_code": "us",  # Exit node location
            }
            resp = requests.get(
                "https://api.scraperapi.com",
                params=params,
                timeout=120,            # ScraperAPI can be slow on hard targets
            )
            if resp.status_code == 200:
                content = resp.text
                is_still_blocked = (
                    "Access Denied"           in content or
                    "Just a moment"           in content or
                    "cf-browser-verification" in content or
                    "challenge-platform"      in content
                )
                if not is_still_blocked and len(content) > 200:
                    print("✅ Strategy C success via ScraperAPI!")
                    return content
                print("❌ ScraperAPI returned a challenge/empty page.")
            else:
                print(f"❌ ScraperAPI returned HTTP {resp.status_code}")
        except Exception as exc:
            print(f"❌ ScraperAPI exception: {exc}")
        return None

    def clean_for_ai(self, html_content: str) -> str:
        """
        Nettoyage automatique du contenu HTML pour l'IA.
        Supprime les éléments inutiles (scripts, styles, nav, etc.) pour optimiser le contexte.
        """
        if not html_content: 
            return ""
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Supprimer les balises inutiles
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript']):
            tag.decompose()
        
        # Récupérer uniquement le texte propre
        text = soup.get_text(separator=' ')
        # Nettoyage des espaces multiples et limite de contexte (7000 caractères pour qwen2.5)
        cleaned_text = " ".join(text.split())
        return cleaned_text[:7000]

    async def scrape_url(self, url: str) -> str:
        """
        Universal Fetching Engine V6.0 - Windows-compatible hybrid architecture.
        """
        import asyncio
        url = url.strip().rstrip('/') # Clean leading/trailing whitespace and slashes
        print(f"DEBUG: Final URL to fetch: '{url}'")
        print(f"🔍 Tentative de récupération universelle : {url}")
        
        try:
            html_content = None
            status_code = 0
            
            # STRATÉGIE A : Requête HTTP pure avec headers furtifs (requests - aucun browser)
            stealth_headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Referer": "https://www.google.com/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
            
            resp = requests.get(url, headers=stealth_headers, timeout=25, allow_redirects=True)
            status_code = resp.status_code
            
            if status_code == 200:
                print(f"✅ Succès (200) via requests (HTTP)")
                html_content = resp.text
            
            # STRATÉGIE B : Fallback navigateur (Playwright dans thread isolé avec ProactorLoop)
            else:
                print(f"⚠️ Status {status_code}. Passage au mode Deep Stealth (navigateur isolé)...")
                
                def _browser_fetch_in_thread():
                    """Runs in a thread with its own ProactorEventLoop - safe on Windows."""
                    import sys
                    if sys.platform == "win32":
                        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        return StealthyFetcher.fetch(
                            url,
                            headless=True,
                            solve_cloudflare=True,
                            wait_on_load=10,
                            disable_resources=True
                        )
                    finally:
                        loop.close()
                
                page = await asyncio.to_thread(_browser_fetch_in_thread)
                status_code = page.status
                if status_code == 200:
                    print(f"✅ Succès (200) via StealthyFetcher (thread+ProactorLoop)")
                    html_content = page.body
            
            if status_code == 404:
                error_msg = f"Error: Page not found (404). Please check your URL."
                if "bleepingcomputer.com" in url and not url.endswith(".html"):
                    error_msg += " (Hint: BleepingComputer links usually end in .html)"
                return error_msg

            if not html_content:
                # Strategy C is only for security bypass, not for broken links
                if status_code in [403, 401] or status_code == 0:
                    print(f"🔄 Strategy A+B failed with status {status_code}. Trying Strategy C (ScraperAPI)...")
                    scraperapi_content = self._scraper_api_fetch(url)
                    if scraperapi_content:
                        html_content = scraperapi_content
                    else:
                        return f"Error: All bypass strategies exhausted (A→B→C). Status={status_code}"
                else:
                    return f"Error: Failed to fetch {url} (Status {status_code})."

            # Assurer que le contenu est une chaîne de caractères
            if isinstance(html_content, (bytes, bytearray)):
                html_content = html_content.decode('utf-8', errors='ignore')

            # --- Détection de challenge Cloudflare / Access Denied ---
            # Si requests a retourné 200 mais avec une page de challenge, on escalade au navigateur
            is_challenge = (
                "Access Denied" in html_content or
                "security check" in html_content.lower() or
                "cf-browser-verification" in html_content or
                "challenge-platform" in html_content or
                "Just a moment" in html_content  # Cloudflare "humanness" page
            )
            
            if is_challenge and status_code == 200:
                print(f"🛡️ Page de challenge détectée via requests. Escalade vers le navigateur...")
                
                def _browser_fetch_bypass():
                    import sys
                    if sys.platform == "win32":
                        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        return StealthyFetcher.fetch(
                            url,
                            headless=True,
                            solve_cloudflare=True,
                            wait_on_load=12,
                            disable_resources=True
                        )
                    finally:
                        loop.close()
                
                page = await asyncio.to_thread(_browser_fetch_bypass)
                if page.status == 200:
                    print(f"✅ Bypass Cloudflare réussi via navigateur!")
                    page_body = page.body
                    if isinstance(page_body, (bytes, bytearray)):
                        page_body = page_body.decode('utf-8', errors='ignore')
                    if "Access Denied" not in page_body and "Just a moment" not in page_body:
                        html_content = page_body
                    else:
                        # ---- Strategy C: ScraperAPI last resort ----
                        print("🛡️ Browser bypass returned a challenge page. Trying Strategy C (ScraperAPI)...")
                        scraperapi_content = self._scraper_api_fetch(url)
                        if scraperapi_content:
                            html_content = scraperapi_content
                        else:
                            return "Error: All bypass strategies exhausted (A→B→C). Site is fully protected."
                elif page.status == 404:
                    return "Error: Page not found (404) via browser. Check your URL."
                else:
                    # ---- Strategy C: ScraperAPI last resort ----
                    if page.status in [403, 401]:
                        print(f"🔄 Browser returned status {page.status}. Trying Strategy C (ScraperAPI)...")
                        scraperapi_content = self._scraper_api_fetch(url)
                        if scraperapi_content:
                            html_content = scraperapi_content
                        else:
                            return f"Error: All bypass strategies exhausted (A→B→C). Browser status={page.status}."
                    else:
                        return f"Error: Browser failed with status {page.status}."
            elif is_challenge:
                # ---- Strategy C: ScraperAPI last resort ----
                print("🛡️ Access Denied after all browser attempts. Trying Strategy C (ScraperAPI)...")
                scraperapi_content = self._scraper_api_fetch(url)
                if scraperapi_content:
                    html_content = scraperapi_content
                else:
                    return "Error: All bypass strategies exhausted (A→B→C). Access Denied."

            # --- Nettoyage et Optimisation pour l'IA ---
            # On extrait quand même quelques métadonnées si possible avant le gros nettoyage
            soup = BeautifulSoup(html_content, 'html.parser')
            title = soup.title.string if soup.title else "No Title"
            
            meta_desc = ""
            desc_tag = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
            if desc_tag:
                meta_desc = desc_tag.get('content', '')

            text = self.clean_for_ai(html_content)
            
            if not text or len(text) < 150:
                return "Error: Content is too short or page is empty after cleaning."
            
            # Build Context String for LLM
            context = f"PAGE_TITLE: {title}\n"
            context += f"META_DESCRIPTION: {meta_desc}\n\n"
            context += f"BODY_CONTENT:\n{text}"
               
            return context
            
        except Exception as e:
            print(f"❌ Erreur critique sur {url} : {str(e)}")
            return f"Error: Scraping exception - {str(e)}"

    async def generate_cti_event(self, text: str, url: str, initial_iocs: dict = None) -> dict:
        """
        Analyzes content using the Master Parser prompt for JSON CTI extraction (ASYNC).
        """
        if text.startswith("Error:"):
            return {"error": text}
            
        # 1. Clean input to avoid saturating context
        input_text = text[:8000]

        # 2. iocextract seed hint (Phase 2 hand-off to LLM)
        ioc_hint = ""
        if initial_iocs and any(initial_iocs.values()):
            ioc_hint = f"""
PRE-DETECTED IOCs (extracted by iocextract — use as a cross-reference for attributes):
  IPs     : {initial_iocs.get('ips', [])}
  URLs    : {initial_iocs.get('urls', [])}
  Emails  : {initial_iocs.get('emails', [])}
  Hashes  : {initial_iocs.get('hashes', [])}
"""

        # 3. Master Parser Prompt (Optimized)
        prompt = f"""
        Tu es un expert en Cyber Threat Intelligence (CTI). Ta mission est d'extraire des données de sécurité d'un texte brut et de les transformer en un objet JSON unique.
        
        RÈGLES CRITIQUES :
        1. Ne fournis aucune explication, réponds uniquement en JSON.
        2. Utilise le standard TLP 2.0 pour tlp_label (RED, AMBER, GREEN, CLEAR).
        3. Pour les attributes, respecte strictement le mapping MISP (type, category, value).
        4. Output strictly valid JSON components.

        Tâche : Analyse le contenu suivant et convertis-le selon le schéma fourni.
        {ioc_hint}
        Article Content:
        {input_text}

        Schéma à suivre :
        {{
          "info": "Titre court de la menace",
          "description": "Description détaillée de l'incident",
          "category": "cti",
          "threat_level": 0-4,
          "tlp_label": "TLP:RED",
          "tags": [{{"name": "nom", "color": "couleur_hex_ou_nom"}}],
          "mitre_techniques": [{{"id": "T1XXX", "name": "Nom de la technique"}}],
          "attributes": [
            {{
              "type": "domain|url|ip-dst|sha256|cve-id|mitre-attack-id",
              "category": "Network activity|Payload delivery|vulnerability|External analysis",
              "value": "valeur",
              "role": "C2 Server|Malware Sample|Victim|Exploit Code",
              "comment": "contexte"
            }}
          ],

          "website": "{url}",
          "author": "Auteur si connu",
          "date_occured": "YYYY-MM-DD"
        }}
        """
        
        try:
            # Logic: Force JSON response if supported, else regex match
            response = await self.llm.ainvoke(prompt)
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            
            if json_match:
                event_data = json.loads(json_match.group(0))
            else:
                return {"error": "LLM failed to return a valid JSON structure."}
                
            # --- POST-PROCESSING (IDs, Dates, Colors) ---
            event_data["id"] = str(uuid.uuid4())
            now = datetime.datetime.now(datetime.timezone.utc)
            event_data["collectionDate"] = now.isoformat()
            
            unix_now = str(int(now.timestamp()))
            event_data["created_at"] = unix_now
            event_data["updated_at"] = unix_now
            
            # Map TLP Label to Color
            tlp_label = event_data.get("tlp_label", "TLP:CLEAR")
            if not tlp_label.startswith("TLP:"):
                tlp_label = f"TLP:{tlp_label.upper()}"
            
            if tlp_label not in self.tlp_config:
                tlp_label = "TLP:CLEAR"
            
            color = self.tlp_config[tlp_label]
            event_data["TLP"] = [{"name": tlp_label, "color": color}]
            
            # Standard enrichment
            event_data.update({
                "platform": "te",
                "is_shared": True,
                "is_verified": False,
                "organisation": {"name": "threatseye", "uuid": str(uuid.uuid4())}
            })

            # --- Threat Level Heuristic (Correction for small LLMs) ---
            # If AI says it's level 2-4 but mentions "ransomware" or "apt", force it to 0 (Critical)
            title_lower = event_data.get("info", "").lower()
            tag_names = [t.get("name", "").lower() for t in event_data.get("tags", [])]
            
            critical_keywords = ["ransomware", "apt", "zero-day", "0-day", "critical", "rce"]
            if any(kw in title_lower for kw in critical_keywords) or any(kw in tag_names for kw in critical_keywords):
                if event_data.get("threat_level", 4) > 0:
                    print(f"🚩 Heuristic: Boosting threat level to 0 (Critical) based on keywords.")
                    event_data["threat_level"] = 0
                    # Sync TLP to RED if it was GREEN/CLEAR
                    if event_data.get("tlp_label") in ["TLP:GREEN", "TLP:CLEAR"]:
                        event_data["tlp_label"] = "TLP:RED"
                        event_data["TLP"] = [{"name": "TLP:RED", "color": self.tlp_config["TLP:RED"]}]
            
            if "attributes" in event_data:
                # Phase 4: Post-validate — whitelist filter + deduplication
                event_data["attributes"] = self.post_validate(event_data["attributes"])
                
                # --- Advanced Enrichment Sub-Phase ---
                for attr in event_data["attributes"]:
                    attr_type = attr.get("type")
                    attr_value = attr.get("value")
                    
                    # 1. Geo-IP Enrichment
                    geo_data = []
                    if attr_type == "ip-dst":
                        print(f"🌍 Enriching Geo-IP for {attr_value}...")
                        result = await self._enrich_geoip(attr_value)
                        if result:
                            geo_data = [result]
                    
                    attr.update({
                        "uuid": str(uuid.uuid4()),
                        "timestamp": unix_now,
                        "data": "",
                        "geo_localisation": geo_data
                    })

            # --- MITRE Heuristic & Tag Sync ---
            if "mitre_techniques" not in event_data:
                event_data["mitre_techniques"] = []
                
            # If AI missed techniques, check description/tags for keywords
            content_to_check = (event_data.get("description", "") + " " + event_data.get("info", "")).lower()
            for keyword, t_code in MITRE_MAP.items():
                if keyword in content_to_check:
                    # Add to techniques if not already there
                    if not any(t.get("id") == t_code for t in event_data["mitre_techniques"]):
                        event_data["mitre_techniques"].append({"id": t_code, "name": keyword.capitalize()})

            return event_data
            
        except Exception as e:
             return {"error": f"JSON Transformation failed: {str(e)}"}

async def main():
    engine = ParseEngine()
    test_url = "https://www.bleepingcomputer.com/news/security/man-admits-to-extortion-plot-locking-coworkers-out-of-thousands-of-windows-devices/"
    print(f"Scraping {test_url}...")
    text = await engine.scrape_url(test_url)
    if not text.startswith("Error"):
        print(f"Text preview: {text[:200]}...")
        event = await engine.generate_cti_event(text, test_url)
        print(json.dumps(event, indent=2))
    else:
        print(text)

if __name__ == '__main__':
    import asyncio, sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
