"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { FiChevronDown } from "react-icons/fi"

import { nimLoginSads } from "@/lib/sads"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import { Maskot, NGANTUK_SETELAH } from "./chat-maskot"
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
  // Tombol yang lama tidak disentuh -- panel tertutup, tidak diarahkan
  // penunjuk, tidak difokus -- berganti ke maskot mengantuk; disentuh lagi, ia
  // bangun. Hanya tombolnya sendiri yang dipantau, bukan aktivitas halaman.
  const [diarahkan, setDiarahkan] = useState(false)
  const [difokus, setDifokus] = useState(false)
  const [ngantuk, setNgantuk] = useState(false)
  const bangun = open || diarahkan || difokus
  if (bangun && ngantuk) setNgantuk(false)
  useEffect(() => {
    if (bangun) return
    const timer = setTimeout(() => setNgantuk(true), NGANTUK_SETELAH)
    return () => clearTimeout(timer)
  }, [bangun])

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
        onPointerEnter={() => setDiarahkan(true)}
        onPointerLeave={() => setDiarahkan(false)}
        onFocus={() => setDifokus(true)}
        onBlur={() => setDifokus(false)}
      >
        {/* Tertutup: maskot netral, atau mengantuk bila lama tidak disentuh
            (keputusan user 11-23, pengganti logo balon, sama dengan kepala
            panel).
            Terbuka: panah ke bawah, seperti tombol widget Glide -- panelnya
            "turun" kembali ke tombol ini. ✕ tetap ada di kepala panel.
            Keduanya selalu terpasang dan bertumpuk, supaya pergantiannya
            bisa dianimasikan (chat.module.css). */}
        <span className={cx(styles.launcherIcon, styles.launcherMaskot)} aria-hidden>
          <Maskot
            ekspresi={ngantuk ? "ngantuk" : "netral"}
            ukuran={50}
            className={styles.maskotTengah}
          />
        </span>
        <span className={cx(styles.launcherIcon, styles.launcherChevron)} aria-hidden>
          <FiChevronDown />
        </span>
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
