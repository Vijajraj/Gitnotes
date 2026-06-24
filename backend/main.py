import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import services
from github_service import fetch_changes
from groq_service import generate_changelog_agent

# Load environment variables
load_dotenv(override=True)

app = FastAPI(
    title="GitNotes API",
    description="Automated Changelog & Release Notes Generation API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins. Can be restricted to http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class ChangelogRequest(BaseModel):
    repo_url: str = Field(..., description="GitHub repository URL (e.g., https://github.com/fastapi/fastapi)")
    from_tag: Optional[str] = Field(None, description="Starting git tag/ref (e.g., v0.100.0)")
    to_tag: Optional[str] = Field(None, description="Ending git tag/ref (e.g., v0.101.0)")

@app.post("/api/generate")
async def generate_notes(request: ChangelogRequest):
    try:
        # Step 1: Ingest commits from GitHub
        print(f"Fetching changes for {request.repo_url} between {request.from_tag} and {request.to_tag}...")
        changes_data = await fetch_changes(request.repo_url, request.from_tag, request.to_tag)
        commits = changes_data["commits"]
        
        # Step 2: Generate notes using Groq LLaMA via LangGraph Agentic Critic Loop
        print(f"Generating changelog for {len(commits)} commits using LangGraph Agentic Critic Loop...")
        result = await generate_changelog_agent(commits, request.to_tag)
        
        # Check if the result has a generation error
        tech_log = result.get("technical_changelog", "")
        if tech_log.startswith("## [Error]") or "Failed to generate changelog" in tech_log:
            raise ValueError("AI service temporarily unavailable")
            
        # Enrich response with stats metadata
        result["total_commits"] = changes_data["total_commits"]
        result["was_capped"] = changes_data["was_capped"]
        result["pr_count"] = changes_data["pr_count"]
        
        return result
        
    except ValueError as ve:
        # Handled errors from inputs/API response issues
        print(f"ValueError: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        # Unexpected errors
        print(f"Error during changelog generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "github_token_configured": bool(os.getenv("GITHUB_TOKEN")),
        "groq_api_key_configured": bool(os.getenv("GROQ_API_KEY"))
    }
