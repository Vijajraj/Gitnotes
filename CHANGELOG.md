# Release Notes - v2.1.0

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
