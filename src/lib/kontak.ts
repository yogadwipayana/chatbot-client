/**
 * Nomor telepon di teks kontak dijadikan tautan satu ketuk.
 *
 * Mahasiswa membuka asisten dari HP (PRD §4); nomor yang harus disalin manual
 * ke aplikasi telepon atau WhatsApp adalah jalan keluar yang setengah jadi.
 * Nomor yang didahului label "WhatsApp"/"WA" dibuka di WhatsApp, selebihnya
 * lewat `tel:`.
 *
 * Hanya dipakai untuk teks yang disusun server dari daftar kontak (banner
 * eskalasi, penolakan, balasan dukungan) -- bukan untuk jawaban LLM, yang bisa
 * memuat deretan angka lain seperti nomor rekening atau virtual account.
 */

export type PotonganKontak = {
  teks: string
  /** Tidak ada = teks biasa. */
  href?: string
  /** true = dibuka di tab/aplikasi lain (WhatsApp). */
  eksternal?: boolean
}

/**
 * Nomor Indonesia berawalan 0 atau +62, dengan kode area yang boleh diapit
 * kurung dan kelompok angka yang dipisah spasi, titik, atau tanda hubung:
 * "(0361) 256995", "0813-3896-9832", "+62 813 3896 9832".
 *
 * Awalan 0 dengan minimal dua digit sesudahnya sengaja wajib, supaya jam
 * ("08.00-22.00") dan tanggal tidak ikut terbaca sebagai nomor.
 */
const NOMOR = /\(?(?:\+62[\s-]?|0)\d{2,4}\)?[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/g

const LABEL_WHATSAPP = /whats\s*app|\bwa\b/i

/** Seberapa jauh ke belakang label "WhatsApp" dicari dari sebuah nomor. */
const JANGKAUAN_LABEL = 20

export function potongKontak(teks: string): PotonganKontak[] {
  const hasil: PotonganKontak[] = []
  let awal = 0
  for (const cocok of teks.matchAll(NOMOR)) {
    const posisi = cocok.index
    if (posisi > awal) hasil.push({ teks: teks.slice(awal, posisi) })

    const digit = cocok[0].replace(/\D/g, "")
    const internasional = digit.startsWith("62") ? digit : `62${digit.slice(1)}`
    // Label dicari hanya sejak nomor sebelumnya: pada "Telepon (0361) 256995 /
    // WhatsApp 0813-...", label WhatsApp milik nomor kedua, bukan pertama.
    const label = teks.slice(Math.max(awal, posisi - JANGKAUAN_LABEL), posisi)
    const whatsapp = LABEL_WHATSAPP.test(label)
    hasil.push({
      teks: cocok[0],
      href: whatsapp ? `https://wa.me/${internasional}` : `tel:+${internasional}`,
      eksternal: whatsapp,
    })
    awal = posisi + cocok[0].length
  }
  if (awal < teks.length) hasil.push({ teks: teks.slice(awal) })
  return hasil
}
