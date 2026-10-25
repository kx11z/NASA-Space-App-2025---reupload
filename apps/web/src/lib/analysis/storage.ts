import { PLANETS } from "../../data/planets"
import { analyzePlanetData } from "./demo"
import { analysisResultSchema } from "./schema"
import type { AnalysisResult } from "../../types/analysis"

type ResultStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">
const prefix = "exo-plain:result:"

export function saveResult(
  result: AnalysisResult,
  storage: ResultStorage = sessionStorage,
): string {
  const value = analysisResultSchema.parse(result)
  const id = crypto.randomUUID()
  try {
    storage.setItem(prefix + id, JSON.stringify(value))
  } catch {
    throw new Error("Your browser could not save the result. Enable session storage and try again.")
  }
  return id
}

export function resolveResult(params: URLSearchParams, storage: ResultStorage): AnalysisResult {
  const id = params.get("result")
  if (id) {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error("This result link is invalid.")
    let raw: string | null
    try {
      raw = storage.getItem(prefix + id)
    } catch {
      throw new Error("Your browser cannot access saved results.")
    }
    if (!raw)
      throw new Error(
        "This result is no longer available in this browser tab. Enter your values again, or choose a sample planet.",
      )
    try {
      return analysisResultSchema.parse(JSON.parse(raw))
    } catch {
      throw new Error("The saved result is incomplete. Please run the analysis again.")
    }
  }
  const planetId = params.get("planet")
  if (planetId) {
    const planet = PLANETS.find((item) => item.id === planetId)
    if (!planet) throw new Error("This sample planet could not be found.")
    return analyzePlanetData(planet, "existing")
  }
  // Older bookmarked links are supported as input overviews, never as verified predictions.
  const legacy = params.get("planetData")
  if (legacy && legacy.length <= 20000) {
    try {
      return analyzePlanetData(
        JSON.parse(legacy),
        params.get("source") === "existing" ? "existing" : "new",
      )
    } catch {
      throw new Error("This result link contains invalid planet data.")
    }
  }
  throw new Error(
    "There is no result to show yet. Enter your values or explore a sample planet to begin.",
  )
}
