# Project repair notes

Work is isolated on codex/project-repair. The live main branch is unchanged until these changes are merged.

## Fixed behavior

- Empty, malformed, stale, and unknown result links show a recovery screen instead of throwing an error or loading forever.
- Custom results are saved in session storage instead of embedding large JSON payloads in URLs. Refresh keeps results in the current tab; JSON downloads keep an offline copy. Sample links use stable catalog IDs.
- Planet radius is read from either the form's planetary_radius or the sample data's planet_radius field. Zero-valued measurements are preserved.
- Educational summaries are deterministic and do not fabricate classifications, habitability claims, feature importance, or confidence scores.
- The observation form supports decimals explicitly, checks required/ranged measurements, retains drafts, and keeps input visible when the backend fails. It never replaces an unsuccessful AI request with a fabricated success.
- Optional FITS uploads validate extension, size, and content presence. Upload controls are disabled when no backend is connected. The stale direct link to an HTTP server was removed.
- Sample details open directly in an accessible dialog with Escape support. The explorer has a keyboard-accessible planet list and an optional 3D view, with a fallback when WebGL is unavailable.
- Planet illustrations render locally without an image provider, SDK, network request, or API key. The retired image-generation endpoint returns 410 instead of returning a stock image as generated content.
- Gemini requests validate inputs and structured responses, preserve negative assessments, respect timeouts/rate limits, and keep API keys out of URLs. Missing configuration is an explicit 503 error.
- Unused mobile dependencies, the former OpenNext adapter, analytics integration, dead UI modules, and embedded unused prompts were removed.

## What still needs external setup

GitHub Pages serves a static frontend. Real AI assessments need a separate backend with a Gemini key; FITS inference additionally needs the Python server and its trained model environment. These services were not provisioned by this repair. Automated tests mock the provider; they do not establish scientific model accuracy or verify a real account's model availability.

The sample catalog remains illustrative, with its original sample values. No verified NASA catalog synchronization is claimed. The Python research code and model weights are unchanged by this repair.

## Validation

Regression tests cover form/radius handling, reproducible overviews, invalid inputs, result storage, provider failures, mobile navigation, direct result links, dialog behavior, WebGL fallback, downloads, and connected-backend success/failure flows. Tests build the actual static export under the GitHub repository path. The separate branch-check workflow does not deploy a website.
