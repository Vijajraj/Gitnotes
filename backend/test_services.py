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
from groq_service import parse_safely

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

# (LangGraph critic and validator tests removed in direct pipeline mode)

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
