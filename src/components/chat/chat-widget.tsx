"use client"

import { useState } from "react"
import { FaComments, FaTimes } from "react-icons/fa"

import { nimLoginSads } from "@/lib/sads"

import styles from "./chat.module.css"
import { ChatPanel, PANEL_ID } from "./chat-panel"

/**
 * Asisten administrasi yang mengambang di pojok portal (FE-1..FE-6).
 *
 * Situs lain mendapat tombol dan panel yang sama lewat `public/embed.js`.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [nimSads, setNimSads] = useState<string | null>(null)

  function toggle() {
    // Dibaca saat panel dibuka, bukan saat halaman dimuat: data login SADS
    // (di portal ini tiruannya) sudah pasti tertulis pada saat itu.
    if (!open) setNimSads(nimLoginSads())
    setOpen(!open)
  }

  return (
    <>
      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        className={styles.panel}
        nimSads={nimSads}
      />

      <button
        type="button"
        className={styles.launcher}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {open ? <FaTimes aria-hidden /> : <FaComments aria-hidden />}
        <span className={styles.launcherLabel}>{open ? "Tutup" : "Tanya Asisten"}</span>
      </button>
    </>
  )
}
