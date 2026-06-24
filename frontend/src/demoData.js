export const DEMO_MODE = true;

export const demoData = {
  technical_changelog: `# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.101.0] - 2026-06-23

### ⚠ Breaking Changes
- **dependencies:** Removed deprecated \`include_in_schema\` parameter from internal APIRouter configurations (PR #10245) by @tiangolo.

### Added
- **python:** Added comprehensive support for Python 3.12 syntax and runtime optimizations (PR #10240) by @tiangolo.
- **docs:** Added new tutorials for advanced dependency injection patterns and context managers (PR #10255) by @tiangolo.

### Fixed
- **validation:** Fixed validation error response format mismatch under specific query parameters (PR #10242) by @tiangolo.
- **responses:** Resolved memory leak in StreamingResponse when client disconnects prematurely (PR #10238) by @tiangolo.

### Performance
- **lazy-loading:** Reduced application startup latency by 15% via lazy-loading internal validation models (PR #10233) by @tiangolo.

### Chores
- **deps:** Upgraded internal dependency \`httpx\` from \`0.24\` to \`0.25\` (PR #10230) by @tiangolo.
- **ci:** Updated Github Actions test workflows to include Node 20 and Pytest 8 (PR #10231) by @tiangolo.
`,
  executive_summary: `# Executive Summary — FastAPI v0.101.0

### Release Overview
FastAPI version **v0.101.0** introduces compatibility with **Python 3.12**, significantly improves application startup times, and resolves a few high-priority bugs regarding connection closures and validation formatting.

---

### Key Deliverables & Business Impact
* **Python 3.12 Readiness:** Fully compatible with the latest Python version, enabling teams to utilize new language performance improvements safely.
* **15% Fast Application Bootstrap:** Optimization in validation models decreases cold start times in serverless environments (e.g., AWS Lambda, Google Cloud Run).
* **Improved Stability:** Resolved a memory leak in streaming responses, ensuring long-lived web socket and event connections do not consume system overhead.

---

### Upgrade Risk: Medium
> [!WARNING]
> **Breaking Change Alert:** The deprecated \`include_in_schema\` option has been removed from APIRouter. If your codebase relies on this parameter within routes rather than endpoint function definitions, update them before deploying this release.
`,
  breaking_detected: true,
  categories: {
    breaking: [
      "Removed deprecated include_in_schema parameter from internal APIRouter configuration (PR #10245)"
    ],
    features: [
      "Added comprehensive support for Python 3.12 syntax and runtime optimizations (PR #10240)",
      "Added new tutorials for advanced dependency injection patterns (PR #10255)"
    ],
    fixes: [
      "Fixed validation error response format mismatch under specific query parameters (PR #10242)",
      "Resolved memory leak in StreamingResponse when client disconnects (PR #10238)"
    ],
    performance: [
      "Reduced application startup latency by 15% via lazy-loading internal validation models (PR #10233)"
    ],
    chores: [
      "Upgraded internal dependency httpx from 0.24 to 0.25 (PR #10230)",
      "Updated Github Actions test workflows to include Pytest 8 (PR #10231)"
    ]
  }
};
