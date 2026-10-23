"use client"

import { useEffect, useState } from "react"

import { bentukNim } from "@/lib/sads"

import styles from "./chat.module.css"
import { ChatLogo } from "./chat-logo"
import { BotBubble } from "./chat-message"
import { ChatPanel } from "./chat-panel"

/**
 * Pesan antara halaman ini dan `public/embed.js` di situs penyemat. Namanya
 * harus sama di kedua sisi. Isinya sinyal buka/tutup, ditambah NIM dari login
 * SADS yang masuk ke iframe: percakapan mahasiswa tidak pernah keluar darinya.
 */
const PESAN_BUKA = "asisten:buka"
const PESAN_TUTUP = "asisten:tutup"
/** iframe → situs: panel siap menerima `PESAN_IDENTITAS`. */
const PESAN_SIAP = "asisten:siap"
/** situs → iframe: `{nim}` mahasiswa yang sedang masuk SADS, atau null. */
const PESAN_IDENTITAS = "asisten:identitas"
/** iframe → situs: `{luas}` dari "Perluas jendela" di menu ⋯; situs melebarkan iframe. */
const PESAN_PERLUAS = "asisten:perluas"

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
  const [nimSads, setNimSads] = useState<string | null>(null)

  useEffect(() => {
    if (!widget) return
    function onMessage(event: MessageEvent) {
      if (event.source !== window.parent) return
      const data = event.data as { type?: unknown; nim?: unknown } | null
      const type = data?.type
      // Ditutup lalu dibuka lagi lewat tombol di situs penyemat: kembalikan
      // fokus ke kotak pertanyaan, seperti saat pertama dibuka.
      if (type === PESAN_BUKA) setOpen(true)
      else if (type === PESAN_TUTUP) setOpen(false)
      // Situs mana pun yang terdaftar untuk kunci ini bisa mengirimnya, jadi
      // nilainya tetap diperiksa `uraiNim` sebelum dipakai.
      else if (type === PESAN_IDENTITAS) setNimSads(bentukNim(data?.nim))
    }
    window.addEventListener("message", onMessage)
    // Baru sekarang pesan balasannya dapat diterima. Data login SADS ada di
    // localStorage halaman induk, yang beda asal: hanya `embed.js` yang bisa
    // membacanya. "*" aman, pesan ini tidak membawa apa-apa.
    window.parent.postMessage({ type: PESAN_SIAP }, "*")
    return () => window.removeEventListener("message", onMessage)
  }, [widget])

  function close() {
    setOpen(false)
    // Asal situs penyemat tidak diketahui -- bisa situs mana pun yang
    // terdaftar untuk kuncinya -- jadi "*". Aman karena isinya hanya sinyal tutup.
    window.parent.postMessage({ type: PESAN_TUTUP }, "*")
  }

  function perluas(luas: boolean) {
    // "*" dengan alasan yang sama: isinya hanya ukuran yang diminta.
    window.parent.postMessage({ type: PESAN_PERLUAS, luas }, "*")
  }

  return (
    <ChatPanel
      open={open}
      onClose={widget ? close : undefined}
      className={styles.embedded}
      embedKey={embedKey}
      nimSads={nimSads}
      // Dibuka sebagai halaman penuh, panelnya sudah selebar halaman. Di
      // layar sempit `embed.js` mengabaikan permintaannya: iframe-nya sudah
      // selebar layar.
      expandable={widget}
      onExpandChange={widget ? perluas : undefined}
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
          <ChatLogo />
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
