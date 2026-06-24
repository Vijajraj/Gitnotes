# GitNotes: Release Intelligence Agent

**GitNotes** is a full-stack automated documentation generator that converts raw development artifacts—commits, pull requests, and code diffs—into structured release documentation. 

With a single action, it simultaneously generates a **technical changelog** for engineers (using Conventional Commit standards) and a clean **executive summary** for product managers and business stakeholders.

---

## 🎨 Vercel/Linear-Inspired Developer Aesthetic

Built with a dark, hyper-minimalist developer dashboard style:
- **Terminal Simulation**: An animated console progress simulator that outputs step-by-step pipeline status.
- **Interactive Outputs**: Tabs to easily switch between *Technical Changelog*, *Executive Summary*, and *Categorized Log*.
- **Metrics Dashboard**: Quick statistics on total commits analyzed, PR counts, execution times, and breaking changes.
- **Breaking Changes Banner**: Auto-detects critical breaking changes or deprecations and presents them in a distinct crimson warning banner.

---

## 🚀 Key Features

- **Dual-Audience Outputs**: One-click generation of engineering changelogs and plain-English summaries.
- **Dynamic Tag Resolution**: Automatically detects and heals tag mismatches (e.g. resolves `v0.100.0` vs `0.100.0` depending on repository convention).
- **Optional Tags Fallback**: Leaving tags blank dynamically falls back to analyzing the latest 30 commits of the repository's default branch. Providing a single tag compares it to the default branch.
- **Graceful Token Fallback**: Automatically bypasses credentials issues by falling back to unauthenticated requests if an invalid `GITHUB_TOKEN` is detected.
- **Zero-Fail Demo Mode**: A toggleable offline mode (`DEMO_MODE` inside `demoData.js`) that uses cached data and mocks the generation timeline—essential for zero-fail hackathon presentations.

---

## ⚡ Technology Stack

- **Backend**: Python, FastAPI, Groq LLaMA 3.1 8B (via official `groq` SDK), `python-dotenv`, `httpx`
- **Frontend**: React, Vite, Tailwind CSS v4, `lucide-react` icons
- **Package Managers**: `pip` (Python), `npm` (Node.js)

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

## 🏃 Running the Application

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
   Open **`http://localhost:5173`** (or the port Vite prompts) in your browser.

---

## 🧪 Testing

The backend includes a comprehensive, dependencies-free unit test suite checking URL parsing, JSON formatting, and edge cases.
To run the tests:
```bash
cd backend
# With virtualenv active:
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