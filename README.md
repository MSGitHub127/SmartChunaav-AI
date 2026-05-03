🗳️ SmartChunaav AI: Empowering Every Voter 🇮🇳
SmartChunaav AI is a high-performance, non-partisan civic-tech assistant designed to bridge the information gap in the democratic process. By leveraging Google Gemini with real-time Search Grounding, it provides verified, localized election intelligence to users across India and beyond.  
+2

🌟 Key Features
🌍 Multilingual Intelligence: Native support for 13 languages, including Hindi, Gujarati, Marathi, Tamil, Telugu, and more, ensuring no voter is left behind.  

🔍 Grounded Fact-Checking: Uses Google Search Grounding to provide the most current election timelines, candidate portfolios, and voting procedures, eliminating AI hallucinations.  

🎙️ Instant Audio Summaries: Integrated Text-to-Speech (gTTS) provides accessible audio briefings on the political landscape and voting steps.  

♿ Accessibility First: Built with a focus on WCAG 2.1 AA compliance, featuring semantic landmarks, aria-live regions, and full keyboard navigation.  

🔒 Enterprise-Grade Security: Hardened with SecurityHeadersMiddleware (XSS protection, Frame options) and strict CORS origin validation.  

🎨 Visual Identity
The interface is built with a Civic-Centered Palette designed to evoke trust and urgency:

🟦 Deep Trust Blue (#1E3A8A): The primary color for institutional reliability.  

🟧 Action Orange (#F97316): Used for critical calls-to-action and "Get Election Intelligence" buttons.  

⚪ Neutral Clarity: High-contrast typography and generous whitespace for maximum readability.  

🛠️ The Tech Stack
Frontend
React 18 + Vite for a lightning-fast SPA experience.  

Tailwind CSS for responsive, mobile-first design.  

Lucide React for sharp, accessible iconography.  

Backend
FastAPI: High-performance Python framework for low-latency API responses.  

Pydantic Settings: Robust environment variable management and startup validation.

Geopy: Reverse-geocoding coordinates to human-readable locations.  

AI & Data
Google Gemini 2.0 Flash: The core reasoning engine for structured election intelligence.  

Google Search Tool: Live grounding for real-time factual accuracy.  

gTTS: Generating localized audio summaries on-the-fly.  

🚀 Deployment & Hosting
The application is containerized and optimized for Google Cloud Run:

🐳 Dockerized: Uses a multi-stage Dockerfile to serve the React frontend as static assets via FastAPI.  

⚙️ Cloud-Ready: Configured with a Procfile for seamless scaling and port management on port 8080.  

⚡ Edge Performance: Deployed in the asia-south1 (Mumbai) region for minimum latency for Indian users.

📜 Local Setup
Clone the Repo:

Bash
git clone https://github.com/MSGitHub127/SmartChunaav-AI.git
Set Environment Variables:
Create a .env file in the backend folder:

Plaintext
    GOOGLE_API_KEY=your_gemini_key
    GCP_PROJECT=your_project_id
    APP_ENV=development
    ```
3.  **Run the Engines:**
    *   **Backend:** `uvicorn main:app --reload`[cite: 2]
    *   **Frontend:** `npm run dev`[cite: 1]

---

## 🛡️ Non-Partisan Commitment
**SmartChunaav AI** is strictly neutral. All candidate data and portfolios are generated using unbiased search results, and the system instruction explicitly forbids taking political stances or favoring specific parties[cite: 3].
