import {
  API_BASE_URL,
  ApiError,
  GAGAL_TERHUBUNG,
  errorMessage,
  isAbortError,
  type Schemas,
} from "./client"
import { readServerEvents } from "./sse"

export type ChatRequest = Schemas["ChatRequest"]
export type ChatResponse = Schemas["ChatResponse"]
export type Citation = Schemas["CitationOut"]
export type Contact = Schemas["ContactOut"]
export type Turn = Schemas["TurnIn"]
export type Suggestion = Schemas["Suggestion"]

export type StreamedReply = {
  response: ChatResponse
  /**
   * false bila event `done` tidak pernah tiba. Kontrak meminta jawaban seperti
   * itu diperlakukan sebagai tidak lengkap dan sitasinya tidak ditampilkan.
   */
  complete: boolean
}

const TERPUTUS =
  "Koneksi terputus sebelum jawaban diterima. Silakan kirim ulang pertanyaan Anda."

/** FE-1: kirim pertanyaan lewat `/api/chat/stream`. */
export async function streamChat(
  body: ChatRequest,
  { signal, onStatus }: { signal?: AbortSignal; onStatus?: (stage: string) => void } = {}
): Promise<StreamedReply> {
  const response = await post("/api/chat/stream", body, body.session_id, signal)
  if (!response.body) throw new ApiError(0, GAGAL_TERHUBUNG)

  let reply: ChatResponse | null = null
  let complete = false
  try {
    for await (const event of readServerEvents(response.body)) {
      if (event.name === "status") onStatus?.(JSON.parse(event.data).stage)
      else if (event.name === "message") reply = JSON.parse(event.data) as ChatResponse
      else if (event.name === "done") complete = true
    }
  } catch (error) {
    if (isAbortError(error)) throw error
    // Aliran putus di tengah jalan: pakai yang sudah tiba, `complete` tetap false.
  }

  if (!reply) throw new ApiError(0, TERPUTUS)
  return { response: reply, complete }
}

/** FE-5. Mengirim ulang untuk `message_id` yang sama mengganti penilaian sebelumnya. */
export async function sendFeedback(
  body: Schemas["FeedbackRequest"],
  sessionId: string
): Promise<void> {
  await post("/api/feedback", body, sessionId)
}

/**
 * FE-6. Endpoint ini masih `planned`. Selama belum tersedia, layar awal tampil
 * tanpa saran -- jangan diganti daftar karangan, karena isinya wajib berasal
 * dari hasil survei (api.yaml).
 */
export async function fetchSuggestions(signal?: AbortSignal): Promise<Suggestion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/suggestions`, { signal })
    if (!response.ok) return []
    const data: unknown = await response.json()
    return Array.isArray(data) ? (data as Suggestion[]).slice(0, 5) : []
  } catch {
    return []
  }
}

/** FE-2: buka PDF sumber tepat di halaman yang dikutip. */
export function citationUrl(citation: Citation): string {
  return `${API_BASE_URL}/api/documents/${encodeURIComponent(citation.document_id)}/file#page=${citation.halaman}`
}

async function post(
  path: string,
  body: unknown,
  sessionId: string,
  signal?: AbortSignal
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Tanpa header ini batas laju jatuh ke per IP, yang di jaringan kampus
        // dipakai bersama ratusan mahasiswa.
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError(0, GAGAL_TERHUBUNG)
  }

  if (!response.ok) {
    const detail: unknown = await response.json().catch(() => null)
    throw new ApiError(response.status, errorMessage(response.status, detail))
  }
  return response
}
