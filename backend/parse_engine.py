import json
import re
import uuid
import datetime
from bs4 import BeautifulSoup
import requests
from scrapling.fetchers import StealthyFetcher, StealthySession, AsyncStealthySession
from langchain_ollama import OllamaLLM

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
        Strategy A: Pure requests HTTP (fast, no browser, no asyncio conflict).
        Strategy B: StealthyFetcher in isolated thread with its own ProactorEventLoop.
        """
        import asyncio
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
            
            if not html_content:
                return f"Error: Failed to fetch {url} (Status {status_code})"

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
                        return "Error: Cloudflare bypass failed — site is fully protected."
                else:
                    return f"Error: Browser bypass failed (Status {page.status})."
            elif is_challenge:
                return "Error: Access Denied / Security Challenge detected after all attempts."

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

    async def generate_cti_event(self, text: str, url: str) -> dict:
        """
        Analyzes content using the Master Parser prompt for JSON CTI extraction (ASYNC).
        """
        if text.startswith("Error:"):
            return {"error": text}
            
        # 1. Clean input to avoid saturating context
        input_text = text[:8000] 

        # 2. Master Parser Prompt (Optimized)
        prompt = f"""
        Tu es un expert en Cyber Threat Intelligence (CTI). Ta mission est d'extraire des données de sécurité d'un texte brut et de les transformer en un objet JSON unique.
        
        RÈGLES CRITIQUES :
        1. Ne fournis aucune explication, réponds uniquement en JSON.
        2. Utilise le standard TLP 2.0 pour tlp_label (RED, AMBER, GREEN, CLEAR).
        3. Pour les attributes, respecte strictement le mapping MISP (type, category, value).
        4. Output strictly valid JSON components.

        Tâche : Analyse le contenu suivant et convertis-le selon le schéma fourni.
        
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
            
            if "attributes" in event_data:
                for attr in event_data["attributes"]:
                    attr.update({
                        "uuid": str(uuid.uuid4()),
                        "timestamp": unix_now,
                        "data": "",
                        "geo_localisation": []
                    })

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
