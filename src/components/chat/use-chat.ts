"use client"

import { useEffect, useRef, useState } from "react"

import { ApiError, GAGAL_TERHUBUNG, isAbortError } from "@/lib/api/client"
import { sendFeedback, streamChat, type StreamedReply, type Turn } from "@/lib/api/chat"
import { getSessionId } from "@/lib/session"

export type ChatEntry =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; state: "pending"; stage: string | null }
  | { id: number; role: "assistant"; state: "done"; reply: StreamedReply }
  | { id: number; role: "assistant"; state: "error"; message: string }

/** Server hanya memakai 3 pesan terakhir untuk penulisan ulang query (FR-4). */
const HISTORY_LIMIT = 3

export function useChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [ratings, setRatings] = useState<Record<string, boolean>>({})
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(0)

  useEffect(() => () => controller.current?.abort(), [])

  const busy = entries.some((entry) => entry.role === "assistant" && entry.state === "pending")

  async function send(input: string) {
    const question = input.trim()
    if (!question || busy) return

    const history = toHistory(entries)
    const userId = nextId.current++
    const replyId = nextId.current++
    const replace = (entry: ChatEntry) =>
      setEntries((prev) => prev.map((item) => (item.id === replyId ? entry : item)))

    setEntries((prev) => [
      ...prev,
      { id: userId, role: "user", text: question },
      { id: replyId, role: "assistant", state: "pending", stage: null },
    ])

    const current = new AbortController()
    controller.current = current
    try {
      const reply = await streamChat(
        { question, session_id: getSessionId(), history },
        {
          signal: current.signal,
          onStatus: (stage) => replace({ id: replyId, role: "assistant", state: "pending", stage }),
        }
      )
      replace({ id: replyId, role: "assistant", state: "done", reply })
    } catch (error) {
      if (isAbortError(error)) return
      replace({
        id: replyId,
        role: "assistant",
        state: "error",
        message: error instanceof ApiError ? error.message : GAGAL_TERHUBUNG,
      })
    } finally {
      if (controller.current === current) controller.current = null
    }
  }

  /** FE-5: satu klik, tanpa konfirmasi. Dikembalikan bila gagal terkirim. */
  async function rate(messageId: string, helpful: boolean) {
    const previous = ratings[messageId]
    if (previous === helpful) return

    setRatings((prev) => ({ ...prev, [messageId]: helpful }))
    try {
      await sendFeedback({ message_id: messageId, helpful }, getSessionId())
    } catch {
      setRatings((prev) => {
        const next = { ...prev }
        if (previous === undefined) delete next[messageId]
        else next[messageId] = previous
        return next
      })
    }
  }

  return { entries, busy, send, ratings, rate }
}

/**
 * Id jawaban yang boleh menampilkan banner eskalasi (FE-3).
 *
 * Satu percakapan soal UKT membuat setiap jawaban membawa banner yang persis
 * sama. Diulang di tiap gelembung, ia berubah jadi hiasan yang dilewati mata --
 * padahal justru banner inilah yang harus menonjol saat topiknya berisiko.
 *
 * Yang ditahan hanya pengulangan: banner ditampilkan pada kemunculan TERAKHIR
 * dari kumpulan unit yang sama, jadi jawaban yang mengarah ke unit berbeda
 * tetap punya bannernya sendiri.
 */
export function bannerEskalasiTerakhir(entries: ChatEntry[]): Set<number> {
  const terakhir = new Map<string, number>()
  for (const entry of entries) {
    if (entry.role !== "assistant" || entry.state !== "done") continue
    const { response } = entry.reply
    if (!response.escalated || response.contacts.length === 0) continue
    const kunci = response.contacts
      .map((contact) => contact.unit)
      .sort()
      .join("|")
    terakhir.set(kunci, entry.id)
  }
  return new Set(terakhir.values())
}

function toHistory(entries: ChatEntry[]): Turn[] {
  const turns: Turn[] = []
  for (const entry of entries) {
    if (entry.role === "user") turns.push({ role: "user", konten: entry.text })
    else if (entry.state === "done" && entry.reply.complete) {
      turns.push({ role: "assistant", konten: entry.reply.response.text })
    }
  }
  return turns.slice(-HISTORY_LIMIT)
}
