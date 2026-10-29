/**
 * Penanda Markdown yang dikenali di jawaban: tebal `**...**`, kode sebaris
 * `` `...` `` (format SMS, kode bank), dan miring `*...*`. Sisanya (judul `#`,
 * tautan `[..](..)`, sitasi `[Judul, hal. 12]`) tampil apa adanya.
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
