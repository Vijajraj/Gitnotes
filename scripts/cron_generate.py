import os
import sys
import httpx
import asyncio
from dotenv import load_dotenv

# Ensure the backend directory is in the import path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from github_service import fetch_changes, parse_github_url
from groq_service import generate_changelog_agent

load_dotenv()

async def run_cron():
    repo_url = os.getenv("REPOSITORY_URL", "https://github.com/Vijajraj/Gitnotes")
    owner, repo = parse_github_url(repo_url)
    
    token = os.getenv("GITHUB_TOKEN")
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not groq_api_key:
        print("ERROR: GROQ_API_KEY is not configured.")
        sys.exit(1)
        
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitNotes-Cron-Agent"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    print(f"Retrieving tags list for {owner}/{repo}...")
    
    async with httpx.AsyncClient() as client:
        # Fetch repository tags
        tags_url = f"https://api.github.com/repos/{owner}/{repo}/tags?per_page=5"
        resp = await client.get(tags_url, headers=headers)
        
        from_tag = None
        to_tag = None
        
        if resp.status_code == 200:
            tags_data = resp.json()
            if len(tags_data) >= 2:
                to_tag = tags_data[0]["name"]
                from_tag = tags_data[1]["name"]
                print(f"Comparing tags: {from_tag} -> {to_tag}")
            elif len(tags_data) == 1:
                to_tag = tags_data[0]["name"]
                print(f"Single tag found: {to_tag}. Comparing with default branch.")
            else:
                print("No tags found. Falling back to default branch recent commits.")
        else:
            print(f"Failed to fetch tags: {resp.status_code}. Falling back to default branch commits.")

        # 1. Fetch changes
        print(f"Fetching logs for {repo_url}...")
        changes = await fetch_changes(repo_url, from_tag, to_tag)
        commits = changes["commits"]
        
        if not commits:
            print("No commits found to document. Exiting.")
            sys.exit(0)
            
        # 2. Generate Release Notes
        print("Generating Release Changelog via Groq LLaMA...")
        result = await generate_changelog_agent(commits, to_tag or "latest")
        changelog = result.get("technical_changelog", "")
        
        if not changelog or changelog.startswith("## [Error]"):
            print("Changelog generation failed. Exiting.")
            sys.exit(1)
            
        # 3. Write to CHANGELOG.md
        changelog_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "CHANGELOG.md")
        
        existing_content = ""
        if os.path.exists(changelog_path):
            with open(changelog_path, "r", encoding="utf-8") as f:
                existing_content = f.read()
                
        # Append or prepend the new log entry
        header_marker = "# Release Notes"
        if header_marker in existing_content:
            body_content = existing_content.replace(header_marker, "").strip()
            new_content = f"{header_marker}\n\n{changelog}\n\n---\n\n{body_content}"
        else:
            new_content = f"# Release Notes\n\n{changelog}\n\n{existing_content}"
            
        with open(changelog_path, "w", encoding="utf-8") as f:
            f.write(new_content)
            
        print("CHANGELOG.md successfully updated locally.")

if __name__ == "__main__":
    asyncio.run(run_cron())
