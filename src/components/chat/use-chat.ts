"use client"

import { useEffect, useRef, useState } from "react"

import { ApiError, GAGAL_TERHUBUNG, isAbortError } from "@/lib/api/client"
import { sendFeedback, streamChat, type StreamedReply, type Turn } from "@/lib/api/chat"
import { getSessionId } from "@/lib/session"

export type ChatEntry =
  /** `unit`: unit yang dipilih saat pertanyaan ini dikirim; null = semua unit. */
  | { id: number; role: "user"; text: string; unit: string | null }
  /** Topik (unit) yang diklik mahasiswa. */
  | { id: number; role: "topic"; unit: string }
  | { id: number; role: "assistant"; state: "pending"; stage: string | null }
  | { id: number; role: "assistant"; state: "streaming"; text: string }
  | { id: number; role: "assistant"; state: "done"; reply: StreamedReply }
  | { id: number; role: "assistant"; state: "error"; message: string }

/**
 * Keadaan kotak catatan 👎 (FE-5) untuk satu jawaban.
 *
 * `undefined` -- tidak ada kotak sama sekali -- adalah keadaan normal: penilaian
 * tetap satu klik, dan kotaknya baru muncul setelah jempol ke bawah ditekan.
 */
export type NoteState = "open" | "sending" | "sent" | "error"

export type FeedbackControls = {
  ratings: Record<string, boolean>
  notes: Record<string, NoteState>
  rate: (messageId: string, helpful: boolean) => void
  submitNote: (messageId: string, catatan: string) => void
  dismissNote: (messageId: string) => void
}

/** Server hanya memakai 3 pesan terakhir untuk penulisan ulang query (FR-4). */
const HISTORY_LIMIT = 3

export function useChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  // Topik yang sedang berlaku untuk pertanyaan yang DIKETIK; null = semua unit.
  // Sengaja tidak disimpan di localStorage: topik kemarin yang diam-diam masih
  // menyaring pencarian hari ini hanya menghasilkan penolakan yang membingungkan.
  const [unit, setUnit] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, NoteState>>({})
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(0)

  useEffect(() => () => controller.current?.abort(), [])

  const busy = entries.some(
    (entry) =>
      entry.role === "assistant" && (entry.state === "pending" || entry.state === "streaming")
  )

  /**
   * `tujuan` hanya untuk pertanyaan siap klik milik topik tertentu -- yang
   * diklik dari gelembung lama tetap dicari di unitnya sendiri, bukan di topik
   * yang kebetulan sedang berlaku. Pertanyaan ketikan memakai topik saat ini.
   */
  async function send(input: string, tujuan: string | null = unit) {
    const question = input.trim()
    if (!question || busy) return

    const history = toHistory(entries)
    const userId = nextId.current++
    const replyId = nextId.current++
    const replace = (entry: ChatEntry) =>
      setEntries((prev) => prev.map((item) => (item.id === replyId ? entry : item)))

    setEntries((prev) => [
      ...prev,
      { id: userId, role: "user", text: question, unit: tujuan },
      { id: replyId, role: "assistant", state: "pending", stage: null },
    ])

    const current = new AbortController()
    controller.current = current
    try {
      // Potongan dirangkai di sini, bukan di `streamChat`: yang dialirkan server
      // adalah potongan mentah, dan kalimat setengah jadi ini hanya untuk
      // ditampilkan selagi berjalan. Jawaban yang sah tetap `reply.response.text`.
      let jawaban = ""
      const reply = await streamChat(
        { question, session_id: getSessionId(), history, unit: tujuan },
        {
          signal: current.signal,
          onStatus: (stage) => {
            // Status yang tiba setelah token pertama tidak boleh menghapus teks
            // yang sudah terbaca mahasiswa.
            if (!jawaban) replace({ id: replyId, role: "assistant", state: "pending", stage })
          },
          onToken: (potongan) => {
            jawaban += potongan
            replace({ id: replyId, role: "assistant", state: "streaming", text: jawaban })
          },
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

  /**
   * FE-5: satu klik, tanpa konfirmasi. Dikembalikan bila gagal terkirim.
   *
   * Jempol ke bawah membuka kotak catatan opsional sesudahnya -- penilaiannya
   * sendiri sudah tercatat saat itu juga, jadi mahasiswa yang mengabaikan kotak
   * itu tetap terhitung. Jempol ke atas menutupnya kembali: catatan "apa yang
   * kurang tepat" tidak berarti apa-apa pada jawaban yang dinilai membantu.
   */
  async function rate(messageId: string, helpful: boolean) {
    const previous = ratings[messageId]
    if (previous === helpful) {
      // Menekan ulang 👎 yang sama: buka lagi kotaknya, supaya mahasiswa yang
      // menutupnya lalu berubah pikiran punya jalan kembali.
      if (!helpful) setNotes((prev) => ({ ...prev, [messageId]: "open" }))
      return
    }

    setRatings((prev) => ({ ...prev, [messageId]: helpful }))
    setNotes((prev) => (helpful ? tanpa(prev, messageId) : { ...prev, [messageId]: "open" }))
    try {
      await sendFeedback({ message_id: messageId, helpful }, getSessionId())
    } catch {
      setRatings((prev) => {
        const next = { ...prev }
        if (previous === undefined) delete next[messageId]
        else next[messageId] = previous
        return next
      })
      setNotes((prev) => tanpa(prev, messageId))
    }
  }

  /**
   * Kirim catatan yang menyertai 👎 (kolom `feedback.catatan`).
   *
   * Dikirim sebagai umpan balik yang sama sekali lagi, bukan tambahan: server
   * mengganti baris lama untuk `message_id` yang sama, sehingga satu jawaban
   * tetap satu baris dan rasio kepuasan AD-5 tidak terhitung dua kali.
   */
  async function submitNote(messageId: string, catatan: string) {
    const isi = catatan.trim()
    if (!isi) {
      dismissNote(messageId)
      return
    }

    setNotes((prev) => ({ ...prev, [messageId]: "sending" }))
    try {
      await sendFeedback(
        { message_id: messageId, helpful: false, catatan: isi },
        getSessionId()
      )
      setNotes((prev) => ({ ...prev, [messageId]: "sent" }))
    } catch {
      // Kotaknya tetap terbuka beserta isinya: catatan yang sudah diketik
      // mahasiswa tidak boleh hilang hanya karena koneksi tersendat.
      setNotes((prev) => ({ ...prev, [messageId]: "error" }))
    }
  }

  function dismissNote(messageId: string) {
    setNotes((prev) => tanpa(prev, messageId))
  }

  const feedback: FeedbackControls = { ratings, notes, rate, submitNote, dismissNote }

  /** Klik satu topik: dicatat sebagai giliran mahasiswa, lalu berlaku untuk pertanyaan berikutnya. */
  function chooseTopic(pilihan: string) {
    const id = nextId.current++
    setUnit(pilihan)
    setEntries((prev) => [...prev, { id, role: "topic", unit: pilihan }])
  }

  return { entries, busy, send, feedback, unit, chooseTopic }
}

function tanpa<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record }
  delete next[key]
  return next
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
    // Klik topik tidak ikut: "Keuangan" bukan pertanyaan, dan menyertakannya
    // hanya mengacaukan penulisan ulang query (FR-4).
    if (entry.role === "user") turns.push({ role: "user", konten: entry.text })
    else if (entry.role === "assistant" && entry.state === "done" && entry.reply.complete) {
      turns.push({ role: "assistant", konten: entry.reply.response.text })
    }
  }
  return turns.slice(-HISTORY_LIMIT)
}
