"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PlanetInfoPanel } from "@/components/planet-info-panel"
import { SceneBoundary } from "@/components/scene-boundary"
import { PLANETS } from "@/data/planets"
import type { PlanetData } from "@/types/planet"

const GalaxyMap = dynamic(
  () => import("@/components/galaxy-map").then((module) => module.GalaxyMap),
  {
    ssr: false,
    loading: () => (
      <p className="p-8 text-muted-foreground" role="status">
        Loading 3D view…
      </p>
    ),
  },
)

export default function ExistingPage() {
  const [selected, setSelected] = useState<PlanetData | null>(null)
  const [showMap, setShowMap] = useState(false)
  const router = useRouter()
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <Button asChild variant="ghost">
        <Link href="/">← Back to home</Link>
      </Button>
      <header className="space-y-3 max-w-2xl">
        <p className="text-xs tracking-[0.2em] uppercase text-primary">
          A small universe to explore
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold">Planet explorer</h1>
        <p className="text-muted-foreground leading-relaxed">
          Choose a sample planet to inspect its values. The optional 3D scene is a visual guide;
          positions and properties are illustrative.
        </p>
      </header>
      <div className="flex flex-wrap gap-3 items-center">
        <Button variant="outline" aria-pressed={showMap} onClick={() => setShowMap(!showMap)}>
          {showMap ? "Hide 3D view" : "Show 3D view"}
        </Button>
        <p className="text-sm text-muted-foreground">
          All samples are available below, with or without 3D.
        </p>
      </div>
      {showMap && (
        <div className="h-[360px] sm:h-[440px] rounded-2xl border border-border overflow-hidden bg-black">
          <SceneBoundary>
            <GalaxyMap onPlanetSelect={setSelected} selectedPlanet={selected} />
          </SceneBoundary>
        </div>
      )}
      <section aria-label="Sample planets" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANETS.map((planet) => (
          <Card key={planet.id} className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="w-10 h-10 rounded-full shrink-0 shadow-inner"
                style={{
                  background:
                    "radial-gradient(circle at 30% 25%, #ffffffaa, " +
                    planet.color +
                    " 40%, #0b1024 95%)",
                }}
              />
              <h2 className="font-semibold text-lg">{planet.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {planet.features.planet_radius} Earth radii · {planet.features.orbital_period}-day
              orbit
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelected(planet)}>
              Explore {planet.name}
            </Button>
          </Card>
        ))}
      </section>
      {selected && (
        <PlanetInfoPanel
          planet={selected}
          onClose={() => setSelected(null)}
          onAnalyze={(planet) => router.push("/results/?planet=" + encodeURIComponent(planet.id))}
        />
      )}
    </main>
  )
}
