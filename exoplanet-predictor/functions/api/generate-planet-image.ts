import { POST } from '../../lib/server/generate-planet-image'
export const onRequestPost = ({ request, env }: { request: Request; env: { GEMINI_API_KEY?: string } }) => POST(request, env)
