# GitNotes: Release Intelligence Agent

**GitNotes** is a full-stack automated documentation generator that transforms raw git histories—commits, squash merges, and pull requests—into structured release documentation. 

With a single click, it processes raw developer activity to generate a **technical changelog** for engineers (adhering to Conventional Commit and Keep-a-Changelog standards) and a clean, high-impact **executive summary** for product managers and business stakeholders.

---

## 🎨 Premium Developer Dashboard ("Linear meets Vercel")

Designed with a sleek, minimal, and high-contrast developer aesthetic:
* **Dual Theme Design System**: Built with modern CSS variables supporting a deep dark primary theme (`#0C0C0E`) and a clean light theme (`#FAFAFA`).
* **Three-State Mode Switcher**: Pill-shaped control supporting `[ Light | System Sync | Dark ]` mode toggles.
* **Pipeline Tracing**: Monospace vertical status checklist (`Fetch commits` ➔ `Analyze changes` ➔ `Generate docs` ➔ `Complete`) with active pulsing glows and successful transition states.
* **Visual Category Chips**: Live summary indicators grouping changes by category (*Breaking*, *Features*, *Fixes*, *Performance*, *Chores*).
* **Dynamic Background Watermark**: A subtle, large background watermark displaying the active repository name.
* **Breaking Changes Banner**: Displays a distinct red warning alert block if any critical breaking change is identified.

---

## 🚀 Architectural & Functional Highlights

### 1. Ingestion Engine (`github_service.py`)
* **Flexible Ingestion Modes**:
  * **Mode A (Double Optional)**: If both starting and ending tags are empty, automatically fetches the latest 30 commits of the repository's default branch.
  * **Mode B (From Tag Only)**: If only the starting tag (`from_tag`) is provided, compares it against the default branch (`from_tag...default_branch`).
  * **Mode C (To Tag Only)**: If only the ending tag (`to_tag`) is provided, fetches the latest 30 commits leading up to that target tag.
  * **Mode D (Both Tags)**: Compares the version window directly between the two tags (`from_tag...to_tag`).
* **Tag Resolution & Healing**: Automatically checks tag availability. If missing, it attempts to resolve the tags by adding/removing the `v` prefix (e.g. `v1.2.0` vs `1.2.0` depending on the repository's naming convention).
* **PR-First Ingestion Rule**: Prioritizes Pull Request titles over raw git commit messages. It parses squash merges (e.g., `subject (#124)`), merge commits (e.g., `Merge pull request #123 from ...`), and message body PR numbers to map author and change contexts accurately.
* **Ingress Capping**: Limits ingestion to the latest 30 commits to prevent LLM token window blowouts and respect GitHub API rate limits.
* **Graceful Token Fallback**: Detects expired or bad `GITHUB_TOKEN` configurations (returning a `401 Unauthorized`) and automatically retries requests unauthenticated (falling back from 5,000 req/hr to the 60 req/hr public limit).

### 2. AI Reasoning & Generation (`groq_service.py`)
* **Groq LLaMA 3.3 70B Integration**: Uses `llama-3.3-70b-versatile` in JSON object mode (`response_format={"type": "json_object"}`) for near-instant inference (~3.5 seconds).
* **Auto-Healing Breaking Change Flag**: An autonomous validation routine scans all ingested commit messages for critical keywords (`breaking`, `removed`, `⚠️`, `critical`, `deprecated`). If found, it automatically overrides `breaking_detected = True` even if the LLM output missed it.
* **Zero-Framework Architecture**: Streamlined direct Groq integration. By removing heavier abstractions (like LangChain/LangGraph), the system guarantees execution latencies under 4 seconds.

### 3. Frontend Utility (`App.jsx` & `demoData.js`)
* **Zero-Fail Demo Mode**: A toggleable offline mode (`DEMO_MODE` inside `demoData.js`) that uses cached FastAPI releases and simulates the generation timeline—essential for zero-fail hackathon presentations and offline showcases.
* **One-Click Export**: Supports both instant copying to clipboard and downloading output as file assets (`CHANGELOG.md` or `RELEASE_NOTES.md`).

---

## ⚡ Technology Stack

* **Backend**: Python 3.10+, FastAPI, Groq official SDK, `python-dotenv`, `httpx`
* **Frontend**: React 18+, Vite, Tailwind CSS v4, `react-markdown`
* **Infrastructure / Deployment**: Render Blueprint (`render.yaml`) for backend services, Vercel for static frontend hosting.

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher

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
4. Create a `.env` file in the `backend/` folder:
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

1. **Start the Backend API Server**:
   From the `backend/` directory (with your virtual environment active):
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will run at `http://localhost:8000`.

2. **Start the Frontend Dev Server**:
   From the `frontend/` directory:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173`.

---

## 🧪 Testing

To run the backend unit test suite (validates URL parsing, JSON formatting safety, and error handling):
```bash
cd backend
# On Windows (PowerShell):
.\venv\Scripts\python.exe test_services.py
# On macOS/Linux:
python test_services.py
```

---

## 📡 API Endpoints

### `POST /api/generate`
Generates dual-audience changelogs and executive summaries.

**Request Payload:**
```json
{
  "repo_url": "https://github.com/fastapi/fastapi",
  "from_tag": "0.100.0", 
  "to_tag": "0.101.0"
}
```

*Note: `from_tag` and `to_tag` are optional.*

**Response Payload:**
```json
{
  "technical_changelog": "# Changelog\n\n## [0.101.0] - 2026-06-23\n\n### Added\n- Support for Python 3.12...",
  "executive_summary": "# Executive Summary\n\n### Release Overview\nFastAPI v0.101.0 introduces full compatibility with Python 3.12...",
  "breaking_detected": true,
  "categories": {
    "breaking": ["Removed deprecated include_in_schema parameter from internal APIRouter configuration (PR #10245)"],
    "features": ["Added comprehensive support for Python 3.12 syntax and runtime optimizations (PR #10240)"],
    "fixes": ["Fixed validation error response format mismatch under specific query parameters (PR #10242)"],
    "performance": ["Reduced application startup latency by 15% via lazy-loading internal validation models (PR #10233)"],
    "chores": ["Upgraded internal dependency httpx from 0.24 to 0.25 (PR #10230)"]
  },
  "total_commits": 30,
  "was_capped": true,
  "pr_count": 5
}
```

### `GET /health`
Validates backend availability and configuration of third-party API keys.
```json
{
  "status": "healthy",
  "github_token_configured": true,
  "groq_api_key_configured": true
}
```

---

## ☁️ Production Deployment

### 1. Backend (Render Blueprint Deployment)
This repository includes a `render.yaml` Blueprint specification for one-click deployment:
1. Go to your [Render Dashboard](https://dashboard.render.com/) and choose **New +** ➔ **Blueprint**.
2. Link your `Gitnotes` repository.
3. Configure the env variables:
   * `GITHUB_TOKEN`: *GitHub Personal Access Token (Classic or Fine-grained with read-only scopes)*
   * `GROQ_API_KEY`: *Groq Cloud API Key*
4. Click **Apply**. Render will host the backend (e.g. `https://gitnotes-backend.onrender.com`).

### 2. Frontend (Vercel Hosting)
1. Deploy the `frontend/` directory to Vercel.
2. Under Project Settings ➔ Environment Variables, configure:
   * **Key**: `VITE_API_URL`
   * **Value**: *Your Render Service URL* (e.g., `https://gitnotes-backend.onrender.com`)
3. Redeploy to apply environment changes.