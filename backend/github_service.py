import os
import re
import httpx
from typing import List, Dict, Any, Optional

# Startup GitHub Token Check print
token = os.getenv("GITHUB_TOKEN")
if token and token.strip():
    print("[OK] GitHub Token: authenticated (5000 req/hr)")
else:
    print("[WARN] GitHub Token: not set (60 req/hr limit)")

def parse_github_url(url: str) -> tuple[str, str]:
    """
    Extracts owner and repo name from a GitHub URL.
    Handles formats like:
      - https://github.com/owner/repo
      - https://github.com/owner/repo.git
      - git@github.com:owner/repo.git
    """
    url = url.strip()
    url = re.sub(r'/+$', '', url)
    if url.endswith('.git'):
        url = url[:-4]
    
    match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
    if match:
        return match.group(1), match.group(2)
        
    match = re.search(r'git@github\.com:([^/]+)/([^/]+)', url)
    if match:
        return match.group(1), match.group(2)
        
    parts = [p for p in url.split('/') if p]
    if len(parts) >= 2:
        return parts[-2], parts[-1]
        
    raise ValueError(f"Invalid GitHub repository URL: {url}")

async def check_tag_exists(client: httpx.AsyncClient, owner: str, repo: str, tag: str, headers: dict) -> bool:
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{tag}"
    try:
        resp = await client.get(url, headers=headers, timeout=10.0)
        return resp.status_code == 200
    except Exception:
        return False

async def resolve_tag(client: httpx.AsyncClient, owner: str, repo: str, tag: str, headers: dict) -> str:
    # 1. Try exact tag
    if await check_tag_exists(client, owner, repo, tag, headers):
        return tag
    
    # 2. Try alternative with/without 'v' prefix
    alt_tag = tag[1:] if tag.startswith('v') else f"v{tag}"
    if await check_tag_exists(client, owner, repo, alt_tag, headers):
        print(f"[OK] Resolved tag '{tag}' to '{alt_tag}'")
        return alt_tag
        
    return tag

async def fetch_changes(repo_url: str, from_tag: str, to_tag: str) -> Dict[str, Any]:
    """
    Fetches the commits between from_tag and to_tag using GitHub API.
    Handles specific errors (rate limits, missing tags, missing repos) gracefully.
    Returns a dict with commits list and capping metadata.
    """
    owner, repo = parse_github_url(repo_url)
    
    token = os.getenv("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitNotes-Changelog-Agent"
    }
    if token and token.strip():
        headers["Authorization"] = f"Bearer {token.strip()}"
        
    async with httpx.AsyncClient() as client:
        # Pre-flight repo check to verify repository and credentials
        repo_check = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
        
        # Handle 401 Unauthorized (Bad credentials) gracefully by falling back to unauthenticated
        if repo_check.status_code == 401 and "Authorization" in headers:
            print("[WARN] GitHub token returned 401 (Bad Credentials). Retrying without token...")
            del headers["Authorization"]
            repo_check = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            
        if repo_check.status_code == 404:
            raise ValueError(f"Repository {owner}/{repo} does not exist")
            
        # Resolve tags (dynamically handles v-prefix mismatch)
        resolved_from = await resolve_tag(client, owner, repo, from_tag, headers)
        resolved_to = await resolve_tag(client, owner, repo, to_tag, headers)
        
        api_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{resolved_from}...{resolved_to}"
        response = await client.get(api_url, headers=headers, timeout=15.0)
        
        # Check for rate limiting specifically
        if response.status_code in (403, 429):
            rate_limit_remaining = response.headers.get("x-ratelimit-remaining")
            if rate_limit_remaining == "0" or "rate limit" in response.text.lower():
                raise ValueError("GitHub rate limit exceeded. Add GITHUB_TOKEN to increase limit.")
        
        # Check for not found errors specifically
        if response.status_code == 404:
            # Diagnose which tag is missing (using the original inputs for error message consistency)
            from_check = await client.get(f"https://api.github.com/repos/{owner}/{repo}/commits/{resolved_from}", headers=headers)
            if from_check.status_code == 404:
                raise ValueError(f"Tag '{from_tag}' not found in {owner}/{repo}")
                
            to_check = await client.get(f"https://api.github.com/repos/{owner}/{repo}/commits/{resolved_to}", headers=headers)
            if to_check.status_code == 404:
                raise ValueError(f"Tag '{to_tag}' not found in {owner}/{repo}")
                
            # Generic tag/compare mismatch fallback
            raise ValueError(f"Tag '{from_tag}' or '{to_tag}' not found in {owner}/{repo}")
            
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
        
        if not commits_data:
            raise ValueError("No commits found between these tags")
            
        normalized_commits = []
        total_commits = len(commits_data)
        
        # Extract unique PR count from the commits
        unique_prs = set()
        
        # Capping at 50 commits to prevent context token overflow and rate limits
        for c in commits_data[-50:]:
            commit_info = c.get("commit", {})
            message = commit_info.get("message", "")
            subject = message.split("\n")[0].strip() if message else ""
            
            author_info = c.get("author")
            author_name = author_info.get("login") if author_info else commit_info.get("author", {}).get("name", "Unknown")
            
            date = commit_info.get("author", {}).get("date", "")
            sha = c.get("sha", "")
            short_sha = sha[:7]
            
            pr_title = None
            pr_number = None
            
            # 1. Check for squash merge (e.g. "Add validation helper (#124)")
            squash_match = re.search(r'^(.*?)\s*\(#(\d+)\)$', subject)
            if squash_match:
                pr_title = squash_match.group(1).strip()
                pr_number = squash_match.group(2)
            else:
                # 2. Check for merge commit (e.g. "Merge pull request #123 from ...")
                merge_match = re.search(r'Merge pull request #(\d+)', subject)
                if merge_match:
                    pr_number = merge_match.group(1)
                    lines = [l.strip() for l in message.split('\n') if l.strip()]
                    if len(lines) > 1:
                        pr_title = lines[1]
                else:
                    # 3. Fallback: Check if message contains "#123" anywhere
                    pr_match = re.search(r'#(\d+)', message)
                    if pr_match:
                        pr_number = pr_match.group(1)
            
            if pr_number:
                unique_prs.add(pr_number)
                
            normalized_commits.append({
                "sha": short_sha,
                "subject": subject,
                "message": message,
                "author": author_name,
                "date": date,
                "pr_number": pr_number,
                "pr_title": pr_title
            })
            
        return {
            "commits": normalized_commits,
            "total_commits": total_commits,
            "was_capped": total_commits > 50,
            "pr_count": len(unique_prs)
        }
