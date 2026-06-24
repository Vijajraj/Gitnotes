import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(override=True)

# Print status for visibility
print("GitNotes direct Groq LLaMA pipeline loaded (No LangGraph/LangChain).")

def parse_safely(raw: str) -> dict:
    """
    Cleans markdown code fences (like ```json ... ```) from the LLM output
    and parses it into a Python dictionary.
    """
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()
    
    start = raw.find('{')
    end = raw.rfind('}') + 1
    if start == -1 or end == 0:
        raise ValueError('LLM did not return a valid JSON object')
    
    return json.loads(raw[start:end])

async def generate_changelog_agent(commits: List[Dict[str, Any]], to_tag: str) -> dict:
    """
    Directly calls Groq API to generate technical changelog and executive summary.
    This is the original linear pipeline without LangGraph and LangSmith.
    """
    # Format commits for prompt
    commits_text = ""
    for c in commits:
        pr_str = f" (PR #{c['pr_number']})" if c.get('pr_number') else ""
        
        # PR-first choice for title/subject
        title = c.get('pr_title') or c.get('subject', '')
        is_pr_explicit = bool(c.get('pr_title'))
        pr_label = "[PR Title] " if is_pr_explicit else "[Commit] "
        
        commits_text += f"- [{c['sha']}] {pr_label}{title}{pr_str} by {c['author']}\n"
        if c.get('message') and len(c['message']) > len(c['subject']):
            body = c['message'][len(c['subject']):].strip()
            if body:
                commits_text += f"  Details/Description: {body[:80]}...\n"
                
    user_prompt = f"""Analyze the following list of commits and merged Pull Requests (PRs) to generate a structured release document.

PR-First Ingestion Rule:
- When a change has a PR title explicitly provided, it takes precedence over raw git commit messages as PR titles are more descriptive and intentional.
- Weight PR descriptions and merge details more heavily in the output changelog categories and summaries.

Commits and PRs:
{commits_text}

You MUST return a JSON object with exactly the following structure:
{{
  "technical_changelog": "## [Version] - Date\\n\\n### Added\\n- Feature...\\n\\n### Fixed\\n- Bug...",
  "executive_summary": "### Release Overview\\n\\n...",
  "breaking_detected": true/false,
  "categories": {{
    "breaking": ["List here only breaking changes", "..."],
    "features": ["List here new features", "..."],
    "fixes": ["List here bug fixes", "..."],
    "performance": ["List performance improvements", "..."],
    "chores": ["List dependency updates, documentation changes, chores", "..."]
  }}
}}
"""

    messages = [
        {"role": "system", "content": "You are a precise JSON generator. You output ONLY JSON matching the requested structure without any conversational filler or formatting wrappers."},
        {"role": "user", "content": user_prompt}
    ]

    try:
        # Initialize Groq client
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Create chat completion
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.2,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        parsed = parse_safely(response.choices[0].message.content)
        
        # Verify breaking_detected flag autonomously based on inputs
        breaking_detected = parsed.get("breaking_detected", False)
        categories = parsed.get("categories", {})
        
        # If any commit contains breaking change indicators and breaking list or flag is empty, auto-heal it
        breaking_indicators = ["breaking", "removed", "⚠️", "critical", "deprecated"]
        has_breaking_commits = False
        for c in commits:
            msg = c.get("message", "").lower()
            subj = c.get("subject", "").lower()
            if any(ind in msg or ind in subj for ind in breaking_indicators):
                has_breaking_commits = True
                break
                
        if has_breaking_commits:
            breaking_detected = True
            
        return {
            "technical_changelog": parsed.get("technical_changelog", ""),
            "executive_summary": parsed.get("executive_summary", ""),
            "breaking_detected": breaking_detected,
            "categories": categories
        }
    except Exception as e:
        print(f"Error in generate_changelog: {e}")
        return {
            "technical_changelog": f"## [Error]\n\nFailed to generate changelog: {str(e)}",
            "executive_summary": "Error occurred during generation.",
            "breaking_detected": False,
            "categories": {
                "breaking": [],
                "features": [],
                "fixes": [],
                "performance": [],
                "chores": []
            }
        }
