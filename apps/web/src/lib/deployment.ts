// These settings are public. API keys belong exclusively on the backend.
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "")
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "")
export const isStaticDemo = !apiBaseUrl && process.env.NEXT_PUBLIC_SAME_ORIGIN_API !== "true"
export const siteUrl = (route: string) => basePath + route
export function apiUrl(route: string) {
  if (isStaticDemo)
    throw new Error("Live analysis is not connected. You can still view an educational overview.")
  return apiBaseUrl + route
}
