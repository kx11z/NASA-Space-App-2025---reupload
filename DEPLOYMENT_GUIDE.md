# Deploy Exo-Plain to Cloudflare Pages

Repository: https://github.com/kx11z/NASA-Space-App-2025---reupload

## Cloudflare Git integration

1. In Cloudflare, open Workers & Pages, create a **Pages** project and connect the GitHub repository above. Authorize the Cloudflare GitHub app if prompted.
2. Select your production branch (normally main).
3. Set root directory to **exoplanet-predictor**.
4. Set framework preset to **None**, build command to **npm run build:pages**, and output directory to **out**. Leave any Workers deploy command empty.
5. Set NODE_VERSION to **22**. The committed .npmrc enables the peer dependency compatibility required by this project's dependencies.
6. Add **GEMINI_API_KEY** as an encrypted runtime variable for Production and Preview. Never use a NEXT_PUBLIC_ prefix for this secret.
7. For real FITS model inference, set **FITS_API_URL** to your separately hosted Python server's HTTPS /api/extract URL. Python/PyTorch models do not run inside Pages Functions. Without this setting FITS uploads return an explicit configuration error.
8. Save and deploy. Subsequent pushes to the connected branch trigger builds.

The frontend is a Next.js static export. The functions/api directory supplies the three POST API endpoints, with secrets read from Cloudflare runtime bindings. Do not upload only out through dashboard drag and drop: use Git integration or Wrangler so Functions are included.

## Local verification

From exoplanet-predictor, run npm ci, then npm run build:pages.
Copy .dev.vars.example to .dev.vars, add your own key, then run npm run preview:pages. Open the URL printed by Wrangler. next dev by itself serves the frontend only; use the Pages preview for API calls.

## Optional command line deployment

Run npx wrangler login, then npm run deploy:pages. Select/create your Pages project when prompted. For Git integration, create the project through the dashboard instead.

## Current product limitations

Gemini provides an LLM assessment, not validated model confidence. The image endpoint currently returns a stock illustration rather than generating an image. FITS model inference requires the separate Python service. Build configuration retains the existing TypeScript error bypass; a successful build alone is not a clean type check.
