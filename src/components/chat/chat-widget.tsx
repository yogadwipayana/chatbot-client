"use client"

import { useState } from "react"
import { FaComments, FaTimes } from "react-icons/fa"

import styles from "./chat.module.css"
import { ChatPanel, PANEL_ID } from "./chat-panel"

/**
 * Asisten administrasi yang mengambang di pojok portal (FE-1..FE-6).
 *
 * Situs lain mendapat tombol dan panel yang sama lewat `public/embed.js`.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ChatPanel open={open} onClose={() => setOpen(false)} className={styles.panel} />

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
