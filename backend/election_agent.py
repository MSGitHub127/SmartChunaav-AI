"""
election_agent.py – SmartChunaav AI
Wraps Google Vertex AI Gemini to return structured, schema-validated
election information grounded by Google Search.

Design decisions
----------------
* The `genai.Client` is created once at module level inside a factory so it
  can be easily mocked in tests without patching global state.
* The Gemini response schema is defined once as a module constant to avoid
  re-building it on every request (minor CPU win, big readability win).
* All Vertex AI / network errors are caught here and re-raised as plain
  ValueError so callers don't need to import google-genai internals.
"""

from google import genai
from google.genai import types
from google.genai.types import Schema, Type

from config import settings

# ── Schema (built once at import time) ───────────────────────────────────────

_ELECTION_SCHEMA = Schema(
    type=Type.OBJECT,
    properties={
        "audio_summary": Schema(
            type=Type.STRING,
            description="2-3 sentence overview of the election situation for TTS.",
        ),
        "timeline": Schema(
            type=Type.ARRAY,
            description="Chronological election events, categorised by level.",
            items=Schema(
                type=Type.OBJECT,
                properties={
                    "date": Schema(type=Type.STRING),
                    "level": Schema(
                        type=Type.STRING,
                        description="'National', 'State', or 'Local'",
                    ),
                    "title": Schema(type=Type.STRING),
                    "description": Schema(type=Type.STRING),
                },
                required=["date", "level", "title", "description"],
            ),
        ),
        "next_election_date": Schema(
            type=Type.STRING,
            description=(
                "ISO date (YYYY-MM-DD) of the next upcoming election. "
                "Estimate year+month if the exact day is unknown. NEVER return 'Unknown'."
            ),
        ),
        "voting_steps": Schema(
            type=Type.ARRAY,
            description="Numbered, step-by-step voting instructions.",
            items=Schema(
                type=Type.OBJECT,
                properties={
                    "step_number": Schema(type=Type.INTEGER),
                    "title": Schema(type=Type.STRING),
                    "description": Schema(type=Type.STRING),
                },
                required=["step_number", "title", "description"],
            ),
        ),
        "resources": Schema(
            type=Type.ARRAY,
            items=Schema(
                type=Type.OBJECT,
                properties={
                    "title": Schema(type=Type.STRING),
                    "url": Schema(type=Type.STRING),
                    "type": Schema(
                        type=Type.STRING,
                        description="One of: 'youtube', 'official', or 'news'.",
                    ),
                },
                required=["title", "url", "type"],
            ),
        ),
        "ruling_parties": Schema(
            type=Type.ARRAY,
            items=Schema(
                type=Type.OBJECT,
                properties={
                    "level": Schema(type=Type.STRING),
                    "party_name": Schema(type=Type.STRING),
                    "leader_name": Schema(type=Type.STRING),
                    "party_color": Schema(
                        type=Type.STRING,
                        description="Valid hex colour code, e.g. '#FF5733'",
                    ),
                },
                required=["level", "party_name", "leader_name", "party_color"],
            ),
        ),
        "key_candidates": Schema(
            type=Type.ARRAY,
            items=Schema(
                type=Type.OBJECT,
                properties={
                    "party_name": Schema(type=Type.STRING),
                    "candidate_name": Schema(type=Type.STRING),
                    "portfolio": Schema(
                        type=Type.STRING,
                        description="Strictly neutral, 2-sentence background.",
                    ),
                    "party_color": Schema(type=Type.STRING),
                },
                required=["party_name", "candidate_name", "portfolio", "party_color"],
            ),
        ),
        "audio_voting_procedures": Schema(
            type=Type.STRING,
            description="2-sentence TTS script summarising the voting process.",
        ),
        "audio_political_landscape": Schema(
            type=Type.STRING,
            description="2-sentence TTS script summarising ruling parties and candidates.",
        ),
    },
    required=[
        "audio_summary",
        "timeline",
        "next_election_date",
        "voting_steps",
        "resources",
        "ruling_parties",
        "key_candidates",
        "audio_voting_procedures",
        "audio_political_landscape",
    ],
)

_SYSTEM_INSTRUCTION = (
    "You are SmartChunaav AI – a non-partisan civic election assistant. "
    "Provide accurate, unbiased information about elections and voting procedures "
    "using only facts retrieved via Google Search. "
    "You MUST include at least one relevant educational YouTube video link in the resources array."
)


# Around line 123 in election_agent.py
def _build_client() -> genai.Client:
    """Instantiates the Gemini client using an API Key."""
    return genai.Client(
        api_key=settings.google_api_key,
        # Remove vertexai=True or other GCP-specific args
    )


# Module-level singleton – created once, reused across requests.
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Returns the shared client, creating it on first call (lazy init)."""
    global _client
    if _client is None:
        _client = _build_client()
    return _client


def get_election_info(location: str, language: str) -> str:
    """
    Query Gemini for structured, grounded election data for a given location.

    Parameters
    ----------
    location : str
        Human-readable location string, e.g. "Ahmedabad, Gujarat, India".
    language : str
        Target response language, e.g. "Gujarati" or "English".

    Returns
    -------
    str
        A JSON string that conforms to ``_ELECTION_SCHEMA``.

    Raises
    ------
    ValueError
        If the Vertex AI API call fails for any reason, with a human-readable
        message safe to surface in an HTTP 500 response detail.
    """
    prompt = (
        f"Location: {location}\n"
        f"Requested Language: {language}\n\n"
        "Please provide the following information:\n"
        "1. Upcoming election timelines for this location. Categorise into "
        "Local, State/Provincial, and National levels. Include significant "
        "recent past elections and all upcoming elections. Keep it structured.\n"
        "2. Step-by-step voting instructions and requirements.\n"
        "3. Relevant non-partisan educational data about the electoral process.\n"
        "Research the current ruling parties and leaders at Local, State, and "
        "National levels. Provide key candidates with unbiased, non-partisan "
        "portfolios. If candidates are unannounced, state "
        "'Awaiting official party nomination'. Return accurate hex codes for "
        "party colours.\n"
        "Translate the entire response natively into the requested language."
    )

    try:
        response = _get_client().models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=_SYSTEM_INSTRUCTION,
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json",
                response_schema=_ELECTION_SCHEMA,
            ),
        )
        return response.text
    except Exception as exc:
        # Wrap all google-genai exceptions so callers stay decoupled from the SDK.
        raise ValueError(f"Gemini API error: {exc}") from exc