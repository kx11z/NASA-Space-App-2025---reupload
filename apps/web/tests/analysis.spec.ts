import { test, expect } from "@playwright/test"
import { analyzePlanetData } from "../src/lib/analysis/demo"
import { validatePlanetForm, validateFitsFile } from "../src/lib/analysis/validation"
import { resolveResult, saveResult } from "../src/lib/analysis/storage"
import { exampleForm } from "../src/data/example-form"
import { POST } from "../src/lib/server/analyze-planet"
import { onRequestPost as analyzeFits } from "../functions/api/analyze-light-curve"

test("overview uses the form radius, preserves zero measurements, and never invents a probability", () => {
  const input = { ...exampleForm, equilibrium_temperature: "0" }
  const result = analyzePlanetData(input, "new")
  expect(result.topFeatures[0].value).toBe("2.26 Earth radii")
  expect(result.topFeatures[2].value).toBe("0 K")
  expect(result.isExoplanet).toBeNull()
  expect(result.confidence).toBeNull()
  expect(analyzePlanetData(input, "new")).toEqual(result)
})

test("numeric validation handles decimals, unknown optional measurements, and invalid domains", () => {
  expect(validatePlanetForm(exampleForm)).toBeNull()
  expect(
    validatePlanetForm({
      orbital_period: "2.5",
      planetary_radius: "1.2",
      transit_depth: "20.5",
      transit_duration: "0.4",
    }),
  ).toBeNull()
  for (const bad of [
    { ...exampleForm, planetary_radius: "-1" },
    { ...exampleForm, orbital_period: "Infinity" },
    { ...exampleForm, ra: "360" },
    { ...exampleForm, dec: "91" },
    { ...exampleForm, tce_planet_number: "1.5" },
  ])
    expect(validatePlanetForm(bad)).not.toBeNull()
  expect(
    validatePlanetForm({ ...exampleForm, impact_parameter: "0", ra: "0", dec: "-45" }),
  ).toBeNull()
})

test("missing, malformed, and stale result links produce recoverable errors", () => {
  const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  expect(() => resolveResult(new URLSearchParams(), storage)).toThrow("no result")
  expect(() => resolveResult(new URLSearchParams("planetData=broken"), storage)).toThrow(
    "invalid planet data",
  )
  expect(() => resolveResult(new URLSearchParams("planet=unknown"), storage)).toThrow(
    "could not be found",
  )
  expect(() => resolveResult(new URLSearchParams("result=missing"), storage)).toThrow(
    "no longer available",
  )
  expect(resolveResult(new URLSearchParams("planet=kepler-660b"), storage).source).toBe("existing")
})

test("saved results round-trip and blocked storage never silently loses a result", () => {
  const entries = new Map<string, string>()
  const storage = {
    getItem: (key: string) => entries.get(key) || null,
    setItem: (key: string, value: string) => {
      entries.set(key, value)
    },
    removeItem: (key: string) => {
      entries.delete(key)
    },
  }
  const result = analyzePlanetData(exampleForm, "new")
  const id = saveResult(result, storage)
  expect(resolveResult(new URLSearchParams({ result: id }), storage)).toEqual(result)
  expect(() =>
    saveResult(result, {
      ...storage,
      setItem: () => {
        throw new Error("Blocked")
      },
    }),
  ).toThrow("could not save")
})

test.describe("backend contracts", () => {
  const originalFetch = globalThis.fetch
  test.afterEach(() => {
    globalThis.fetch = originalFetch
  })
  const request = (data: unknown) =>
    new Request("https://service.test/api/analyze-planet", {
      method: "POST",
      body: JSON.stringify(data),
    })
  test("invalid JSON and inputs return 400; missing configuration returns 503", async () => {
    expect(
      (await POST(new Request("https://service.test", { method: "POST", body: "broken" }), {}))
        .status,
    ).toBe(400)
    expect((await POST(request({}), {})).status).toBe(400)
    expect((await POST(request({ planetData: exampleForm }), {})).status).toBe(503)
  })
  test("negative AI assessments stay negative, and provider scores are not fabricated", async () => {
    globalThis.fetch = async (input, init) => {
      expect(String(input)).not.toContain("key=")
      expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("test-secret")
      const body = JSON.parse(String(init?.body))
      expect(body.contents[0].parts[0].text).toContain('"impact_parameter":"0"')
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    isExoplanet: false,
                    explanation: "The evidence is not consistent with a planetary transit.",
                    topFeatures: [
                      { name: "Depth", value: "615.8 ppm", reasoning: "Review the transit shape." },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      })
    }
    const response = await POST(
      request({ planetData: { ...exampleForm, impact_parameter: "0" } }),
      { GEMINI_API_KEY: "test-secret" },
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      isExoplanet: false,
      mode: "live",
      confidence: null,
    })
  })
  test("malformed provider results and rate limits remain errors", async () => {
    globalThis.fetch = async () =>
      Response.json({ candidates: [{ content: { parts: [{ text: '{"isExoplanet":"yes"}' }] } }] })
    expect(
      (await POST(request({ planetData: exampleForm }), { GEMINI_API_KEY: "test" })).status,
    ).toBe(502)
    globalThis.fetch = async () => new Response(null, { status: 429 })
    expect(
      (await POST(request({ planetData: exampleForm }), { GEMINI_API_KEY: "test" })).status,
    ).toBe(429)
    globalThis.fetch = async () => {
      throw new DOMException("Timed out", "TimeoutError")
    }
    expect(
      (await POST(request({ planetData: exampleForm }), { GEMINI_API_KEY: "test" })).status,
    ).toBe(504)
  })
  test("FITS validation rejects empty, oversized, and incorrect files before upload", async () => {
    expect(validateFitsFile({ name: "example.csv", size: 100 })).toContain(".fits")
    expect(validateFitsFile({ name: "example.fits", size: 0 })).toContain("empty")
    expect(validateFitsFile({ name: "example.fits", size: 21 * 1024 * 1024 })).toContain("20 MB")
    expect(validateFitsFile({ name: "example.FITS", size: 100 })).toBeNull()
    expect(
      (await analyzeFits({ request: new Request("https://service.test"), env: {} })).status,
    ).toBe(503)
    const body = new FormData()
    body.append("fits_file", new File(["data"], "example.csv"))
    expect(
      (
        await analyzeFits({
          request: new Request("https://service.test", { method: "POST", body }),
          env: { FITS_API_URL: "https://fits.test/api/extract" },
        })
      ).status,
    ).toBe(400)
  })
})
