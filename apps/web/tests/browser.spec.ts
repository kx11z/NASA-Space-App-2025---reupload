import { test, expect } from "@playwright/test"
const prefix = "/NASA-Space-App-2025---reupload"
const live = process.env.TEST_LIVE_API === "true"
const errors = new Map<object, string[]>()
test.beforeEach(async ({ page }) => {
  const list: string[] = []
  errors.set(page, list)
  page.on("pageerror", (error) => list.push(error.message))
})
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([])
})

test("home navigation works under the GitHub repository path on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("./")
  await expect(page.getByRole("heading", { name: "Exo-Plain", exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole("link", { name: /Explore Your Data/ }).click()
  await expect(page).toHaveURL(new RegExp(prefix + "/new/"))
  await expect(page.getByRole("heading", { name: "Your planet observations" })).toBeVisible()
})

test("empty and malformed results recover instead of crashing or loading forever", async ({
  page,
}) => {
  for (const query of ["", "?planetData=broken", "?planet=not-a-planet", "?result=expired"]) {
    await page.goto("results/" + query)
    await expect(page.getByRole("heading", { name: "No result available" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Enter planet data" })).toBeVisible()
  }
})

test("sample planet dialog opens immediately, closes with Escape, and has a portable result", async ({
  page,
}) => {
  await page.goto("existing/")
  await expect(page.getByRole("button", { name: /^Explore / })).toHaveCount(5)
  await page.getByRole("button", { name: "Explore Kepler-660b", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("button", { name: "View sample overview" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "Explore Kepler-660b", exact: true }).click()
  await page.getByRole("button", { name: "View sample overview" }).click()
  await expect(page).toHaveURL(/results\/\?planet=kepler-660b/)
  await expect(page.getByText("1.67 Earth radii", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Your planet data overview" })).toBeVisible()
  await expect(page.getByRole("img", { name: "Planet illustration" })).toBeVisible()
})

test("the explorer remains usable when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.includes("webgl")) return null
      return getContext.apply(this, [type, ...args] as never)
    } as typeof getContext
  })
  await page.goto("existing/")
  await page.getByRole("button", { name: "Show 3D view" }).click()
  await expect(page.getByText(/3D view is unavailable/)).toBeVisible()
  await page.getByRole("button", { name: "Explore Kepler-660b", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("an example produces a stable overview, survives refresh, and preserves the draft", async ({
  page,
}) => {
  test.skip(live, "Educational deployment scenario")
  await page.goto("new/")
  await expect(page.getByLabel("FITS file", { exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "Load example data" }).click()
  await page.locator("#planetary_radius").fill("2.75")
  expect(
    await page.locator("form").evaluate((form) => (form as HTMLFormElement).checkValidity()),
  ).toBe(true)
  await page.getByRole("button", { name: "View data overview", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Your planet data overview" })).toBeVisible()
  expect(page.url().length).toBeLessThan(180)
  expect(page.url()).not.toContain("planetData")
  await expect(page.getByText("2.75 Earth radii", { exact: true })).toBeVisible()
  await expect(page.getByText(/Confidence Level/)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText("2.75 Earth radii", { exact: true })).toBeVisible()
  const downloadEvent = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download result" }).click()
  expect((await downloadEvent).suggestedFilename()).toBe("exo-plain-result.json")
  await page.getByRole("link", { name: "Enter new values" }).click()
  await expect(page.locator("#planetary_radius")).toHaveValue("2.75")
})

test("a failed live request keeps input visible and requires an explicit choice of overview", async ({
  page,
}) => {
  test.skip(!live, "Connected backend scenario")
  await page.route("https://analysis.example.test/api/analyze-planet", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "The analysis service is unavailable." }),
    }),
  )
  await page.goto("new/")
  await page.getByRole("button", { name: "Load example data" }).click()
  await page.getByRole("button", { name: "Request AI assessment", exact: true }).click()
  await expect(page.getByRole("alert").filter({ hasText: "service is unavailable" })).toBeVisible()
  expect(page.url()).toContain("/new/")
  await expect(page.locator("#planetary_radius")).toHaveValue("2.26")
  await page.getByRole("button", { name: "View an educational overview instead" }).click()
  await expect(page.getByRole("heading", { name: "Your planet data overview" })).toBeVisible()
})

test("live results are validated and a negative assessment is not turned positive", async ({
  page,
}) => {
  test.skip(!live, "Connected backend scenario")
  await page.route("https://analysis.example.test/api/analyze-planet", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mode: "live",
        isExoplanet: false,
        confidence: null,
        explanation: "The supplied observations do not support a planetary signal.",
        topFeatures: [
          {
            name: "Transit depth",
            value: "615.8 ppm",
            impact: null,
            reasoning: "Review the original light curve.",
          },
        ],
      }),
    }),
  )
  await page.goto("new/")
  await page.getByRole("button", { name: "Load example data" }).click()
  await page.getByRole("button", { name: "Request AI assessment", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Planetary signal not supported" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Planetary signal not supported" })).toBeVisible()
})

test("a transient FITS failure can be retried without reselecting the file", async ({ page }) => {
  test.skip(!live, "Connected backend scenario")
  let attempts = 0
  await page.route("https://analysis.example.test/api/analyze-light-curve", (route) => {
    attempts++
    return route.fulfill({
      status: attempts === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        attempts === 1
          ? { error: "The FITS service is temporarily unavailable." }
          : { Features: { transit_depth: 615.8 } },
      ),
    })
  })
  await page.goto("new/")
  await page
    .getByLabel("FITS file", { exact: true })
    .setInputFiles({
      name: "sample.fits",
      mimeType: "application/fits",
      buffer: Buffer.from("SIMPLE = T"),
    })
  await page.getByRole("button", { name: "Analyze FITS file", exact: true }).click()
  await expect(
    page.getByText("The FITS service is temporarily unavailable.", { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Analyze FITS file", exact: true })).toBeEnabled()
  await page.getByRole("button", { name: "Analyze FITS file", exact: true }).click()
  await expect(page.getByText("Extracted light curve results", { exact: true })).toBeVisible()
  expect(attempts).toBe(2)
})
