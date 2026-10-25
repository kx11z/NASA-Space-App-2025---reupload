import type { AnalysisResult } from "@/types/analysis"
import { planetDataSchema } from "./schema"

export function analyzePlanetData(input: unknown, source: "existing" | "new"): AnalysisResult {
  const planetData = planetDataSchema.parse(input)
  const features = (planetData.features ?? planetData) as Record<string, unknown>
  const value = (key: string, unit: string) => {
    const raw = features[key]
    return raw !== undefined &&
      raw !== null &&
      String(raw).trim() !== "" &&
      Number.isFinite(Number(raw))
      ? Number(raw).toLocaleString("en-US", { maximumFractionDigits: 6 }) + unit
      : "Not provided"
  }
  const radiusKey = features.planetary_radius !== undefined ? "planetary_radius" : "planet_radius"
  return {
    mode: "demo",
    isExoplanet: null,
    confidence: null,
    explanation:
      "This overview summarizes the supplied values. It does not run a trained classifier or confirm a planet discovery. Review the original observations and connect an analysis service for an AI assessment.",
    topFeatures: [
      {
        name: "Planet radius",
        impact: null,
        value: value(radiusKey, " Earth radii"),
        reasoning: "The supplied size estimate, expressed relative to Earth's radius.",
      },
      {
        name: "Orbital period",
        impact: null,
        value: value("orbital_period", " days"),
        reasoning: "The supplied time for one orbit around the host star.",
      },
      {
        name: "Equilibrium temperature",
        impact: null,
        value: value("equilibrium_temperature", " K"),
        reasoning: "An input estimate; it does not establish surface conditions or habitability.",
      },
      {
        name: "Transit depth",
        impact: null,
        value: value("transit_depth", " ppm"),
        reasoning:
          "The supplied change in brightness during a transit. Missing measurements are left unspecified.",
      },
      {
        name: "Stellar radius",
        impact: null,
        value: value("stellar_radius", " Solar radii"),
        reasoning: "The supplied size of the host star, expressed relative to the Sun.",
      },
    ],
    planetData,
    source,
  }
}
