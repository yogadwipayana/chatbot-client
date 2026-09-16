"use client"

import { useEffect, useRef, useState } from "react"
import { FaComments, FaTimes } from "react-icons/fa"

import { fetchSuggestions, type Suggestion } from "@/lib/api/chat"

import styles from "./chat.module.css"
import { AssistantMessage, BotBubble, UserMessage } from "./chat-message"
import { bannerEskalasiTerakhir, useChat } from "./use-chat"

const PANEL_ID = "asisten-administrasi"

/** Asisten administrasi yang mengambang di pojok portal (FE-1..FE-6). */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  // null = belum dimuat. Dimuat saat panel pertama kali dibuka, bukan tiap halaman dibuka.
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const { entries, busy, send, ratings, rate } = useChat()
  const bannerEskalasi = bannerEskalasiTerakhir(entries)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || suggestions !== null) return
    const controller = new AbortController()
    fetchSuggestions(controller.signal).then((items) => {
      if (!controller.signal.aborted) setSuggestions(items)
    })
    return () => controller.abort()
  }, [open, suggestions])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [entries, open])

  function ask(question: string) {
    if (!question.trim() || busy) return
    setDraft("")
    void send(question)
  }

  return (
    <>
      {open && (
        <section
          id={PANEL_ID}
          className={styles.panel}
          role="dialog"
          aria-labelledby={`${PANEL_ID}-judul`}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              <h2 id={`${PANEL_ID}-judul`} className={styles.title}>
                Asisten Administrasi
              </h2>
              <p className={styles.subtitle}>Menjawab dari dokumen resmi kampus</p>
            </div>
            <button
              type="button"
              className={styles.tool}
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten"
            >
              <FaTimes aria-hidden />
            </button>
          </header>

          <div ref={listRef} className={styles.messages} aria-live="polite">
            <BotBubble>
              Halo! Tanyakan urusan administrasi akademik di sini. Setiap jawaban disertai
              sumber dokumen resmi yang bisa Anda buka untuk memeriksanya.
            </BotBubble>

            {entries.length === 0 && suggestions && suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map(({ teks }) => (
                  <button
                    key={teks}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => ask(teks)}
                  >
                    {teks}
                  </button>
                ))}
              </div>
            )}

            {entries.map((entry) =>
              entry.role === "user" ? (
                <UserMessage key={entry.id} text={entry.text} />
              ) : (
                <AssistantMessage
                  key={entry.id}
                  entry={entry}
                  ratings={ratings}
                  onRate={rate}
                  showEscalation={bannerEskalasi.has(entry.id)}
                />
              )
            )}
          </div>

          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault()
              ask(draft)
            }}
          >
            <label htmlFor={`${PANEL_ID}-input`} className="sr-only">
              Pertanyaan
            </label>
            <input
              ref={inputRef}
              id={`${PANEL_ID}-input`}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Tulis pertanyaan…"
              maxLength={2000}
              autoComplete="off"
            />
            <button type="submit" className={styles.send} disabled={busy || !draft.trim()}>
              Kirim
            </button>
          </form>
          <p className={styles.disclaimer}>Periksa sumbernya sebelum mengambil keputusan penting.</p>
        </section>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {open ? <FaTimes aria-hidden /> : <FaComments aria-hidden />}
        <span className={styles.launcherLabel}>{open ? "Tutup" : "Tanya Asisten"}</span>
      </button>
    </>
  )
}
