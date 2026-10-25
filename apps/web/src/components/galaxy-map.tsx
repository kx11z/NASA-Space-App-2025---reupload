"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Planet } from "./planet"
import type { PlanetData } from "@/types/planet"

import { PLANETS } from "@/data/planets"

type GalaxyMapProps = {
  onPlanetSelect: (planet: PlanetData) => void
  selectedPlanet: PlanetData | null
}

export function GalaxyMap({ onPlanetSelect, selectedPlanet }: GalaxyMapProps) {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          onClick={() => onPlanetSelect(planet)}
          isSelected={selectedPlanet?.id === planet.id}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        zoomSpeed={0.8}
      />
    </Canvas>
  )
}
