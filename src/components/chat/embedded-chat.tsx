"use client"

import { useEffect, useState } from "react"

import styles from "./chat.module.css"
import { ChatPanel } from "./chat-panel"

/**
 * Pesan antara halaman ini dan `public/embed.js` di situs penyemat. Namanya
 * harus sama di kedua sisi. Isinya hanya sinyal buka/tutup: percakapan
 * mahasiswa tidak pernah keluar dari iframe.
 */
const PESAN_BUKA = "asisten:buka"
const PESAN_TUTUP = "asisten:tutup"

/**
 * Isi halaman `/embed`.
 *
 * `widget` = dimuat `embed.js`, yang memegang tombol pembukanya; tombol tutup
 * di panel meminta skrip itu menyembunyikan iframe. Tanpanya halaman ini
 * dibuka langsung (tautan atau iframe biasa) dan tidak ada yang bisa ditutup.
 */
export function EmbeddedChat({ widget }: { widget: boolean }) {
  // Iframe baru dibuat saat tombolnya pertama kali ditekan, jadi mulai terbuka.
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (!widget) return
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return
      const type = (event.data as { type?: unknown } | null)?.type
      // Ditutup lalu dibuka lagi lewat tombol di situs penyemat: kembalikan
      // fokus ke kotak pertanyaan, seperti saat pertama dibuka.
      if (type === PESAN_BUKA) setOpen(true)
      else if (type === PESAN_TUTUP) setOpen(false)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [widget])

  function close() {
    setOpen(false)
    // Asal situs penyemat tidak diketahui -- bisa situs mana pun yang diizinkan
    // `EMBED_ALLOWED_ORIGINS` -- jadi "*". Aman karena isinya hanya sinyal tutup.
    window.parent.postMessage({ type: PESAN_TUTUP }, "*")
  }

  return (
    <ChatPanel open={open} onClose={widget ? close : undefined} className={styles.embedded} />
  )
}
