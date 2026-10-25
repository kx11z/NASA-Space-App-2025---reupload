"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { isStaticDemo, apiUrl } from "@/lib/deployment"
import { analyzeWithApi } from "@/lib/analysis/client"
import { analyzePlanetData } from "@/lib/analysis/demo"
import { saveResult } from "@/lib/analysis/storage"
import { fieldRules, validateFitsFile, validatePlanetForm } from "@/lib/analysis/validation"
import { inputSections } from "@/data/planet-form"
import { emptyForm, exampleForm } from "@/data/example-form"
import type { PlanetFormData } from "@/types/planet-form"
import type { AnalysisResult } from "@/types/analysis"

const draftKey = "exo-plain:form:v1"
export default function NewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PlanetFormData>(emptyForm)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [fitsFile, setFitsFile] = useState<File | null>(null)
  const [fitsBusy, setFitsBusy] = useState(false)
  const [fitsError, setFitsError] = useState("")
  const [fitsResult, setFitsResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null")
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        const values = { ...emptyForm }
        for (const key of Object.keys(emptyForm) as (keyof PlanetFormData)[])
          if (typeof saved[key] === "string") values[key] = saved[key]
        setFormData(values)
      }
    } catch {
      /* A draft is optional; the form works without browser storage. */
    }
  }, [])

  function updateForm(next: PlanetFormData) {
    setFormData(next)
    setError("")
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next))
    } catch {
      /* Optional draft. */
    }
  }
  function openResult(result: AnalysisResult) {
    const id = saveResult(result)
    router.push("/results/?result=" + id)
  }
  function showOverview() {
    const issue = validatePlanetForm(formData)
    if (issue) {
      setError(issue)
      return
    }
    try {
      openResult(analyzePlanetData(formData, "new"))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The overview could not be opened.")
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const issue = validatePlanetForm(formData)
    if (issue) {
      setError(issue)
      return
    }
    if (isStaticDemo) {
      showOverview()
      return
    }
    setError("")
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeWithApi(formData)
      openResult({ ...analysis, planetData: formData, source: "new" })
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== "TimeoutError"
          ? failure.message
          : "The analysis service took too long. Please try again.",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }
  async function analyzeFits() {
    if (!fitsFile || isStaticDemo) return
    const issue = validateFitsFile(fitsFile)
    if (issue) {
      setFitsError(issue)
      return
    }
    setFitsBusy(true)
    setFitsError("")
    setFitsResult(null)
    try {
      const body = new FormData()
      body.append("fits_file", fitsFile, fitsFile.name)
      const response = await fetch(apiUrl("/api/analyze-light-curve"), {
        method: "POST",
        body,
        signal: AbortSignal.timeout(35000),
      })
      const data: unknown = await response.json()
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error("The service returned an incomplete FITS result.")
      if (!response.ok)
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "FITS analysis is unavailable.",
        )
      setFitsResult(data as Record<string, unknown>)
    } catch (failure) {
      setFitsError(
        failure instanceof Error ? failure.message : "The FITS file could not be analyzed.",
      )
    } finally {
      setFitsBusy(false)
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <Button asChild variant="ghost">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </Button>
      <header className="space-y-3 max-w-2xl">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Explore the evidence</p>
        <h1 className="text-3xl sm:text-5xl font-semibold">Your planet observations</h1>
        <p className="text-muted-foreground leading-relaxed">
          Enter your measurements or load an example. Fields marked * are required; you can leave
          unknown measurements blank.
        </p>
      </header>
      <div
        role="status"
        className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-5 py-4 text-sm text-cyan-100"
      >
        {isStaticDemo
          ? "Educational mode. You can view a data overview; live AI and FITS analysis are not connected."
          : "An analysis service is connected. AI assessments still require review against the original observations."}
      </div>
      <Button type="button" variant="outline" onClick={() => updateForm({ ...exampleForm })}>
        Load example data
      </Button>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          {inputSections.map((section) => (
            <Card className="p-5 sm:p-6 space-y-5" key={section.title}>
              <h2 className="font-semibold text-lg">{section.title}</h2>
              {section.fields.map((field) => {
                const rule = fieldRules[field.key]
                return (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>
                      {field.label}
                      {rule.required ? " *" : ""}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      step={rule.integer ? "1" : "any"}
                      min={rule.positive ? 0 : rule.min}
                      max={rule.max}
                      required={rule.required}
                      placeholder={field.placeholder}
                      value={formData[field.key]}
                      onChange={(event) =>
                        updateForm({ ...formData, [field.key]: event.target.value })
                      }
                    />
                  </div>
                )
              })}
            </Card>
          ))}
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="font-semibold text-lg">Additional context</h2>
            <div className="space-y-2">
              <Label htmlFor="ring_system">Ring system</Label>
              <select
                id="ring_system"
                value={formData.ring_system}
                onChange={(event) => updateForm({ ...formData, ring_system: event.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="false">No / not specified</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              An overview summarizes the inputs. It cannot establish whether an object is an
              exoplanet or whether it is habitable.
            </p>
          </Card>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-400/40 bg-red-400/5 p-5 space-y-3"
          >
            <p>{error}</p>
            {!isStaticDemo && (
              <Button type="button" variant="outline" onClick={showOverview}>
                View an educational overview instead
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <Button type="submit" size="lg" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {isAnalyzing
              ? "Requesting analysis…"
              : isStaticDemo
                ? "View data overview"
                : "Request AI assessment"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your inputs stay in this tab unless you request a live analysis.
          </p>
        </div>
      </form>
      <section aria-labelledby="fits-title">
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 id="fits-title" className="text-xl font-semibold flex items-center gap-2">
            <FileUp className="w-5 h-5" /> FITS light curve analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            {isStaticDemo
              ? "This feature needs a connected FITS analysis service. No file is uploaded in educational mode."
              : "Upload a .fits or .fit file, up to 20 MB, to extract light curve features. This runs separately from the observation form."}
          </p>
          <Label htmlFor="fits-file">FITS file</Label>
          <Input
            id="fits-file"
            type="file"
            accept=".fits,.fit"
            disabled={isStaticDemo || fitsBusy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setFitsFile(file)
              setFitsResult(null)
              setFitsError(file ? validateFitsFile(file) || "" : "")
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isStaticDemo || fitsBusy || !fitsFile || !!validateFitsFile(fitsFile)}
            onClick={analyzeFits}
          >
            {fitsBusy ? "Analyzing FITS file…" : "Analyze FITS file"}
          </Button>
          {fitsError && (
            <p role="alert" className="text-red-300">
              {fitsError}
            </p>
          )}
          {fitsResult && (
            <details className="rounded-md border border-border p-4" open>
              <summary className="font-medium cursor-pointer">
                Extracted light curve results
              </summary>
              <pre className="mt-3 text-xs whitespace-pre-wrap break-all overflow-auto max-h-80">
                {JSON.stringify(fitsResult, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      </section>
    </main>
  )
}
