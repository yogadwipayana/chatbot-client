import { useEffect, useState } from "react"

import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import type { ChatEntry } from "./use-chat"

/**
 * Maskot asisten: slime merah. Asetnya WebP animasi di `public/maskot/`, dibuat dari GIF
 * asli oleh `docs/maskot/buat-maskot.mjs`; asal-usul, tempat setiap ekspresi,
 * dan cara menambah ekspresi ada di `docs/maskot/README.md`.
 *
 * Hiasan saja: setiap tempat yang memakainya sudah punya teksnya sendiri,
 * jadi gambarnya tanpa teks alternatif.
 *
 * Panel `/embed` di situs lain (`public/embed.js`) adalah halaman portal ini
 * di dalam iframe, jadi maskot di panel ikut tampil di sana tanpa disalin.
 * Maskot tombol pembuka disalin di `embed.js`,
 * karena tombol itu digambar di halaman penyemat.
 */
/** Durasi (ms) satu putaran berkas WebP, dicetak oleh `buat-maskot.mjs`. */
export const DURASI = {
  "idle-breathing": 3150,
  "idle-blink": 3600,
  "idle-curious": 4500,
  "idle-wobble": 2520,
  "searching-multi-action": 7200,
  confused: 3150,
  "no-answer-confused-sad": 6750,
  sad: 2340,
  success: 2250,
}

export type Ekspresi = keyof typeof DURASI

/**
 * Versi aset `public/maskot/`, ikut di URL-nya (`?v=`): asetnya disimpan
 * peramban seminggu (next.config.ts), jadi naikkan setiap kali
 * `docs/maskot/buat-maskot.mjs` dijalankan ulang. Sama dengan `VERSI_MASKOT`
 * di `public/embed.js`.
 */
const VERSI_MASKOT = "20261127-2"

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
    <picture className={cx(styles.maskot, className)} style={{ width: ukuran, height: ukuran }}>
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

/** Reaksi kepala panel setelah balasan. `null` mengembalikan maskot ke idle. */
export function ekspresiBalasan(entry: ChatEntry): Ekspresi | null {
  if (entry.role !== "assistant") return null
  if (entry.state === "error") return "sad"
  if (entry.state !== "done") return null
  const { response, complete } = entry.reply
  if (!complete) return "sad"
  if (response.kind === "refusal") return "no-answer-confused-sad"
  if (response.kind === "rejected") return "confused"
  if (response.kind === "answer") return "success"
  return null
}

/**
 * Maskot di kepala panel, di sebelah "Asisten Administrasi". Setiap ekspresi
 * di antrean diputar satu putaran sebelum kembali ke idle breathing.
 */
export function MaskotKepala({ open, reaksi }: { open: boolean; reaksi: Reaksi }) {
  const [antrean, setAntrean] = useState<Ekspresi[]>(open ? ["idle-curious"] : [])
  const [openSebelumnya, setOpenSebelumnya] = useState(open)
  const [reaksiSebelumnya, setReaksiSebelumnya] = useState(reaksi.ke)
  if (open !== openSebelumnya) {
    setOpenSebelumnya(open)
    if (open) setAntrean(["idle-curious"])
  }
  if (reaksi.ke !== reaksiSebelumnya) {
    setReaksiSebelumnya(reaksi.ke)
    setAntrean(reaksi.antrean)
  }

  useEffect(() => {
    const [ekspresi] = antrean
    if (!open || !ekspresi) return
    const timer = setTimeout(() => setAntrean((sisa) => sisa.slice(1)), DURASI[ekspresi])
    return () => clearTimeout(timer)
  }, [antrean, open])

  return (
    <span className={styles.headerMaskot} aria-hidden>
      <Maskot ekspresi={antrean[0] ?? "idle-breathing"} ukuran={50} />
    </span>
  )
}

/** Kepala panel pengganti (`EmbedUnavailable`). */
export function MaskotKepalaDiam() {
  return (
    <span className={styles.headerMaskot} aria-hidden>
      <Maskot ekspresi="idle-breathing" ukuran={50} />
    </span>
  )
}
