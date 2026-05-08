import os
import random
import threading
import html
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional

import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
from pydantic import BaseModel

from dotenv import load_dotenv
from pathlib import Path

# Load from .env file explicitly in the backend folder
load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="RescueAI API")


# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ─────────────────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
SYSTEM_NUMBERS = "1122 (Rescue) | 115 (Ambulance) | 15 (Police)"

RESPONDER_UNITS = {
    "Fire": ["Fire Station Alpha — Unit 7", "Fire Station Beta — Ladder 3"],
    "Accident": ["Traffic Police Unit 12", "Rescue Squad Delta"],
    "Medical": ["Ambulance 04 — City Hospital", "Paramedic Unit 9"],
    "Crime": ["Police Unit 5", "Rapid Response Force"],
    "Natural Disaster": ["Civil Defence Team", "NDMA Unit 3"],
    "Gas Leak": ["Gas Emergency Unit", "HazMat Team Alpha"],
    "Other": ["Emergency Dispatch Center", "First Response Team"],
}

ALERTS: Dict[str, dict] = {}
REPORTS: Dict[str, dict] = {}
STORE_LOCK = threading.Lock()

AUDIO_OUTPUT_DIR = Path("./temp_audio")
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Models ───────────────────────────────────────────────────────────────────
class SOSRequest(BaseModel):
    name: str
    phone: str
    location: str = ""
    lat: float = 0.0
    lon: float = 0.0

class ReportRequest(BaseModel):
    alert_id: str
    incident_type: str
    incident_spot: str
    description: str
    language: str = "English"

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []
    language: str = "English"

# ── Groq API ─────────────────────────────────────────────────────────────────
def groq_chat(messages: List[dict], system_prompt: str = "") -> str:
    if not GROQ_API_KEY:
        return "⚠️ GROQ_API_KEY is missing."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    candidate_models = [GROQ_MODEL, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]
    full_messages = ([{"role": "system", "content": system_prompt}] if system_prompt else []) + messages
    last_error = "Unknown AI error"

    for model_name in candidate_models:
        payload = {
            "model": model_name,
            "messages": full_messages,
            "temperature": 0.3,
            "max_tokens": 900,
        }
        try:
            response = requests.post(GROQ_URL, headers=headers, json=payload, timeout=35)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as exc:
            last_error = str(exc)
            continue

    return f"❌ AI assistant error: {last_error}"

# ── Helpers ───────────────────────────────────────────────────────────────────
def normalize_location(location_text: str) -> str:
    text = (location_text or "").strip()
    if text: return text
    lat = round(32.0853 + random.uniform(-0.02, 0.02), 6)
    lon = round(72.6748 + random.uniform(-0.02, 0.02), 6)
    return f"{lat}, {lon}"

def make_alert_id() -> str:
    while True:
        candidate = f"EMG-{random.randint(10000, 99999)}"
        with STORE_LOCK:
            if candidate not in ALERTS: return candidate

def make_report_id() -> str:
    while True:
        candidate = f"RPT-{random.randint(10000, 99999)}"
        with STORE_LOCK:
            if candidate not in REPORTS: return candidate

def clean_incident_type(raw_value: str) -> str:
    if not raw_value: return "Other"
    value = raw_value.lower()
    for key in ["fire", "accident", "medical", "crime", "natural", "gas"]:
        if key in value: return key.capitalize() if key != "natural" else "Natural Disaster"
    return "Other"

# ── Endpoints ────────────────────────────────────────────────────────────────
@app.post("/sos")
async def trigger_sos(req: SOSRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    
    alert_id = make_alert_id()
    location = normalize_location(req.location)
    eta = random.randint(4, 15)
    created_at = datetime.now()

    record = {
        "alert_id": alert_id,
        "name": req.name.strip(),
        "phone": req.phone.strip() or "Not provided",
        "location": location,
        "created_at": created_at,
        "created_at_str": created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "eta": eta,
        "status": "active",
        "kind": "SOS",
    }

    with STORE_LOCK:
        ALERTS[alert_id] = record
    
    return record

@app.post("/report")
async def submit_report(req: ReportRequest):
    alert_id = req.alert_id.strip().upper()
    with STORE_LOCK:
        alert = ALERTS.get(alert_id)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert ID not found")
    
    clean_type = clean_incident_type(req.incident_type)
    report_id = make_report_id()
    unit = random.choice(RESPONDER_UNITS.get(clean_type, RESPONDER_UNITS["Other"]))
    report_time = datetime.now()
    
    report = {
        "report_id": report_id,
        "alert_id": alert_id,
        "incident_type": clean_type,
        "description": req.description,
        "incident_spot": req.incident_spot,
        "gps_location": alert["location"],
        "reported_at": report_time,
        "reported_at_str": report_time.strftime("%Y-%m-%d %H:%M:%S"),
        "assigned_unit": unit,
        "eta": max(2, alert["eta"] - 1),
    }

    with STORE_LOCK:
        REPORTS[report_id] = report
        ALERTS[alert_id].update({
            "linked_report_id": report_id,
            "incident_type": clean_type,
            "incident_spot": req.incident_spot,
            "assigned_unit": unit
        })

    ai_prompt = f"Alert ID: {alert_id}\nType: {clean_type}\nLocation: {alert['location']}\nSpot: {req.incident_spot}\nDescription: {req.description}"
    
    if req.language == "Urdu":
        sys_prompt = (
            "You are a HIGH-LEVEL EMERGENCY AI. You MUST provide a response 100% in URDU script. "
            "STRICT RULES:\n"
            "1. NO ENGLISH LETTERS or words.\n"
            "2. NO CHINESE or foreign characters.\n"
            "3. NO ENGLISH NUMBERS (1, 2, 3). Use Urdu numbers (۱, ۲, ۳) ONLY.\n"
            "4. YOU MUST USE TWO NEWLINES (\\n\\n) BETWEEN SECTIONS TO CREATE SEPARATE BOXES.\n\n"
            "Structure exactly like this:\n\n"
            "ایمرجنسی الارٹ: [Urdu Text]\n\n"
            "تفصیل: [Urdu Text]\n\n"
            "فوری کارروائی ضروری ہے:\n"
            "۱. [Urdu Action]\n"
            "۲. [Urdu Action]\n\n"
            "یاد رکھیں: [Urdu Text]"
        )
    else:
        sys_prompt = (
            "You are a critical emergency response AI. You MUST provide a response EXCLUSIVELY in ENGLISH. "
            "STRICT RULES:\n"
            "1. YOU MUST USE TWO NEWLINES (\\n\\n) BETWEEN SECTIONS TO CREATE SEPARATE BOXES.\n"
            "2. Numbering (1, 2, 3...) is ONLY for the 'IMMEDIATE ACTION REQUIRED' section.\n\n"
            "Structure exactly like this:\n\n"
            "EMERGENCY ALERT: [Text]\n\n"
            "DESCRIPTION: [Text]\n\n"
            "IMMEDIATE ACTION REQUIRED:\n"
            "1. [Action]\n"
            "2. [Action]\n\n"
            "REMEMBER: [Text]"
        )
        
    ai_guidance = groq_chat([{"role": "user", "content": ai_prompt}], sys_prompt)
    
    return {"report": report, "ai_guidance": ai_guidance}

@app.get("/track/{entry_id}")
async def track_incident(entry_id: str):
    entry_id = entry_id.strip().upper()
    with STORE_LOCK:
        if entry_id in ALERTS:
            record = ALERTS[entry_id]
            kind = "alert"
        elif entry_id in REPORTS:
            record = REPORTS[entry_id]
            kind = "report"
        else:
            raise HTTPException(status_code=404, detail="ID not found")

    created_at = record.get("created_at") or record.get("reported_at")
    elapsed = (datetime.now() - created_at).total_seconds() / 60.0
    
    return {
        "kind": kind,
        "record": record,
        "elapsed_minutes": elapsed,
        "remaining_eta": max(0, int(round(record["eta"] - elapsed)))
    }

@app.post("/chat")
async def chat_aria(req: ChatRequest):
    target_lang = "Urdu" if req.language == "Urdu" else "English"
    system_prompt = f"You are ARIA, an expert emergency medical assistant. Crucial rule: You MUST reply EXCLUSIVELY in {target_lang}. Never use any other language or mixed scripts. Do not use emojis. Keep responses concise, compassionate, and highly practical."
    messages = req.history + [{"role": "user", "content": req.message}]
    answer = groq_chat(messages, system_prompt)
    return {"answer": answer}

from fastapi.responses import FileResponse

@app.get("/tts")
async def text_to_speech(text: str, lang: str = "en"):
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Map frontend lang values to gTTS language codes
    lang_lower = lang.lower()
    if lang_lower in ("urdu", "ur"):
        tts_lang = "ur"
    else:
        tts_lang = "en"

    try:
        tts = gTTS(text=text, lang=tts_lang)
        filename = f"tts_{uuid.uuid4().hex}.mp3"
        filepath = AUDIO_OUTPUT_DIR / filename
        tts.save(str(filepath))
        return FileResponse(
            path=filepath,
            media_type="audio/mpeg",
            filename=filename,
            headers={"Cache-Control": "no-cache"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), language: str = Form("Auto Detect")):
    if not GROQ_API_KEY: return {"error": "GROQ_API_KEY missing"}
    
    temp_path = AUDIO_OUTPUT_DIR / f"upload_{uuid.uuid4().hex}.wav"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    files = {"file": (temp_path.name, open(temp_path, "rb"), "audio/wav")}
    data = {"model": "whisper-large-v3-turbo"}
    if language != "Auto Detect": data["language"] = "en" if language == "English" else "ur"
    
    try:
        response = requests.post(GROQ_AUDIO_URL, headers=headers, files=files, data=data)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
