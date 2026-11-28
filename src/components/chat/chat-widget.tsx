"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { FiChevronDown } from "react-icons/fi"

import { nimLoginSads } from "@/lib/sads"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import { DURASI, Maskot } from "./chat-maskot"
import { ChatPanel, PANEL_ID } from "./chat-panel"

const AJAKAN = ["Ada yang ingin ditanyakan?", "Butuh bantuan?", "Mau tanya soal kampus?"]
const EKSPRESI_IDLE = ["idle-blink", "idle-curious", "idle-wobble"] as const

/**
 * Asisten administrasi yang mengambang di pojok portal (FE-1..FE-6).
 *
 * Situs lain memasang tombolnya lewat `public/embed.js`.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [nimSads, setNimSads] = useState<string | null>(null)
  const [idle, setIdle] = useState<(typeof EKSPRESI_IDLE)[number]>("idle-blink")
  // Di layar sempit panelnya sudah selebar layar (media query di
  // chat.module.css), jadi "Perluas jendela" tidak ditawarkan.
  const layarLebar = useSyncExternalStore(pantauLayarLebar, layarLebarSekarang, () => true)
  useEffect(() => {
    if (open) return
    const timer = setTimeout(() => {
      const pilihan = EKSPRESI_IDLE.filter((ekspresi) => ekspresi !== idle)
      setIdle(pilihan[Math.floor(Math.random() * pilihan.length)])
    }, DURASI[idle])
    return () => clearTimeout(timer)
  }, [idle, open])

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
        className={cx(styles.launcher, open && styles.launcherOpen)}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={PANEL_ID}
      >
        {/* Ikon maskot dan panah bertumpuk supaya pergantiannya bisa dianimasikan. */}
        <span className={cx(styles.launcherIcon, styles.launcherMaskot)} aria-hidden>
          <Maskot ekspresi={idle} ukuran={48} />
        </span>
        <span className={cx(styles.launcherIcon, styles.launcherChevron)} aria-hidden>
          <FiChevronDown />
        </span>
        {!open && (
          <span className={styles.launcherPrompts} aria-hidden>
            {AJAKAN.map((teks) => (
              <span key={teks} className={styles.launcherPrompt}>
                {teks}
              </span>
            ))}
          </span>
        )}
        {/* Tombolnya hanya ikon; namanya tetap ada untuk pembaca layar. */}
        <span className="sr-only">{open ? "Tutup" : "Tanya Asisten"}</span>
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
