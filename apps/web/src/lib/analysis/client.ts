import { apiUrl } from "../deployment"
import { analysisPayloadSchema } from "./schema"

export async function analyzeWithApi(planetData: unknown) {
  const response = await fetch(apiUrl("/api/analyze-planet"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planetData }),
    signal: AbortSignal.timeout(45000),
  })
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new Error("The analysis service returned an unreadable response. Please try again.")
  }
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : null
    throw new Error(
      typeof error === "string" ? error : "The analysis service is unavailable. Please try again.",
    )
  }
  const parsed = analysisPayloadSchema.safeParse(body)
  if (!parsed.success || parsed.data.mode !== "live")
    throw new Error("The analysis service returned an incomplete result. No prediction was saved.")
  return parsed.data
}
