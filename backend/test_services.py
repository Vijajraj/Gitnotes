"""
Test suite for GitNotes backend services.
Tests URL parsing, JSON parsing, critic validation, and state model.
"""
import os
import sys
import json

# Suppress Unicode errors on Windows console for test output
os.environ["PYTHONIOENCODING"] = "utf-8"

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Patch stdout/stderr to handle Unicode on Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from github_service import parse_github_url
from groq_service import parse_safely, AgentState, critic_validator_node

passed = 0
failed = 0

def test(name, actual, expected):
    global passed, failed
    if actual == expected:
        print(f"  PASS: {name}")
        passed += 1
    else:
        print(f"  FAIL: {name}")
        print(f"    Expected: {expected}")
        print(f"    Actual:   {actual}")
        failed += 1

# ===========================
# 1. URL Parser Tests
# ===========================
print("\n=== URL Parser Tests ===")

test("Standard HTTPS URL",
     parse_github_url("https://github.com/fastapi/fastapi"),
     ("fastapi", "fastapi"))

test("HTTPS URL with .git",
     parse_github_url("https://github.com/owner/repo.git"),
     ("owner", "repo"))

test("SSH URL",
     parse_github_url("git@github.com:user/project.git"),
     ("user", "project"))

test("Trailing slash stripped",
     parse_github_url("https://github.com/a/b/"),
     ("a", "b"))

test("Multiple trailing slashes",
     parse_github_url("https://github.com/x/y///"),
     ("x", "y"))

# Test invalid URL raises ValueError
try:
    parse_github_url("not-a-url")
    test("Invalid URL raises error", False, True)
except ValueError:
    test("Invalid URL raises error", True, True)

# ===========================
# 2. JSON Parser Tests
# ===========================
print("\n=== JSON Parser (parse_safely) Tests ===")

test("Clean JSON",
     parse_safely('{"key": "value"}'),
     {"key": "value"})

test("JSON wrapped in code fences",
     parse_safely('```json\n{"key": "value"}\n```'),
     {"key": "value"})

test("JSON wrapped in plain code fences",
     parse_safely('```\n{"key": "value"}\n```'),
     {"key": "value"})

test("JSON with leading text",
     parse_safely('Here is JSON: {"key": "value"} done'),
     {"key": "value"})

# Test invalid JSON raises error
try:
    parse_safely("no json here at all")
    test("Invalid JSON raises error", False, True)
except (ValueError, json.JSONDecodeError):
    test("Invalid JSON raises error", True, True)

# ===========================
# 3. AgentState Model Tests
# ===========================
print("\n=== AgentState Model Tests ===")

state = AgentState()
test("Default commits is empty list", state.commits, [])
test("Default technical_changelog is empty", state.technical_changelog, "")
test("Default breaking_detected is False", state.breaking_detected, False)
test("Default categories is empty dict", state.categories, {})
test("Default iterations is 0", state.iterations, 0)
test("Default critic_feedback is empty", state.critic_feedback, "")

# ===========================
# 4. Critic Validator Tests
# ===========================
print("\n=== Critic Validator Tests ===")

# Test: valid state passes
good_state = AgentState(
    commits=[{"sha": "abc1234", "subject": "Add feature", "message": "Add feature"}],
    technical_changelog="## [v1.0.0]\n### Added\n- Feature",
    executive_summary="### Release Overview\nGood release.",
    breaking_detected=False,
    categories={"breaking": [], "features": ["Feature"]},
    iterations=0
)
result = critic_validator_node(good_state)
test("Valid state passes critic (no feedback)", result.get("critic_feedback", ""), "")

# Test: empty changelog triggers feedback
bad_state = AgentState(
    commits=[{"sha": "abc1234", "subject": "fix bug", "message": "fix bug"}],
    technical_changelog="",
    executive_summary="### Overview",
    breaking_detected=False,
    categories={},
    iterations=0
)
result = critic_validator_node(bad_state)
test("Empty changelog triggers feedback", bool(result.get("critic_feedback")), True)

# Test: error changelog triggers feedback
error_state = AgentState(
    commits=[{"sha": "abc1234", "subject": "fix bug", "message": "fix bug"}],
    technical_changelog="## [Error]\n\nFailed to generate",
    executive_summary="Error occurred",
    breaking_detected=False,
    categories={},
    iterations=0
)
result = critic_validator_node(error_state)
test("Error changelog triggers feedback", bool(result.get("critic_feedback")), True)

# Test: missed breaking changes detected
breaking_state = AgentState(
    commits=[
        {"sha": "abc1234", "subject": "BREAKING: remove old API", "message": "BREAKING: remove old API"},
        {"sha": "def5678", "subject": "fix typo", "message": "fix typo"}
    ],
    technical_changelog="## [v2.0.0]\n### Fixed\n- Typo",
    executive_summary="### Overview\nMinor fixes.",
    breaking_detected=False,
    categories={"breaking": [], "fixes": ["fix typo"]},
    iterations=0
)
result = critic_validator_node(breaking_state)
test("Missed breaking change detected", bool(result.get("critic_feedback")), True)
test("Missed breaking feedback mentions commit", "abc1234" in result.get("critic_feedback", ""), True)

# Test: iterations increment on failure
test("Iterations incremented on failure", result.get("iterations"), 1)

# ===========================
# Summary
# ===========================
print(f"\n{'='*40}")
print(f"Results: {passed} passed, {failed} failed out of {passed + failed} tests")
if failed > 0:
    print("SOME TESTS FAILED!")
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
    sys.exit(0)
