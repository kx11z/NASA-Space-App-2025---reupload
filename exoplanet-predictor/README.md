# Exo-Plain

A Next.js 15 / React 19 application for exploring exoplanets, deployed with Cloudflare Pages.

## Cloudflare Pages

See [the deployment guide](../DEPLOYMENT_GUIDE.md) for GitHub integration, runtime secrets, and deployment instructions.

- Repository: https://github.com/kx11z/NASA-Space-App-2025---reupload
- Project root: `exoplanet-predictor`
- Build command: `npm run build:pages`
- Output directory: `out`
- Node.js: 22

The frontend uses Next.js static export. Three Pages Functions provide POST endpoints at /api/analyze-planet, /api/analyze-light-curve, and /api/generate-planet-image. The API key stays in runtime bindings on the server.

## Local setup

Clone this repository, enter exoplanet-predictor, and run `npm ci`.
Copy .dev.vars.example to .dev.vars and add your own GEMINI_API_KEY. Optionally set FITS_API_URL to the HTTPS /api/extract endpoint of your separately hosted Python inference service.

Run `npm run preview:pages` to build and preview both the frontend and API. Run `npm run dev` only for frontend development; Next.js no longer hosts the API routes. After a build, `npm start` starts the Pages preview without rebuilding.

Run `npm run deploy:pages` for Wrangler deployment, or use Cloudflare's Git integration to deploy automatically on pushes. Legacy Docker / Render scripts target the former Next.js server setup and are not the deployment path for this Pages version.

## Limitations

Gemini analysis is an LLM assessment, not validated machine learning confidence. The image endpoint currently returns a stock illustration. Real FITS inference requires the separate Python service; unavailable inference produces an error, not fabricated predictions. The results UI still includes demo fallback behavior when Gemini fails.

The build retains the project's existing TypeScript and lint bypasses. A successful production build does not establish that all existing code passes type checking.
