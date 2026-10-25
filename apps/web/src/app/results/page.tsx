"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlanetIllustration } from "@/components/planet-illustration"
import type { AnalysisResult } from "@/types/analysis"
import { resolveResult } from "@/lib/analysis/storage"

function ResultsContent() {
  const params = useSearchParams()
  const query = params.toString()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    setResult(null)
    setError("")
    try {
      setResult(resolveResult(new URLSearchParams(query), sessionStorage))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This result could not be opened.")
    }
  }, [query])

  function downloadResult() {
    if (!result) return
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "exo-plain-result.json"
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (error)
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-8 space-y-5">
          <Info className="text-primary w-9 h-9" />
          <h1 className="text-2xl font-semibold">No result available</h1>
          <p role="status" className="text-muted-foreground leading-relaxed">
            {error}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/new">Enter planet data</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/existing">Explore samples</Link>
            </Button>
          </div>
        </Card>
      </main>
    )
  if (!result)
    return (
      <main className="min-h-screen grid place-items-center">
        <p role="status">Opening result…</p>
      </main>
    )
  const demo = result.mode === "demo"
  const title = demo
    ? "Your planet data overview"
    : result.isExoplanet === null
      ? "More evidence is needed"
      : result.isExoplanet
        ? "Potential planetary signal"
        : "Planetary signal not supported"
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <nav aria-label="Result navigation" className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </Button>
        <Badge variant="outline">
          {result.source === "existing" ? "Sample planet" : "Your input"}
        </Badge>
      </nav>
      <div
        className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-5 py-4 text-sm text-cyan-100"
        role="status"
      >
        {demo
          ? "Educational overview. No AI classifier has run, and no discovery or confidence score is claimed."
          : "AI assessment of supplied values. This is not a confirmed discovery or a calibrated probability."}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6 sm:p-9 flex flex-col justify-center gap-5">
          <p className="text-xs tracking-[0.2em] text-primary uppercase">
            {demo ? "Explore the evidence" : "Analysis result"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">{title}</h1>
          <p className="text-muted-foreground leading-relaxed">{result.explanation}</p>
          {typeof result.planetData.name === "string" && (
            <p className="text-lg text-primary">{result.planetData.name}</p>
          )}
          {result.confidence !== null && !demo && (
            <p className="text-sm text-muted-foreground">
              Service-reported score: {result.confidence}% (not independently calibrated)
            </p>
          )}
        </Card>
        <Card className="overflow-hidden">
          <PlanetIllustration data={result.planetData} />
        </Card>
      </div>
      <section aria-labelledby="features-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="features-title" className="text-2xl font-semibold">
              {demo ? "Values at a glance" : "What informed the assessment"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {demo
                ? "The values you supplied, with their units and context."
                : "Review the explanation alongside the original measurements."}
            </p>
          </div>
          <div className="space-y-2">
            <Button variant="outline" onClick={downloadResult}>
              <Download className="w-4 h-4" /> Download result
            </Button>
            <p className="text-xs text-muted-foreground">
              Saved in this tab. Download a copy to keep it.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.topFeatures.map((feature, index) => (
            <Card className="p-5 space-y-3" key={feature.name + index}>
              <h3 className="text-sm text-muted-foreground">{feature.name}</h3>
              <p className="text-xl font-semibold break-words">{feature.value}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.reasoning}</p>
            </Card>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap gap-3 pt-2 pb-8">
        <Button asChild>
          <Link href="/new">
            Enter new values <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/existing">Explore sample planets</Link>
        </Button>
      </div>
    </main>
  )
}
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center">
          <p role="status">Opening result…</p>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
