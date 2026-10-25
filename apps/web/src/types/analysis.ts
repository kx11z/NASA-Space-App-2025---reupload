import type { z } from "zod"
import type { analysisPayloadSchema, analysisResultSchema } from "@/lib/analysis/schema"

export type AnalysisPayload = z.infer<typeof analysisPayloadSchema>
export type AnalysisResult = z.infer<typeof analysisResultSchema>
