"""
test_main.py – SmartChunaav AI
================================
Unit / integration tests for the FastAPI backend.
Run with:  pytest backend/test_main.py -v

Mocking strategy
-----------------
* ``get_election_info`` is patched so tests never hit Vertex AI.
* The Nominatim geocoder is patched so tests work offline.
* ``gTTS`` is patched to avoid network calls and large binary blobs.
"""

import base64
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Patch settings BEFORE importing main so the app uses the test values.
import config

config.settings.gcp_project = "test-project"
config.settings.cors_origins = ["http://localhost:3000"]

from main import app, _text_to_audio_b64, reverse_geocode  # noqa: E402

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

MOCK_ELECTION_RESPONSE = {
    "audio_summary": "Test elections are upcoming in Test City.",
    "timeline": [
        {
            "date": "2025-12-01",
            "level": "National",
            "title": "General Election",
            "description": "National general election.",
        }
    ],
    "next_election_date": "2025-12-01",
    "voting_steps": [
        {
            "step_number": 1,
            "title": "Register",
            "description": "Register to vote at the official portal.",
        }
    ],
    "resources": [
        {
            "title": "Official Election Portal",
            "url": "https://example.gov/elections",
            "type": "official",
        }
    ],
    "ruling_parties": [
        {
            "level": "National",
            "party_name": "Demo Party",
            "leader_name": "Jane Doe",
            "party_color": "#1E3A8A",
        }
    ],
    "key_candidates": [
        {
            "party_name": "Demo Party",
            "candidate_name": "Jane Doe",
            "portfolio": "Experienced leader with 10 years in office.",
            "party_color": "#1E3A8A",
        }
    ],
    "audio_voting_procedures": "Register early and bring valid ID on election day.",
    "audio_political_landscape": "Demo Party currently leads with Jane Doe as candidate.",
}


# ── Test: reverse_geocode helper ──────────────────────────────────────────────

class TestReverseGeocode:
    """Tests for the reverse_geocode() utility function."""

    def test_returns_formatted_location_on_success(self):
        """A valid Nominatim response should return 'City, State, Country'."""
        mock_location = MagicMock()
        mock_location.raw = {
            "address": {
                "city": "Ahmedabad",
                "state": "Gujarat",
                "country": "India",
            }
        }
        mock_location.address = "Ahmedabad, Gujarat, India"

        with patch("main.Nominatim") as mock_nominatim:
            mock_nominatim.return_value.reverse.return_value = mock_location
            result = reverse_geocode(23.0225, 72.5714)

        assert result == "Ahmedabad, Gujarat, India"

    def test_falls_back_to_general_global_on_geocoder_error(self):
        """A GeocoderTimedOut should not crash the app; fallback is returned."""
        from geopy.exc import GeocoderTimedOut

        with patch("main.Nominatim") as mock_nominatim:
            mock_nominatim.return_value.reverse.side_effect = GeocoderTimedOut
            result = reverse_geocode(0.0, 0.0)

        assert result == "General Global"

    def test_falls_back_when_nominatim_returns_none(self):
        """None from Nominatim (unrecognised coordinate) → 'General Global'."""
        with patch("main.Nominatim") as mock_nominatim:
            mock_nominatim.return_value.reverse.return_value = None
            result = reverse_geocode(99.0, 199.0)

        assert result == "General Global"


# ── Test: GET /api/location ───────────────────────────────────────────────────

class TestLocationEndpoint:
    """Tests for GET /api/location."""

    def test_returns_location_key_in_json(self):
        """Response must always include a 'location' key."""
        with patch("main.reverse_geocode", return_value="Mumbai, Maharashtra, India"):
            response = client.get("/api/location?lat=19.076&lon=72.877")

        assert response.status_code == 200
        assert "location" in response.json()
        assert response.json()["location"] == "Mumbai, Maharashtra, India"

    def test_missing_query_params_returns_422(self):
        """FastAPI should reject requests missing required query parameters."""
        response = client.get("/api/location")
        assert response.status_code == 422

    def test_invalid_lat_returns_422(self):
        """Non-numeric lat should be rejected at the schema level."""
        response = client.get("/api/location?lat=abc&lon=72.5")
        assert response.status_code == 422


# ── Test: POST /api/election-guide ───────────────────────────────────────────

class TestElectionGuideEndpoint:
    """Tests for POST /api/election-guide – the primary endpoint."""

    def _post(self, payload: dict):
        return client.post("/api/election-guide", json=payload)

    def test_valid_request_returns_structured_response(self):
        """
        A well-formed request with a mocked AI response should return
        the expected keys and HTTP 200.
        """
        with (
            patch("main.reverse_geocode", return_value="New Delhi, Delhi, India"),
            patch(
                "main.get_election_info",
                return_value=json.dumps(MOCK_ELECTION_RESPONSE),
            ),
            patch("main.gTTS") as mock_gtts,
        ):
            # Make gTTS write empty bytes so we don't need real audio.
            mock_gtts.return_value.write_to_fp = lambda fp: fp.write(b"FAKEMP3")
            response = self._post({"latitude": 28.6, "longitude": 77.2, "language": "English"})

        assert response.status_code == 200
        body = response.json()
        assert "response" in body
        assert "location_identified" in body
        assert body["location_identified"] == "New Delhi, Delhi, India"
        assert body["response"]["next_election_date"] == "2025-12-01"

    def test_gemini_failure_returns_500(self):
        """If the AI layer raises ValueError the endpoint must return HTTP 500."""
        with (
            patch("main.reverse_geocode", return_value="Test City"),
            patch("main.get_election_info", side_effect=ValueError("Gemini API error: quota exceeded")),
        ):
            response = self._post({"latitude": 0.0, "longitude": 0.0, "language": "English"})

        assert response.status_code == 500
        assert "Gemini API error" in response.json()["detail"]

    def test_invalid_lat_out_of_range_returns_422(self):
        """Latitude outside [-90, 90] must be rejected by Pydantic validation."""
        response = self._post({"latitude": 999.0, "longitude": 0.0, "language": "English"})
        assert response.status_code == 422

    def test_malformed_ai_json_returns_error_in_response(self):
        """
        If Gemini returns non-JSON text (e.g. a markdown fence),
        the endpoint must not crash – it should surface an error dict.
        """
        with (
            patch("main.reverse_geocode", return_value="Somewhere"),
            patch("main.get_election_info", return_value="```not json```"),
        ):
            response = self._post({"latitude": 10.0, "longitude": 10.0, "language": "English"})

        assert response.status_code == 200
        assert "error" in response.json()["response"]


# ── Test: _text_to_audio_b64 helper ──────────────────────────────────────────

class TestTextToAudioHelper:
    """Unit tests for the TTS helper function."""

    def test_empty_text_returns_none(self):
        """An empty string must return None without calling gTTS."""
        assert _text_to_audio_b64("", "en") is None

    def test_valid_text_returns_data_uri(self):
        """A non-empty string should produce a 'data:audio/mp3;base64,...' URI."""
        with patch("main.gTTS") as mock_gtts:
            mock_gtts.return_value.write_to_fp = lambda fp: fp.write(b"FAKEMP3DATA")
            result = _text_to_audio_b64("Hello voter", "en")

        assert result is not None
        assert result.startswith("data:audio/mp3;base64,")
        # Verify the base64 payload is actually decodable.
        b64_part = result.split(",")[1]
        decoded = base64.b64decode(b64_part)
        assert decoded == b"FAKEMP3DATA"

    def test_gtts_exception_returns_none(self):
        """If gTTS raises, the function must swallow the error and return None."""
        with patch("main.gTTS", side_effect=Exception("network error")):
            result = _text_to_audio_b64("Test text", "hi")
        assert result is None


# ── Test: Security headers ────────────────────────────────────────────────────

class TestSecurityHeaders:
    """Verify that security headers are present on all responses."""

    def test_security_headers_present_on_location_endpoint(self):
        with patch("main.reverse_geocode", return_value="Test"):
            response = client.get("/api/location?lat=0.0&lon=0.0")

        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert "Referrer-Policy" in response.headers

    def test_cors_headers(self):
        # Test that CORS is enabled for frontend communication
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        }
        response = client.options("/api/election-guide", headers=headers)
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers