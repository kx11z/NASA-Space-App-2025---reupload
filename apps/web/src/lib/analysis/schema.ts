import { z } from "zod"

export const planetDataSchema = z.record(z.unknown()).refine((data) => {
  const features = data.features ?? data
  if (!features || typeof features !== "object" || Array.isArray(features)) return false
  const values = features as Record<string, unknown>
  return [values.orbital_period, values.planetary_radius ?? values.planet_radius].every(
    (value) =>
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim() !== "" &&
      Number.isFinite(Number(value)) &&
      Number(value) > 0,
  )
}, "Planet data must contain a positive orbital period and radius.")

export const analysisPayloadSchema = z.object({
  mode: z.enum(["demo", "live"]),
  isExoplanet: z.boolean().nullable(),
  confidence: z.number().min(0).max(100).nullable(),
  explanation: z.string().trim().min(1).max(12000),
  topFeatures: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        impact: z.number().min(0).max(100).nullable(),
        value: z.union([z.string().max(2000), z.number().finite()]),
        reasoning: z.string().min(1).max(4000),
      }),
    )
    .max(12),
})

export const analysisResultSchema = analysisPayloadSchema.extend({
  planetData: planetDataSchema,
  source: z.enum(["existing", "new"]),
})
