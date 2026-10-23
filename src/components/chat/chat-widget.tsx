"use client"

import { useState, useSyncExternalStore } from "react"
import { FaTimes } from "react-icons/fa"

import { nimLoginSads } from "@/lib/sads"

import styles from "./chat.module.css"
import { ChatLogo } from "./chat-logo"
import { ChatPanel, PANEL_ID } from "./chat-panel"

/**
 * Asisten administrasi yang mengambang di pojok portal (FE-1..FE-6).
 *
 * Situs lain mendapat tombol dan panel yang sama lewat `public/embed.js`.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [nimSads, setNimSads] = useState<string | null>(null)
  // Di layar sempit panelnya sudah selebar layar (media query di
  // chat.module.css), jadi "Perluas jendela" tidak ditawarkan.
  const layarLebar = useSyncExternalStore(pantauLayarLebar, layarLebarSekarang, () => true)

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
        expandable={layarLebar}
      />

      <button
        type="button"
        className={styles.launcher}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {open ? <FaTimes aria-hidden /> : <ChatLogo size={24} />}
        <span className={styles.launcherLabel}>{open ? "Tutup" : "Tanya Asisten"}</span>
      </button>
    </>
  )
}

/** Batas yang sama dengan `@media (max-width: 575px)` di chat.module.css. */
const LAYAR_LEBAR = "(min-width: 576px)"

function pantauLayarLebar(onChange: () => void) {
  const media = window.matchMedia(LAYAR_LEBAR)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

function layarLebarSekarang() {
  return window.matchMedia(LAYAR_LEBAR).matches
}
