import os
import re
import httpx
from typing import List, Dict, Any, Optional

def parse_github_url(url: str) -> tuple[str, str]:
    """
    Extracts owner and repo name from a GitHub URL.
    Handles formats like:
      - https://github.com/owner/repo
      - https://github.com/owner/repo.git
      - git@github.com:owner/repo.git
    """
    url = url.strip()
    # Remove trailing slashes
    url = re.sub(r'/+$', '', url)
    # Remove .git suffix
    if url.endswith('.git'):
        url = url[:-4]
    
    # Try HTTPS match
    match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
    if match:
        return match.group(1), match.group(2)
        
    # Try SSH match
    match = re.search(r'git@github\.com:([^/]+)/([^/]+)', url)
    if match:
        return match.group(1), match.group(2)
        
    # Fallback/Direct parse if already just owner/repo
    parts = [p for p in url.split('/') if p]
    if len(parts) >= 2:
        return parts[-2], parts[-1]
        
    raise ValueError(f"Invalid GitHub repository URL: {url}")

async def fetch_changes(repo_url: str, from_tag: str, to_tag: str) -> List[Dict[str, Any]]:
    """
    Fetches the commits between from_tag and to_tag using GitHub API.
    Normalizes and returns them.
    """
    owner, repo = parse_github_url(repo_url)
    
    token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitNotes-Changelog-Agent"
    }
    if token and token.strip():
        headers["Authorization"] = f"Bearer {token.strip()}"
        
    # Using GitHub Compare API
    # Docs: https://docs.github.com/en/rest/commits/commits#compare-two-commits
    api_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{from_tag}...{to_tag}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, headers=headers, timeout=15.0)
        
        if response.status_code == 404:
            raise ValueError(f"Repository or tags not found ({from_tag}...{to_tag})")
        elif response.status_code != 200:
            error_msg = f"GitHub API error: {response.status_code}"
            try:
                error_detail = response.json().get("message", "")
                if error_detail:
                    error_msg += f" - {error_detail}"
            except Exception:
                pass
            raise ValueError(error_msg)
            
        data = response.json()
        commits_data = data.get("commits", [])
        
        normalized_commits = []
        # Capping at 50 commits to prevent context token overflow and rate limits
        for c in commits_data[-50:]:
            commit_info = c.get("commit", {})
            message = commit_info.get("message", "")
            # Get first line of message as subject
            subject = message.split("\n")[0].strip() if message else ""
            
            author_info = c.get("author")
            author_name = author_info.get("login") if author_info else commit_info.get("author", {}).get("name", "Unknown")
            
            date = commit_info.get("author", {}).get("date", "")
            sha = c.get("sha", "")
            short_sha = sha[:7]
            
            # Extract PR number if present (e.g. "Merge pull request #123" or "Fix bug (#123)")
            pr_match = re.search(r'#(\d+)', message)
            pr_number = pr_match.group(1) if pr_match else None
            
            normalized_commits.append({
                "sha": short_sha,
                "subject": subject,
                "message": message,
                "author": author_name,
                "date": date,
                "pr_number": pr_number
            })
            
        return normalized_commits
