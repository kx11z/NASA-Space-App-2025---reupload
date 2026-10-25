import type { CSSProperties } from "react"

export function PlanetIllustration({
  data,
  color,
  name = "Planet illustration",
}: {
  data?: Record<string, unknown>
  color?: string
  name?: string
}) {
  const features = (data?.features ?? data ?? {}) as Record<string, unknown>
  const temperature = Number(features.equilibrium_temperature)
  const hue = color || (temperature > 600 ? "#df744e" : temperature > 300 ? "#d6ac70" : "#69bacc")
  return (
    <div
      role="img"
      aria-label={name}
      className="planet-art"
      style={{ "--planet-color": hue } as CSSProperties}
    >
      <div className="planet-art-orbit" />
      <div className="planet-art-sphere" />
      <span className="absolute bottom-4 text-xs tracking-widest text-slate-400 uppercase">
        Illustration · not an observation
      </span>
    </div>
  )
}
