# 🗳️ SmartChunaav AI

**A High-Fidelity, Multilingual Civic Assistant Powered by Grounded AI Intelligence.**

SmartChunaav AI is a production-grade civic-tech platform designed to eliminate information asymmetry in the Indian democratic process. By synthesizing **Google Gemini 2.0 Flash** with real-time Search Grounding, the system delivers hyper-localized, factually verified election intelligence in **13 native languages**.

---

## 🚀 Core Capabilities

| Feature | Description |
|---|---|
| 🌍 **Multilingual Localization** | Native support for 13 languages — Hindi, Gujarati, Marathi, Tamil, Telugu, and more — ensuring accessibility for diverse voter demographics. |
| 🔍 **Grounded Intelligence** | 100% of election data — including dates, candidate portfolios, and voting procedures — is verified via Google Search Grounding to prevent AI hallucinations. |
| 🎙️ **Accessible Audio Briefings** | Integrated gTTS (Google Text-to-Speech) provides instant audio summaries of complex political landscapes for inclusive accessibility. |
| ♿ **WCAG 2.1 Compliance** | Frontend built with semantic landmarks, `aria-live` regions, and keyboard-first navigation for a barrier-free user experience. |
| 🔒 **Hardened Infrastructure** | Production backend featuring `SecurityHeadersMiddleware` (HSTS, XSS protection) and strict CORS origin validation. |

---

## 🎨 Design System

The platform utilizes a **Civic-Centered Palette** designed to evoke institutional trust and reliability:

| Component | Color Hex | Rationale |
|---|---|---|
| 🟦 Primary: Deep Trust Blue | `#1E3A8A` | Represents institutional stability and authority. |
| 🟧 Accent: Action Orange | `#F97316` | Drives user engagement for critical calls-to-action. |
| ⚪ Surface: Neutral Slate | `#F8FAFC` | Provides maximum contrast for high-readability typography. |

---

## 🛠️ Technical Architecture

### The Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI (Python 3.11), Pydantic v2 Settings |
| **AI Engine** | Gemini 2.0 Flash + Google Search Tooling |
| **Infrastructure** | Google Cloud Run (Containerized via Docker) |

### Data Flow Pipeline

```
GPS Coordinates
      │
      ▼
Constituency Mapping (Geopy reverse-geocode → voting district)
      │
      ▼
Contextual Synthesis (Gemini + Google Search Tool → live election data)
      │
      ▼
Localized Delivery (Translated JSON → Audio-Visual Components)
```

---

## 📦 Installation & Deployment

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Cloud SDK (`gcloud`)

### 1. Backend Environment

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Unix:    source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
GOOGLE_API_KEY=your_key_here
GCP_PROJECT=your_project_id
CORS_ORIGINS=http://localhost:3000
APP_ENV=development
```

Run locally:

```bash
uvicorn main:app --reload --port 8080
```

### 2. Frontend Build

```bash
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build → move dist/ to backend/static/
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy smartchunaav-ai \
  --source ./backend \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=your_key,GCP_PROJECT=your_project,CORS_ORIGINS=*,APP_ENV=production"
```

---

## 🔌 API Reference

### `POST /api/election-guide`

Returns structured election intelligence for a GPS coordinate.

**Request body:**
```json
{
  "latitude": 23.0225,
  "longitude": 72.5714,
  "language": "Gujarati"
}
```

**Response:** JSON with `timeline`, `voting_steps`, `key_candidates`, `ruling_parties`, `resources`, and TTS audio as base64 MP3.

### `GET /api/location?lat={lat}&lon={lon}`

Lightweight reverse-geocode endpoint. Returns the human-readable location for the supplied coordinates.

---

## 🛡️ Non-Partisan Protocol

SmartChunaav AI is built on a foundation of **strict neutrality**. The system instructions explicitly prohibit:

- ❌ Partisan opinions or political commentary
- ❌ Candidate endorsements of any kind
- ❌ Speculative content not grounded in verified sources

All intelligence is sourced from verified official records and grounded search results.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
