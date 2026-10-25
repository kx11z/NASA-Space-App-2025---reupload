# Exo-Plain web application

The active Next.js website. See the [deployment guide](../../docs/deployment.md), [code guide](../../docs/architecture.md), and [repair notes](../../docs/repair-notes.md).

## Local development

Use Node.js 22. Run npm ci, then npm run dev. No API key is needed to explore sample planets or generate educational data overviews. Without an external backend, local development behaves the same way as GitHub Pages.

The form accepts decimal measurements, keeps a draft in the current browser tab, and stores custom results in session storage. Custom result links work in that tab; download a JSON copy to keep a result. Sample planet links use stable planet IDs and can be shared.

## Live analysis

Set NEXT_PUBLIC_API_BASE_URL to your separately hosted backend origin, without /api, and rebuild. Store GEMINI_API_KEY exclusively on the backend. The optional Cloudflare Functions support Gemini assessments and an independently hosted Python FITS service. See deployment instructions for runtime bindings and CORS configuration.

Run npm run preview:pages to build a frontend with same-origin API calls and preview it with Cloudflare Functions. Copy .dev.vars.example to .dev.vars and fill in your own backend settings first. API failures show an error and keep the form; an educational overview is available only if explicitly chosen.

## Checks

- npm run format:check: check maintained source formatting. npm run format applies it.
- npm run typecheck: check TypeScript.
- npx playwright install chromium: install a browser for tests (not needed when Google Chrome is installed in the standard macOS location).
- npm test: build a GitHub Pages export and run browser and backend regression tests.
- TEST_LIVE_API=true npm test: run the connected-backend scenarios with mocked API responses. No real key is required or external AI call is made.

The test preview uses port 8791. Regression checks run automatically on codex branches and pull requests. Only pushes to main publish the GitHub Pages website.
