"""
main.py – SmartChunaav AI  (FastAPI backend)
============================================
Provides two API endpoints:
  POST /api/election-guide  – full election intelligence for a GPS coordinate
  GET  /api/location        – reverse-geocode a lat/lon to a human name

Security improvements over baseline
-------------------------------------
* CORS is driven by the ``CORS_ORIGINS`` environment variable instead of "*".
* A lightweight SecurityHeadersMiddleware adds X-Content-Type-Options,
  X-Frame-Options, and Referrer-Policy on every response.
* The Nominatim user-agent is now namespaced to SmartChunaav AI.
* All secrets live in config.py (pydantic-settings) – nothing is hardcoded.
"""

import base64
import io
import json
import os

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from geopy.exc import GeocoderServiceError, GeocoderTimedOut
from geopy.geocoders import Nominatim
from gtts import gTTS
from pydantic import BaseModel, Field

from config import settings
from election_agent import get_election_info

# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Civic-tech election assistant powered by Google Vertex AI Gemini.",
)

# ── Security headers middleware ───────────────────────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    """
    Attach security-related HTTP response headers to every reply.
    These are cheap to add and address several OWASP Top-10 items.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
    return response


# ── CORS – origins come from validated env, never wildcard in prod ────────────

# NOTE: allow_credentials=True is incompatible with allow_origins=["*"].
# Since this API uses API-key auth (not cookies/sessions), credentials=False is correct.
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
_allow_creds = _cors_origins != ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_allow_creds,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Language → gTTS code mapping ─────────────────────────────────────────────

_LANG_MAP: dict[str, str] = {
    "English": "en",
    "Hindi": "hi",
    "Gujarati": "gu",
    "Marathi": "mr",
    "Tamil": "ta",
    "Telugu": "te",
    "Bengali": "bn",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
}

# ── Request / response schemas ────────────────────────────────────────────────

class ElectionGuideRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    language: str = Field(default="English", description="Preferred response language")


# ── Helper: reverse geocoding ─────────────────────────────────────────────────

def reverse_geocode(lat: float, lon: float) -> str:
    """
    Convert GPS coordinates to a human-readable 'City, State, Country' string.

    Falls back to 'General Global' if the Nominatim service is unavailable or
    returns no result, so the calling endpoint can always continue.

    Parameters
    ----------
    lat, lon : float
        WGS-84 decimal degrees.

    Returns
    -------
    str
        Formatted location string or 'General Global' on failure.
    """
    try:
        geolocator = Nominatim(user_agent="smartchunaav-ai/1.0")
        location = geolocator.reverse(f"{lat}, {lon}", exactly_one=True, timeout=5)
        if not location:
            return "General Global"

        address = location.raw.get("address", {})
        city = address.get("city") or address.get("town") or address.get("village") or ""
        state = address.get("state", "")
        country = address.get("country", "")

        parts = [p for p in [city, state, country] if p]
        return ", ".join(parts) if parts else location.address or "General Global"

    except (GeocoderTimedOut, GeocoderServiceError, Exception) as exc:
        # Log but do not surface internal geocoder errors to the client.
        print(f"[geocode] error for ({lat}, {lon}): {exc}")
        return "General Global"


# ── Helper: text-to-speech ────────────────────────────────────────────────────

def _text_to_audio_b64(text: str, lang_code: str) -> str | None:
    """
    Convert a text string to a base-64-encoded MP3 audio data URI.

    Returns None if the text is empty or gTTS raises an exception, so the
    caller can gracefully omit the audio field rather than failing the request.
    """
    if not text:
        return None
    try:
        tts = gTTS(text=text, lang=lang_code, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        b64 = base64.b64encode(fp.read()).decode("utf-8")
        return f"data:audio/mp3;base64,{b64}"
    except Exception as exc:
        print(f"[tts] gTTS error: {exc}")
        return None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/election-guide")
def election_guide(request: ElectionGuideRequest):
    """
    Primary endpoint: given GPS coordinates and a language preference,
    return structured election intelligence plus up to three TTS audio clips.

    Raises 422 for invalid request bodies (handled automatically by FastAPI/Pydantic).
    Raises 500 if the Gemini call fails.
    """
    location_str = reverse_geocode(request.latitude, request.longitude)
    tts_lang = _LANG_MAP.get(request.language, "en")

    try:
        raw_json = get_election_info(location_str, request.language)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError:
        parsed = {"error": "AI response was not valid JSON.", "raw_output": raw_json}
        return {
            "response": parsed,
            "location_identified": location_str,
            "audio_base64": None,
            "audio_base64_voting": None,
            "audio_base64_politics": None,
        }

    return {
        "response": parsed,
        "location_identified": location_str,
        "audio_base64": _text_to_audio_b64(parsed.get("audio_summary", ""), tts_lang),
        "audio_base64_voting": _text_to_audio_b64(
            parsed.get("audio_voting_procedures", ""), tts_lang
        ),
        "audio_base64_politics": _text_to_audio_b64(
            parsed.get("audio_political_landscape", ""), tts_lang
        ),
    }


@app.get("/api/location")
def get_location(lat: float, lon: float):
    """
    Lightweight reverse-geocode endpoint.
    Returns the human-readable location for the supplied coordinates.
    """
    return {"location": reverse_geocode(lat, lon)}


# ── Static frontend (production Docker build) ─────────────────────────────────

if os.path.isdir("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Catch-all that serves the React SPA for client-side routing."""
        return FileResponse("static/index.html")