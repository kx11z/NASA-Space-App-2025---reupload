import { defineConfig } from "@playwright/test"
import { existsSync } from "node:fs"
const prefix = "/NASA-Space-App-2025---reupload"
const localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 8000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8791" + prefix + "/",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: existsSync(localChrome) ? { executablePath: localChrome } : {},
  },
  webServer: {
    command: "npm run build && node scripts/serve-static.mjs",
    url: "http://127.0.0.1:8791" + prefix + "/",
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      NEXT_PUBLIC_BASE_PATH: prefix,
      BASE_PATH: prefix,
      PORT: "8791",
      NEXT_PUBLIC_SAME_ORIGIN_API: "false",
      NEXT_PUBLIC_API_BASE_URL:
        process.env.TEST_LIVE_API === "true" ? "https://analysis.example.test" : "",
    },
  },
})
