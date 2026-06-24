# GitNotes: Release Intelligence Agent

**GitNotes** is a full-stack automated documentation generator that converts raw development artifacts—commits, pull requests, and code diffs—into structured release documentation. 

With a single action, it simultaneously generates a **technical changelog** for engineers (using Conventional Commit standards) and a clean **executive summary** for product managers and business stakeholders.

---

## 🎨 "Linear meets Vercel" Premium Redesign

Built from scratch with a clean, confident, and professional developer dashboard style:
- **Dual Mode Theme System**: Deep dark (#0C0C0E) primary dark theme and pure white (#FAFAFA) light theme.
- **Three-State Toggle**: Pill-shaped switcher `[ ☀ | ◑ | ☾ ]` supporting Light, System, and Dark themes.
- **Side-by-Side Layout**: Fixed 320px sidebar for controls and a flexible main panel for viewport displays.
- **Pipeline Tracing**: Monospace vertical status checklist (`Fetch commits`, `Analyze changes`, `Generate docs`, `Complete`) with custom pulse glows and success states.
- **Breaking Changes Banner**: Auto-detects critical breaking changes or deprecations and presents them in a distinct crimson warning banner.

---

## 🚀 Key Features

- **Dual-Audience Outputs**: One-click generation of engineering changelogs and plain-English summaries.
- **Dynamic Tag Resolution**: Automatically detects and heals tag mismatches (e.g. resolves `v0.100.0` vs `0.100.0` depending on repository convention).
- **Optional Tags Fallback**: Leaving tags blank dynamically falls back to analyzing the latest 30 commits of the repository's default branch.
- **Graceful Token Fallback**: Automatically bypasses credentials issues by falling back to unauthenticated requests if an invalid `GITHUB_TOKEN` is detected.
- **Zero-Fail Demo Mode**: A toggleable offline mode (`DEMO_MODE` inside `demoData.js`) that uses cached data and mocks the generation timeline—essential for zero-fail hackathon presentations.

---

## ⚡ Technology Stack

- **Backend**: Python, FastAPI, Groq LLaMA 3.3 70B (`llama-3.3-70b-versatile` via official `groq` SDK), `python-dotenv`, `httpx`
- **Frontend**: React, Vite, Tailwind CSS v4, `react-markdown`
- **Package Managers**: `pip` (Python), `npm` (Node.js)

---

## ☁️ Production Deployment

### 1. Backend (Render Web Service)
This repository includes a `render.yaml` Blueprint specification for one-click Render deployment:
1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Blueprint**.
2. Select your `Gitnotes` repository.
3. Configure the following environment variables:
   * `GITHUB_TOKEN`: *Your GitHub Personal Access Token* (Classic or Fine-grained read-only)
   * `GROQ_API_KEY`: *Your Groq API Key*
4. Click **Apply**. Render will assign a public URL (e.g. `https://gitnotes-backend.onrender.com`).

### 2. Frontend (Vercel Host)
1. Deploy your frontend folder to Vercel.
2. In the Vercel Project settings, add an **Environment Variable**:
   * **Key**: `VITE_API_URL`
   * **Value**: *Your Render URL* (e.g. `https://gitnotes-backend.onrender.com`)
3. Trigger a redeploy to apply the environment variable.

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in `backend/` and configure your API keys:
   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   GROQ_API_KEY=your_groq_api_key
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application Locally

1. **Start the Backend Server**:
   From the `backend/` directory (with virtualenv active):
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will run at `http://localhost:8000`.

2. **Start the Frontend Dev Server**:
   From the `frontend/` directory:
   ```bash
   npm run dev
   ```
   Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

To run the backend unit test suite:
```bash
cd backend
python test_services.py
```

---

## 📡 API Endpoints

### `POST /api/generate`
Generates dual-audience changelogs for a repository.

**Request Body:**
```json
{
  "repo_url": "https://github.com/fastapi/fastapi",
  "from_tag": "0.100.0", // optional
  "to_tag": "0.101.0"     // optional
}
```

**Response Payload:**
```json
{
  "technical_changelog": "## [Version] ...",
  "executive_summary": "### Release Overview ...",
  "breaking_detected": false,
  "categories": {
    "breaking": [],
    "features": ["..."],
    "fixes": ["..."]
  }
}
```

### `GET /health`
Returns connection configuration status.
```json
{
  "status": "healthy",
  "github_token_configured": true,
  "groq_api_key_configured": true
}
```