from datetime import timedelta, datetime
import json
import uvicorn
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load .env file (SCRAPER_API_KEY, SECRET_KEY, etc.)
load_dotenv()

# Fix for Playwright/Patchright on Windows: requires ProactorEventLoop for subprocess support
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import Depends, FastAPI, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse
import hashlib
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .ai_engine import AIEngine
from .config.auth import authenticate_user, get_password_hash
from .config.dependencies import get_current_user
from .config.jwt_utils import create_access_token
from .parse_engine import ParseEngine
from .chat_engine import ChatEngine
from .database import get_db
from .models import User, CTIEvent, Incident
from sqlalchemy.orm import Session
import os


app = FastAPI(title="Cyber Threat Intelligence API")

# Configuration CORS pour Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # URL par défaut de Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration des chemins absolus
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_FILE = os.path.join(BASE_DIR, "data", "threat_report.json")
ALERTS_FILE = os.path.join(BASE_DIR, "data", "alerts.json")
INCIDENTS_FILE = os.path.join(BASE_DIR, "data", "incidents.json")
CTI_EVENTS_FILE = os.path.join(BASE_DIR, "data", "cti_events.json")

# Ensure data directory exists
os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
if not os.path.exists(INCIDENTS_FILE):
    with open(INCIDENTS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)
if not os.path.exists(CTI_EVENTS_FILE):
    with open(CTI_EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

engine = AIEngine()
parse_engine = ParseEngine()
chat_engine = ChatEngine()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SandboxRequest(BaseModel):
    type: str  # "email" or "file"
    content: str


class IPActionRequest(BaseModel):
    ip: str
    action: str  # "block", "monitor", "ignore"


class IncidentRecord(BaseModel):
    id: str
    type: str
    verdict: str
    risk_score: int
    timestamp: str
    details: dict

class ParseRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    message: str


def require_admin(current_user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return current_user


@app.get("/")
def root():
    return {
        "project": "Cyber Threat AI Project",
        "status": "online",
        "endpoints": ["/login", "/run-analysis", "/threat-report", "/alerts", "/live-traffic", "/ip-lookup/{ip}", "/analyze-sandbox", "/playbooks", "/incidents"],
    }


@app.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = authenticate_user(db, body.username, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        data={"id": user["id"], "username": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=30),
    )

    return TokenResponse(access_token=token)

@app.post("/register")
def register(body: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == body.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=body.username,
        password_hash=get_password_hash(body.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "user_id": new_user.id}


@app.post("/run-analysis")
def run_analysis(_: dict[str, str] = Depends(require_admin)):
    """
    Lance l'analyse AI Engine (admin uniquement).
    """
    result = engine.analyze_alerts()
    return {"status": "analysis_completed", "message": result}


@app.get("/threat-report")
def get_report(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne le contenu du fichier threat_report.json (protégé).
    """
    if not os.path.exists(REPORT_FILE):
        return {"error": "Threat report not found. Run /run-analysis first."}

    with open(REPORT_FILE, "r", encoding="utf-8") as f:
        report = json.load(f)
    return report


@app.get("/alerts")
def get_alerts(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne les alertes brutes consolidées (protégé).
    """
    if not os.path.exists(ALERTS_FILE):
        return {"error": "No alerts found."}

    with open(ALERTS_FILE, "r", encoding="utf-8") as f:
        alerts = json.load(f)
    return alerts

@app.get("/live-traffic")
def get_live_traffic():
    """
    Génère des données de trafic réseau simulées (temps réel).
    """
    return engine.generate_live_traffic(count=8)


@app.get("/ip-lookup/{ip}")
def ip_lookup(ip: str, _: dict[str, str] = Depends(get_current_user)):
    """
    Analyse une adresse IP (protégé).
    """
    return engine.analyze_ip(ip)


@app.post("/analyze-sandbox")
def analyze_sandbox(body: SandboxRequest, _: dict[str, str] = Depends(get_current_user)):
    """
    Analyse un contenu suspect (email/fichier) dans le sandbox.
    """
    return engine.analyze_context(body.type, body.content)


@app.post("/ip-action")
def ip_action(body: IPActionRequest, _: dict[str, str] = Depends(get_current_user)):
    """
    Enregistre une action SOC sur une IP (protégé).
    """
    print(f"SOC Action: {body.action} executed on {body.ip}")
    return {"status": "success", "message": f"Action {body.action} performed on {body.ip}"}


@app.get("/playbooks")
def get_playbooks(_: dict[str, str] = Depends(get_current_user)):
    """
    Retourne la liste des playbooks d'incident.
    """
    return engine.get_playbooks()


@app.get("/playbooks/{playbook_id}")
def get_playbook_details(playbook_id: str, _: dict[str, str] = Depends(get_current_user)):
    """
    Retourne les étapes d'un playbook spécifique.
    """
    return engine.get_playbook_steps(playbook_id)


@app.get("/incidents")
def get_incidents(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Liste tous les incidents enregistrés (filtrés par utilisateur).
    """
    if current_user["role"] == "admin":
        db_incidents = db.query(Incident).order_by(Incident.timestamp.desc()).all()
    else:
        db_incidents = db.query(Incident).filter(Incident.owner_id == current_user["id"]).order_by(Incident.timestamp.desc()).all()
    
    incidents = []
    for inc in db_incidents:
        try:
            details = json.loads(inc.details) if inc.details else {}
            incidents.append({
                "id": inc.external_id,
                "local_id": inc.id,
                "type": inc.type,
                "verdict": inc.verdict,
                "risk_score": inc.risk_score,
                "timestamp": inc.timestamp.isoformat(),
                "details": details
            })
        except:
            pass
    return incidents


@app.post("/incidents")
def add_incident(incident: IncidentRecord, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Enregistre un nouvel incident dans SQLite.
    """
    db_inc = Incident(
        external_id=incident.id,
        type=incident.type,
        verdict=incident.verdict,
        risk_score=incident.risk_score,
        timestamp=datetime.fromisoformat(incident.timestamp.replace("Z", "+00:00")),
        details=json.dumps(incident.details),
        owner_id=current_user["id"]
    )
    db.add(db_inc)
    db.commit()
    db.refresh(db_inc)
        
    return {"status": "success", "incident_id": db_inc.external_id, "local_id": db_inc.id}

@app.post("/analyze-url")
async def analyze_url(body: ParseRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Ingests and parses a threat intelligence URL via ParseAI.
    """
    # Use native async capabilities of ParseEngine
    text = await parse_engine.scrape_url(body.url)
    if isinstance(text, str) and text.startswith("Error:"):
        raise HTTPException(status_code=400, detail=text)
        
    event = await parse_engine.generate_cti_event(text, body.url)
    
    if "error" in event:
         raise HTTPException(status_code=500, detail=event["error"])
         
    # Save to SQLite database
    db_event = CTIEvent(
        url=body.url,
        content=json.dumps(event),
        owner_id=current_user["id"]
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    event["local_id"] = db_event.id # Inject ID for frontend deletion
    
    return {"status": "success", "event": event}


@app.get("/analyze-url-stream")
async def analyze_url_stream(
    url: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    SSE endpoint: streams real-time progress while running the full
    iocextract → Scraping → Pre-process → LLM → Post-validate pipeline.
    Frontend consumes this with fetch() + ReadableStream (supports JWT header).
    """
    async def event_generator():
        def emit(step: str, progress: int, **kwargs) -> str:
            return f"data: {json.dumps({'step': step, 'progress': progress, **kwargs})}\n\n"

        try:
            # --- Phase 1: Scraping ---
            yield emit("🔍 Scraping target URL via StealthyFetcher...", 10)
            text = await parse_engine.scrape_url(url)

            if isinstance(text, str) and text.startswith("Error:"):
                yield f"data: {json.dumps({'error': text, 'progress': 0})}\n\n"
                return

            # --- Phase 2: Pre-processing (iocextract) ---
            yield emit("🧬 Pre-processing with iocextract (refanging IOCs)...", 30)
            refanged_text, initial_iocs = await asyncio.to_thread(
                parse_engine.pre_process, text
            )

            ioc_count = sum(len(v) for v in initial_iocs.values())
            yield emit(
                f"🔎 Found {ioc_count} raw IOC candidates via iocextract — seeding AI prompt...",
                45,
                ioc_preview=initial_iocs
            )

            # --- Phase 3: LLM Analysis ---
            yield emit("🤖 Running LLM (qwen2.5-coder:3b) — this takes 30-90s...", 60)
            event = await parse_engine.generate_cti_event(refanged_text, url, initial_iocs)

            if "error" in event:
                yield f"data: {json.dumps({'error': event['error'], 'progress': 0})}\n\n"
                return

            # --- Phase 4: Post-validation (whitelist filter) ---
            attr_count = len(event.get("attributes", []))
            yield emit(
                f"✅ Whitelist filter applied — {attr_count} validated IOC attribute(s) retained.",
                85
            )

            # --- Phase 5: Database storage ---
            yield emit("💾 Saving CTI event to database...", 92)
            db_event = CTIEvent(
                url=url,
                content=json.dumps(event),
                owner_id=current_user["id"]
            )
            db.add(db_event)
            db.commit()
            db.refresh(db_event)
            event["local_id"] = db_event.id

            # --- Done ---
            yield f"data: {json.dumps({'done': True, 'event': event, 'progress': 100})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc), 'progress': 0})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
    

@app.post("/analyze-malware")
async def analyze_malware_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Performs static malware analysis on an uploaded file (SHA256 + AI Strings Analysis).
    """
    try:
        # 1. Read content (Limited to 5MB for safety)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
             raise HTTPException(status_code=400, detail="File too large (Max 5MB)")

        # 2. Calculate SHA256 Hash
        file_hash = hashlib.sha256(content).hexdigest()
        
        # 3. Extract Strings (UTF-8, ignore errors for binary files)
        # Limit to 8000 characters for LLM context window stability
        text_content = content.decode('utf-8', errors='ignore')[:8000]
        
        if not text_content.strip():
            # If decoding fails to produce any text, provide a fallback or error
            text_content = f"[Binary File: {file.filename}]"

        # 4. AI Deep Analysis via AIEngine
        analysis = engine.analyze_malware(text_content, file.filename)
        
        # 5. Enrich with file metadata
        analysis['file_info'] = {
            "filename": file.filename,
            "sha256": file_hash,
            "size_bytes": len(content),
            "owner": current_user["username"]
        }
        
        return {"status": "success", "analysis": analysis}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cti-events")
def get_cti_events(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieves all stored CTI events generated by ParseAI for the current user.
    """
    # Fetch events owned by user
    if current_user["role"] == "admin":
        db_events = db.query(CTIEvent).order_by(CTIEvent.timestamp.desc()).all()
    else:
        db_events = db.query(CTIEvent).filter(CTIEvent.owner_id == current_user["id"]).order_by(CTIEvent.timestamp.desc()).all()
        
    events = []
    for ev in db_events:
        try:
            data = json.loads(ev.content)
            data["local_id"] = ev.id
            events.append(data)
        except json.JSONDecodeError:
            pass
            
    return events

@app.delete("/cti-events/{event_id}")
def delete_cti_event(event_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Deletes a CTI event if owned by the user (or if admin).
    """
    ev = db.query(CTIEvent).filter(CTIEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if current_user["role"] != "admin" and ev.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
        
    db.delete(ev)
    db.commit()
    return {"status": "success", "message": "Event deleted"}


@app.post("/chat")
def chat_with_assistant(body: ChatRequest, _: dict[str, str] = Depends(get_current_user)):
    """
    Interacts with the cyber assistant chatbot using local context.
    """
    response = chat_engine.chat(body.message)
    return {"status": "success", "response": response}

# ============================================================
#  AI SANDBOX — Live Phishing Detonation Engine
# ============================================================
import iocextract as _ioc
import httpx as _httpx
import time as _time

# 15-minute in-memory cache for the OpenPhish feed
_feed_cache: dict = {"urls": [], "fetched_at": 0.0}
FEED_TTL = 900  # 15 minutes in seconds


@app.get("/sandbox/live-feed")
async def get_sandbox_live_feed(current_user: dict = Depends(get_current_user)):
    """Returns latest phishing URLs from OpenPhish (cached 15 min)."""
    now = _time.time()
    if now - _feed_cache["fetched_at"] < FEED_TTL and _feed_cache["urls"]:
        return {"status": "cache", "urls": _feed_cache["urls"]}

    try:
        async with _httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt",
                follow_redirects=True
            )
            resp.raise_for_status()

        # iocextract validates + refangs URLs from the raw feed
        all_urls = list(_ioc.extract_urls(resp.text, refang=True))
        # Dedupe and take 20 most recent (last lines in feed)
        unique_urls = list(dict.fromkeys(reversed(all_urls)))[:20]

        _feed_cache["urls"] = unique_urls
        _feed_cache["fetched_at"] = now
        return {"status": "live", "urls": unique_urls}

    except Exception as e:
        if _feed_cache["urls"]:
            return {"status": "stale", "urls": _feed_cache["urls"]}
        raise HTTPException(status_code=503, detail=f"OpenPhish feed unavailable: {str(e)}")


class DetonateRequest(BaseModel):
    url: str


@app.post("/sandbox/detonate")
async def detonate_url(body: DetonateRequest, current_user: dict = Depends(get_current_user)):
    """SSE endpoint — streams live AI detonation logs + final JSON verdict."""
    from langchain_ollama import OllamaLLM
    import re as _re
    llm = OllamaLLM(model="qwen2.5-coder:3b")

    async def event_generator():
        def sse(msg: str, event: str = "log") -> str:
            return f"event: {event}\ndata: {msg}\n\n"

        try:
            yield sse("🚀 Initializing virtual detonation environment...")
            await asyncio.sleep(0.3)

            yield sse("🔍 Pre-processing URL with iocextract...")
            refanged_list = list(_ioc.extract_urls(body.url, refang=True))
            clean_url = refanged_list[0] if refanged_list else body.url
            yield sse(f"✅ Normalized URL: {clean_url}")
            await asyncio.sleep(0.3)

            yield sse("🧠 Decomposing URL structure...")
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(clean_url)
            domain = parsed.netloc or parsed.path
            params = parse_qs(parsed.query)
            suspicious_params = [k for k in params if k.lower() in ["redirect", "url", "next", "token", "confirm", "login", "session"]]
            yield sse(f"🌐 Domain: {domain} | Path: {parsed.path}")
            if suspicious_params:
                yield sse(f"⚠️  Suspicious params detected: {', '.join(suspicious_params)}")
            await asyncio.sleep(0.3)

            yield sse("⚔️  Running AI heuristic detonation engine (Ollama)...")
            prompt = f"""You are a virtual detonation system for phishing URL analysis. Analyze this URL: {clean_url}

1. Identify the BRAND being impersonated (Microsoft, PayPal, Amazon, DHL, Binance, etc.)
2. Identify suspicious techniques: redirect chains, credential harvesting, typosquatting
3. Rate RISK SCORE 0-100
4. Verdict: MALICIOUS, SUSPICIOUS, or CLEAN

Respond ONLY in this exact JSON format:
{{
  "verdict": "MALICIOUS",
  "risk_score": 95,
  "brand_target": "Microsoft",
  "technique": "Credential Harvesting",
  "ioc_types": ["url", "domain"],
  "suspicious_flags": ["fake login page", "non-official domain"],
  "summary": "One sentence explanation"
}}"""

            response = await asyncio.to_thread(llm.invoke, prompt)
            yield sse("✅ AI analysis complete. Parsing verdict...")
            await asyncio.sleep(0.2)

            match = _re.search(r'\{.*\}', response, _re.DOTALL)
            if match:
                verdict = json.loads(match.group(0))
                verdict["url"] = clean_url
                verdict["domain"] = domain
                yield sse(f"🎯 Verdict: {verdict.get('verdict', 'N/A')} | Risk: {verdict.get('risk_score', 0)}/100")
                yield sse(json.dumps(verdict), event="result")
            else:
                yield sse(json.dumps({"verdict": "UNKNOWN", "risk_score": 50, "url": clean_url, "domain": domain, "summary": response[:300]}), event="result")

        except Exception as e:
            yield sse(f"❌ Detonation error: {str(e)}", event="error")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


if __name__ == "__main__":
    uvicorn.run("backend.api:app", host="127.0.0.1", port=8000, reload=True)