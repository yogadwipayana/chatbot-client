/**
 * Penanda Markdown yang dikenali di jawaban: tebal `**...**`, kode sebaris
 * `` `...` `` (format SMS, kode bank), dan miring `*...*`. Paragraf, daftar,
 * dan judul `#` dipisah lebih dulu oleh `potongBlok`. Sisanya (tautan
 * `[..](..)`, sitasi `[Judul, hal. 12]`) tampil apa adanya.
 *
 * Miring mengikuti CommonMark versi ketat: satu baris, tanpa spasi tepat di
 * dalam bintang, dan di batas kata. Jadi `2*3*4`, butir `* teks`, dan
 * `harga* ... *syarat` tetap apa adanya. Tebal-miring `***...***` dibaca sebagai
 * tebal berisi `*...*`.
 *
 * Admin memakai salinan yang sama (`potongMarkdown` di
 * `admin/src/components/common.tsx`).
 */
const PENANDA = /\*\*\*[^\s*][^*\n]*?\*\*\*|\*\*[\s\S]+?\*\*|`[^`\n]+`|\*[^\s*](?:[^*\n]*?[^\s*])?\*(?![\w*])/g
const KARAKTER_KATA = /[\w*]/

export type PotonganMarkdown = { jenis: "teks" | "tebal" | "kode" | "miring"; isi: string }

/** Potongan teks berurutan; mana yang lebih dulu muncul, itu yang dipakai. */
export function potongMarkdown(text: string): PotonganMarkdown[] {
  const hasil: PotonganMarkdown[] = []
  let awal = 0
  for (const cocok of text.matchAll(PENANDA)) {
    const penanda = cocok[0]
    const posisi = cocok.index
    const jenis = penanda.startsWith("**") ? "tebal" : penanda.startsWith("`") ? "kode" : "miring"
    if (jenis === "miring" && posisi > 0 && KARAKTER_KATA.test(text[posisi - 1])) continue
    if (posisi > awal) hasil.push({ jenis: "teks", isi: text.slice(awal, posisi) })
    const lebar = jenis === "tebal" ? 2 : 1
    hasil.push({ jenis, isi: penanda.slice(lebar, -lebar) })
    awal = posisi + penanda.length
  }
  if (awal < text.length) hasil.push({ jenis: "teks", isi: text.slice(awal) })
  return hasil
}

export type BlokMarkdown =
  | { jenis: "paragraf" | "judul"; teks: string }
  | { jenis: "daftar"; bernomor: boolean; mulai: number; butir: string[] }

/** `- teks`, `* teks`, `• teks`, `1. teks`, `1) teks`. Tahun (`2026. `) bukan nomor. */
const BUTIR = /^\s*([-*•]|\d{1,3}[.)])\s+(.*)$/
const JUDUL = /^\s*#{1,6}\s+(.*)$/

/**
 * Blok jawaban: paragraf (dipisah baris kosong), daftar berbutir atau
 * bernomor, dan judul `#`. Isi tiap blok tetap diurai `potongMarkdown`.
 *
 * Butir yang dipisah baris kosong tetap satu daftar, dan baris menjorok tepat
 * di bawah butir menjadi lanjutan butir itu. Baris biasa dalam satu paragraf
 * digabung dengan "\n", jadi pergantian barisnya tetap tampil.
 */
export function potongBlok(text: string): BlokMarkdown[] {
  const hasil: BlokMarkdown[] = []
  let paragraf: string[] = []
  // Baris sebelumnya butir daftar: baris menjorok berikutnya lanjutannya.
  let lanjutButir = false

  const tutupParagraf = () => {
    if (paragraf.length > 0) hasil.push({ jenis: "paragraf", teks: paragraf.join("\n") })
    paragraf = []
  }

  for (const baris of text.split("\n")) {
    if (baris.trim() === "") {
      tutupParagraf()
      lanjutButir = false
      continue
    }
    const butir = BUTIR.exec(baris)
    if (butir) {
      tutupParagraf()
      const bernomor = /\d/.test(butir[1])
      const akhir = hasil.at(-1)
      if (akhir?.jenis === "daftar" && akhir.bernomor === bernomor) akhir.butir.push(butir[2])
      else
        hasil.push({
          jenis: "daftar",
          bernomor,
          mulai: bernomor ? Number.parseInt(butir[1], 10) : 1,
          butir: [butir[2]],
        })
      lanjutButir = true
      continue
    }
    const akhir = hasil.at(-1)
    if (lanjutButir && akhir?.jenis === "daftar" && /^\s{2,}/.test(baris)) {
      akhir.butir[akhir.butir.length - 1] += `\n${baris.trim()}`
      continue
    }
    lanjutButir = false
    const judul = JUDUL.exec(baris)
    if (judul) {
      tutupParagraf()
      hasil.push({ jenis: "judul", teks: judul[1] })
      continue
    }
    paragraf.push(baris)
  }
  tutupParagraf()
  return hasil
}
