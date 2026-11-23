import { useEffect, useState } from "react"

import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import type { ChatEntry } from "./use-chat"

/**
 * Maskot asisten: gumpalan putih bergaris tepi gelap, pengganti logo balon
 * sejak 2026-11-23. Asetnya WebP animasi di `public/maskot/`, dibuat dari GIF
 * asli oleh `docs/maskot/buat-maskot.mjs`; asal-usul, tempat setiap ekspresi,
 * dan cara menambah ekspresi ada di `docs/maskot/README.md`.
 *
 * Hiasan saja: setiap tempat yang memakainya sudah punya teksnya sendiri,
 * jadi gambarnya tanpa teks alternatif.
 *
 * Panel `/embed` di situs lain (`public/embed.js`) adalah halaman portal ini
 * di dalam iframe, jadi maskot di panel ikut tampil di sana tanpa disalin.
 * Maskot tombol pembuka disalin di `embed.js` (`IKON_BUKA`, `aturMaskot`),
 * karena tombol itu digambar di halaman penyemat.
 */
export type Ekspresi =
  | "netral"
  | "ngantuk"
  | "dapat-ide"
  | "bingung"
  | "senang"
  | "melambai"
  | "pusing"
  | "selamat-tinggal"
  | "bonus-like"
  | "bonus-dislike"

/**
 * Versi aset `public/maskot/`, ikut di URL-nya (`?v=`): asetnya disimpan
 * peramban seminggu (next.config.ts), jadi naikkan setiap kali
 * `docs/maskot/buat-maskot.mjs` dijalankan ulang. Sama dengan `VERSI_MASKOT`
 * di `public/embed.js`.
 */
const VERSI_MASKOT = "20261123"

/** Satu putaran animasi setiap ekspresi: 38 frame x 80 ms. */
export const SATU_PUTARAN = 3040

/**
 * Tombol pembuka yang tidak disentuh (tidak diarahkan, tidak difokus, panel
 * tertutup) selama ini berganti ke maskot mengantuk. Sama dengan
 * `NGANTUK_SETELAH` di `public/embed.js`.
 */
export const NGANTUK_SETELAH = 60_000

export function Maskot({
  ekspresi,
  ukuran,
  className,
}: {
  ekspresi: Ekspresi
  /** Lebar dan tinggi tampil (px); berkasnya 128 px. */
  ukuran: number
  className?: string
}) {
  const animasi = `/maskot/${ekspresi}.webp?v=${VERSI_MASKOT}`
  const frameDiam = `/maskot/${ekspresi}-diam.webp?v=${VERSI_MASKOT}`
  return (
    // `alt=""` sudah menyembunyikannya dari pembaca layar.
    <picture className={cx(styles.maskot, className)}>
      {/* Pengguna yang meminta gerakan dikurangi mendapat frame diamnya. */}
      <source media="(prefers-reduced-motion: reduce)" srcSet={frameDiam} />
      {/* `lazy`: panel portal terpasang tersembunyi di setiap halaman; aset
          maskot baru diunduh saat panelnya benar-benar dibuka. Ekspresi yang
          berganti tidak berkedip kosong: peramban tetap menampilkan gambar
          lama sampai gambar baru selesai dimuat. */}
      <img
        src={animasi}
        alt=""
        width={ukuran}
        height={ukuran}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </picture>
  )
}

/**
 * Reaksi maskot kepala panel. `ke` bertambah setiap kali ada reaksi baru,
 * jadi reaksi yang sama berturut-turut (dua 👍) tetap diputar ulang.
 */
export type Reaksi = { ke: number; antrean: Ekspresi[] }

/**
 * Ekspresi kepala panel untuk balasan yang baru selesai (keputusan user
 * 2026-11-23: di percakapan maskot hanya ada di gelembung menunggu; situasi
 * jawaban ditunjukkan maskot kepala panel). null = tetap netral: jawaban
 * dokumen biasa (keputusan user: wajah senang di atas kabar buruk -- tunggakan,
 * sanksi -- terasa janggal), balasan dukungan untuk mahasiswa yang sedang
 * tertekan, dan jawaban yang dihentikan.
 */
export function ekspresiBalasan(entry: ChatEntry): Ekspresi | null {
  if (entry.role !== "assistant") return null
  if (entry.state === "error") return "pusing"
  if (entry.state !== "done") return null
  const { response, complete } = entry.reply
  // Koneksi terputus di tengah jawaban.
  if (!complete) return "pusing"
  if (response.kind === "smalltalk") return "senang"
  if (response.kind === "refusal" || response.kind === "rejected") return "bingung"
  return null
}

/**
 * Maskot di kepala panel, di sebelah "Asisten Administrasi". Setiap ekspresi
 * di antrean diputar satu putaran, lalu kembali netral:
 * - panel dibuka: melambai;
 * - `reaksi` baru dari `ChatPanel`: situasi jawaban (`ekspresiBalasan`),
 *   👍/👎, atau "Percakapan baru" (selamat tinggal untuk percakapan lama, lalu
 *   melambai menyambut yang baru).
 */
export function MaskotKepala({ open, reaksi }: { open: boolean; reaksi: Reaksi }) {
  const [antrean, setAntrean] = useState<Ekspresi[]>(open ? ["melambai"] : [])
  const [openSebelumnya, setOpenSebelumnya] = useState(open)
  const [reaksiSebelumnya, setReaksiSebelumnya] = useState(reaksi.ke)
  if (open !== openSebelumnya) {
    setOpenSebelumnya(open)
    if (open) setAntrean(["melambai"])
  }
  if (reaksi.ke !== reaksiSebelumnya) {
    setReaksiSebelumnya(reaksi.ke)
    setAntrean(reaksi.antrean)
  }

  useEffect(() => {
    if (antrean.length === 0) return
    const timer = setTimeout(() => setAntrean((sisa) => sisa.slice(1)), SATU_PUTARAN)
    return () => clearTimeout(timer)
  }, [antrean])

  return (
    <span className={styles.headerMaskot} aria-hidden>
      <Maskot ekspresi={antrean[0] ?? "netral"} ukuran={50} className={styles.maskotTengah} />
    </span>
  )
}

/** Kepala panel pengganti (`EmbedUnavailable`): netral, tanpa lambaian. */
export function MaskotKepalaDiam() {
  return (
    <span className={styles.headerMaskot} aria-hidden>
      <Maskot ekspresi="netral" ukuran={50} className={styles.maskotTengah} />
    </span>
  )
}
