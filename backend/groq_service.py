import os
import json
from typing import List, Dict, Any, Literal
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# LangChain / LangGraph Imports
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END

# Load environment variables
load_dotenv()

# Print LangSmith Configuration status for visibility
if os.getenv("LANGCHAIN_TRACING_V2") == "true":
    print("LangSmith Tracing is ENABLED for GitNotes agent.")
else:
    print("LangSmith Tracing is DISABLED. Define LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in .env to activate.")

# 1. State Definition
class AgentState(BaseModel):
    commits: List[Dict[str, Any]] = Field(default_factory=list)
    technical_changelog: str = ""
    executive_summary: str = ""
    breaking_detected: bool = False
    categories: Dict[str, List[str]] = Field(default_factory=dict)
    critic_feedback: str = ""
    iterations: int = 0

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

# 2. Graph Nodes
def generate_changelog_node(state: AgentState) -> Dict[str, Any]:
    """
    Uses ChatGroq to generate the initial changelog or adjust it based on feedback.
    """
    commits = state.commits
    feedback = state.critic_feedback
    
    # Format commits for prompt
    commits_text = ""
    for c in commits:
        pr_str = f" (PR #{c['pr_number']})" if c.get('pr_number') else ""
        commits_text += f"- [{c['sha']}] by {c['author']}: {c['subject']}{pr_str}\n"
        if c.get('message') and len(c['message']) > len(c['subject']):
            body = c['message'][len(c['subject']):].strip()
            if body:
                commits_text += f"  Details: {body[:120]}...\n"
                
    user_prompt = f"""Analyze the following list of commits and generate a structured release document:

Commits:
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

    if feedback:
        user_prompt += f"""

⚠️ CRITIC FEEDBACK RECEIVED ON YOUR PREVIOUS ATTEMPT:
{feedback}

Please revise your previous output to resolve all points raised by the critic.
Your previous outputs were:
- Technical Changelog:
{state.technical_changelog}

- Executive Summary:
{state.executive_summary}

- Breaking Detected: {state.breaking_detected}
- Categories: {json.dumps(state.categories)}

Return the corrected JSON object.
"""

    messages = [
        {"role": "system", "content": "You are a precise JSON generator. You output ONLY JSON matching the requested structure without any conversational filler or formatting wrappers."},
        {"role": "user", "content": user_prompt}
    ]

    try:
        # Initialize Groq LLM
        chat = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=3000,
            groq_api_key=os.getenv("GROQ_API_KEY")
        ).bind(response_format={"type": "json_object"})
        
        response = chat.invoke(messages)
        parsed = parse_safely(response.content)
        
        return {
            "technical_changelog": parsed.get("technical_changelog", ""),
            "executive_summary": parsed.get("executive_summary", ""),
            "breaking_detected": parsed.get("breaking_detected", False),
            "categories": parsed.get("categories", {})
        }
    except Exception as e:
        print(f"Error in generate_changelog_node: {e}")
        # Fallback dictionary to avoid workflow crash
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

def critic_validator_node(state: AgentState) -> Dict[str, Any]:
    """
    Autonomous validation layer checking for JSON compliance and missed breaking changes.
    """
    feedback_msgs = []
    
    # 1. Validation checks
    if not state.technical_changelog or state.technical_changelog.startswith("## [Error]"):
        feedback_msgs.append("Changelog generation failed or is empty.")
    if not state.executive_summary or state.executive_summary.startswith("Error"):
        feedback_msgs.append("Executive summary is empty or contains errors.")
        
    # 2. Check for missed breaking changes
    if not state.breaking_detected:
        breaking_indicators = ["breaking", "removed", "⚠️", "critical", "deprecated"]
        missed_commits = []
        for c in state.commits:
            msg = c.get("message", "").lower()
            subj = c.get("subject", "").lower()
            if any(ind in msg or ind in subj for ind in breaking_indicators):
                missed_commits.append(f"[{c['sha']}] '{c['subject']}'")
                
        if missed_commits:
            feedback_msgs.append(
                f"Validation Error: 'breaking_detected' is false, but commit messages indicate "
                f"breaking changes or deprecations: {', '.join(missed_commits)}. "
                f"Please update categories and mark breaking_detected as True."
            )
            
    if feedback_msgs:
        feedback_str = " ".join(feedback_msgs)
        print(f"Critic Validator FAILED (Iteration {state.iterations + 1}): {feedback_str}")
        return {
            "critic_feedback": feedback_str,
            "iterations": state.iterations + 1
        }
    else:
        print("Critic Validator PASSED successfully.")
        return {
            "critic_feedback": ""
        }

# 3. Graph Routing Logic
def should_continue(state: AgentState) -> Literal["generate_changelog", "__end__"]:
    if state.critic_feedback and state.iterations < 3:
        return "generate_changelog"
    return END

# 4. Graph Construction
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("generate_changelog", generate_changelog_node)
workflow.add_node("critic_validator", critic_validator_node)

# Add Edges
workflow.add_edge(START, "generate_changelog")
workflow.add_edge("generate_changelog", "critic_validator")
workflow.add_conditional_edges(
    "critic_validator",
    should_continue,
    {
        "generate_changelog": "generate_changelog",
        END: END
    }
)

# Compile LangGraph Workflow
agent_app = workflow.compile()

async def generate_changelog_agent(commits: List[Dict[str, Any]], to_tag: str) -> dict:
    """
    Orchestrates the compiled LangGraph agent using .ainvoke().
    """
    initial_state = {
        "commits": commits,
        "technical_changelog": "",
        "executive_summary": "",
        "breaking_detected": False,
        "categories": {},
        "critic_feedback": "",
        "iterations": 0
    }
    
    final_state = await agent_app.ainvoke(initial_state)
    
    return {
        "technical_changelog": final_state.get("technical_changelog", ""),
        "executive_summary": final_state.get("executive_summary", ""),
        "breaking_detected": final_state.get("breaking_detected", False),
        "categories": final_state.get("categories", {})
    }
