import type { PlanetFormData } from "@/types/planet-form"

export const fieldRules: Record<
  Exclude<keyof PlanetFormData, "light_curve_file" | "ring_system">,
  { required?: boolean; min?: number; max?: number; positive?: boolean; integer?: boolean }
> = {
  orbital_period: { required: true, positive: true },
  planetary_radius: { required: true, positive: true },
  transit_duration: { required: true, positive: true },
  transit_depth: { required: true, positive: true, max: 1000000 },
  transit_epoch: {},
  impact_parameter: { min: 0 },
  equilibrium_temperature: { min: 0 },
  insolation_flux: { min: 0 },
  transit_snr: { min: 0 },
  tce_planet_number: { min: 1, integer: true },
  stellar_effective_temperature: { positive: true },
  stellar_surface_gravity: {},
  stellar_radius: { positive: true },
  ra: { min: 0, max: 360 },
  dec: { min: -90, max: 90 },
  kepler_band_mag: {},
}

export function validatePlanetForm(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return "Planet data must be an object."
  const data = input as Record<string, unknown>
  for (const [key, rule] of Object.entries(fieldRules)) {
    const raw = data[key]
    const label = key.replaceAll("_", " ")
    if (raw === undefined || raw === null || raw === "") {
      if (rule.required) return "Enter " + label + "."
      continue
    }
    if (
      (typeof raw !== "string" && typeof raw !== "number") ||
      String(raw).trim() === "" ||
      !Number.isFinite(Number(raw))
    )
      return "Enter a valid number for " + label + "."
    const value = Number(raw)
    if (rule.positive && value <= 0) return label + " must be greater than zero."
    if (rule.min !== undefined && value < rule.min)
      return label + " must be at least " + rule.min + "."
    if (rule.max !== undefined && value > rule.max)
      return label + " must be at most " + rule.max + "."
    if (key === "ra" && value === 360) return "Right ascension must be less than 360 degrees."
    if (rule.integer && !Number.isInteger(value)) return label + " must be a whole number."
  }
  if (
    data.ring_system !== undefined &&
    !["", "true", "false", true, false].includes(data.ring_system as string)
  )
    return "Choose a valid ring system option."
  return null
}

export function validateFitsFile(file: { name: string; size: number }): string | null {
  if (!/\.(fits|fit)$/i.test(file.name)) return "Choose a .fits or .fit file."
  if (!file.size) return "The FITS file is empty."
  if (file.size > 20 * 1024 * 1024) return "Choose a FITS file of 20 MB or smaller."
  return null
}
