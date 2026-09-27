"use client"

import { useEffect, useState } from "react"
import { FaRobot } from "react-icons/fa"

import styles from "./chat.module.css"
import { BotBubble } from "./chat-message"
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
 *
 * `embedKey` = kunci situs penyemat yang sudah diperiksa `src/proxy.ts`; ikut
 * dikirim bersama setiap pertanyaan supaya API dapat menolaknya begitu kunci
 * itu dinonaktifkan, juga saat panel ini sedang terbuka.
 */
export function EmbeddedChat({ widget, embedKey }: { widget: boolean; embedKey?: string }) {
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
    // Asal situs penyemat tidak diketahui -- bisa situs mana pun yang
    // terdaftar untuk kuncinya -- jadi "*". Aman karena isinya hanya sinyal tutup.
    window.parent.postMessage({ type: PESAN_TUTUP }, "*")
  }

  return (
    <ChatPanel
      open={open}
      onClose={widget ? close : undefined}
      className={styles.embedded}
      embedKey={embedKey}
    />
  )
}

/**
 * Pengganti panel saat kuncinya tidak dapat dipakai.
 *
 * Tetap ditampilkan di dalam iframe, bukan dibiarkan ditolak peramban: yang
 * membukanya mahasiswa di situs orang lain, dan panel kosong tanpa penjelasan
 * hanya membuatnya mengira asisten rusak.
 */
export function EmbedUnavailable({ status }: { status: "tidak-berlaku" | "gagal" }) {
  return (
    <section className={styles.embedded} aria-labelledby="asisten-tidak-tersedia">
      <header className={styles.header}>
        <span className={styles.headerAvatar} aria-hidden>
          <FaRobot />
        </span>
        <div className={styles.heading}>
          <h2 id="asisten-tidak-tersedia" className={styles.title}>
            Asisten Administrasi
          </h2>
          <p className={styles.subtitle}>Menjawab dari dokumen resmi kampus</p>
        </div>
      </header>
      <div className={styles.messages} role="alert">
        <BotBubble tone="error">
          {status === "tidak-berlaku"
            ? "Asisten tidak tersedia di situs ini. Silakan hubungi pengelola situs, atau ajukan pertanyaan lewat portal akademik."
            : "Asisten sedang tidak dapat dimuat. Coba lagi beberapa saat lagi."}
        </BotBubble>
      </div>
    </section>
  )
}
