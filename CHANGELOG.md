# Release Notes

## [v2.1.0] - Date

### Added
- Full-stack application with FastAPI backend and React frontend
- Category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Dynamic tag prefix resolution
- Github action cron job workflow and scripts/cron_generate.py
- Optional label for tag inputs in UI
- Premium Linear-meets-Vercel frontend redesign

### Fixed
- JSON validation failed due to token limits in groq service
- Unicode bug and lint warnings
- v-prefix mismatch
- Invalid github token fallback
- DEMO_MODE causing frontend to skip backend API calls

### Changed
- Reverted backend to original direct Groq pipeline without LangGraph/LangSmith
- Made git tags optional in UI and fetch recent commits as fallback in backend
- Set light theme as default preference
- Made API URL dynamic and added Render Blueprint
- Disabled DEMO_MODE to enable live API pipeline

---

## [v2.1.0] - Date

### Added
- Implemented full-stack application with FastAPI backend and React frontend
- Added category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Added github action cron job workflow and scripts/cron_generate.py
- Made git tags optional in UI and fetch recent commits as fallback in backend

### Fixed
- Resolved JSON validation failed due to token limits in groq service
- Implemented dynamic tag prefix resolution (v-prefix mismatch)
- Forced override env variables using load_dotenv(override=True)
- Reduced commit capping and description limits to stay within Groq 6000 TPM limit
- Implemented graceful 401 fallback for invalid github token
- Resolved lint warnings, unicode bug, and added backend test suite

### Changed
- Redesigned frontend layout following minimal Vercel/Linear developer aesthetic
- Set light theme as the default preference
- Implemented premium Linear-meets-Vercel frontend redesign
- Made API URL dynamic and added Render Blueprint
- Disabled DEMO_MODE to enable live API pipeline
- Updated README.md with comprehensive documentation, setup, features, and API specifications


---

## [v2.1.0] - Date

### Added
- Implemented full-stack application with FastAPI backend and React frontend
- Added category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Added github action cron job workflow and scripts/cron_generate.py
- Added dynamic tag prefix resolution
- Added github action cron job workflow and scripts/cron_generate.py

### Fixed
- Resolved JSON validation failed due to token limits in groq service
- Reduced commit capping and description limits to stay within Groq 6000 TPM limit
- Implemented dynamic tag prefix resolution (v-prefix mismatch)
- Resolved lint warnings, unicode bug, and added backend test suite
- Implemented graceful 401 fallback for invalid github token

### Changed
- Redesigned frontend layout following minimal Vercel/Linear developer aesthetic
- Made git tags optional in UI and fetch recent commits as fallback in backend
- Set light theme as the default preference
- Reverted backend to original direct Groq pipeline without LangGraph/LangSmith
- Disabled DEMO_MODE to enable live API pipeline
- Updated README.md with comprehensive documentation, setup, features, and API specifications


---

## [v2.1.0] - Date

### Added
- Full-stack application with FastAPI backend and React frontend
- Category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Github action cron job workflow and scripts/cron_generate.py
- Dynamic tag prefix resolution
- Optional label for tag inputs in UI
- Premium Linear-meets-Vercel frontend redesign
- Minimal Vercel/Linear developer aesthetic frontend layout

### Fixed
- JSON validation failed due to token limits in groq service
- Unicode bug and lint warnings
- Implement graceful 401 fallback for invalid github token
- Reduce commit capping and description limits to stay within Groq 6000 TPM limit
- Resolve v-prefix mismatch

### Changed
- Make git tags optional in UI and fetch recent commits as fallback in backend
- Make API URL dynamic
- Set light theme as the default preference
- Revert backend to original direct Groq pipeline without LangGraph/LangSmith
- Disable DEMO_MODE to enable live API pipeline
- Enable DEMO_MODE by default to bypass rate limits

---

## v2.1.0 - Date

### Added
- Full-stack application with FastAPI backend and React frontend
- Category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Github action cron job workflow and scripts/cron_generate.py
- Dynamic tag prefix resolution
- Optional label for tag inputs in UI
- Light theme as the default preference
- Premium Linear-meets-Vercel frontend redesign
- Render Blueprint
- Vercel deployments
- Design features

### Fixed
- JSON validation failed due to token limits in groq service
- Unicode bug
- Lint warnings
- Implement dynamic tag prefix resolution (v-prefix mismatch)
- Reduce commit capping and description limits to stay within Groq 6000 TPM limit
- Force override env variables using load_dotenv(override=True)
- Implement graceful 401 fallback for invalid github token
- Resolve DEMO_MODE issues

### Changed
- Revert backend to original direct Groq pipeline without LangGraph/LangSmith
- Make API URL dynamic
- Make git tags optional in UI and fetch recent commits as fallback in backend
- Disable DEMO_MODE to enable live API pipeline

---

## [v2.1.0] - Date

### Added
- Implemented full-stack application with FastAPI backend and React frontend
- Added category breakdowns, clipboard, stats banner, step progress, demo mode, and error diagnostic features
- Added github action cron job workflow and scripts/cron_generate.py
- Made git tags optional in UI and fetch recent commits as fallback in backend

### Fixed
- Resolved JSON validation failed due to token limits in groq service
- Implemented dynamic tag prefix resolution (v-prefix mismatch)
- Reduced commit capping and description limits to stay within Groq 6000 TPM limit
- Forced override env variables using load_dotenv(override=True)
- Implemented graceful 401 fallback for invalid github token
- Resolved lint warnings, unicode bug, and added backend test suite

### Changed
- Updated README.md with comprehensive documentation
- Redesigned frontend layout following minimal Vercel/Linear developer aesthetic
- Made API URL dynamic and added Render Blueprint
- Set light theme as the default preference
- Reverted backend to original direct Groq pipeline without LangGraph/LangSmith
- Enabled/disabled DEMO_MODE to enable live API pipeline

---

- v2.1.0

This release introduces smart payment routing fallback mechanisms and checkout stability improvements to prevent duplicate charges.

## 🚀 What's New

* **Smart Payment Fallback Router**: Payments are now automatically routed via Adyen if Stripe latency exceeds 500ms, ensuring payment page response times remain optimal.
* **Duplicate Charge Protection**: Prevented double payment processing by disabling checkout buttons during form submission.

---

## 🛠️ Developer Changelog

### Features
- **payment**: Integrated Adyen payment backup routing in `src/services/paymentRouter.ts`. Router dynamically falls back to Adyen if Stripe latency measurement exceeds 500ms limit.

### Bug Fixes
- **checkout**: Resolved button submission race condition in `src/components/CheckoutButton.tsx` by disabling click event dispatches when `isSubmitting` is active (Closes #402, Resolves #119).