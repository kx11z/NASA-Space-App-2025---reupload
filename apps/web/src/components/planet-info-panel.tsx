"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PlanetIllustration } from "./planet-illustration"
import type { PlanetData } from "@/types/planet"

export function PlanetInfoPanel({
  planet,
  onClose,
  onAnalyze,
}: {
  planet: PlanetData
  onClose: () => void
  onAnalyze: (planet: PlanetData) => void
}) {
  const features = [
    ["Planet radius", planet.features.planet_radius + " Earth radii"],
    ["Orbital period", planet.features.orbital_period + " days"],
    ["Equilibrium temperature", planet.features.equilibrium_temperature + " K"],
    ["Stellar radius", planet.features.stellar_radius + " Solar radii"],
  ]
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto p-5 sm:p-8">
        <DialogTitle className="text-2xl">{planet.name}</DialogTitle>
        <DialogDescription>
          Illustrative sample data for exploring the interface. These values are not a verified
          catalog record.
        </DialogDescription>
        <div className="grid gap-5 sm:grid-cols-2">
          <PlanetIllustration color={planet.color} name={planet.name + " illustration"} />
          <div className="flex flex-col justify-center gap-4">
            <dl className="space-y-4">
              {features.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-medium mt-1">{value}</dd>
                </div>
              ))}
            </dl>
            <Button className="mt-2" onClick={() => onAnalyze(planet)}>
              View sample overview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
