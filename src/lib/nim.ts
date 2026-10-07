import type { Program } from "@/lib/api/chat"

/** NIM INSTIKI: `aaabbddccc` -- angkatan, fakultas, prodi, nomor urut. */
export const PANJANG_NIM = 10

export type HasilNim =
  /** Daftar prodi gagal dimuat: NIM apa pun belum dapat diperiksa. */
  | { status: "tanpa-daftar" }
  | { status: "kosong" }
  | { status: "belum-lengkap" }
  | { status: "tidak-dikenal"; pesan: string }
  | { status: "sah"; nim: string; prodi: Program; angkatan: number }

/**
 * Periksa NIM sebelum dikirim, dengan aturan yang sama dengan API
 * (`app.prodi.urai_nim`): kode prodi dari digit 4-7, angkatan dari dua digit
 * pertama. NIM wajib dan dikirim utuh; hasil uraian di sini hanya untuk
 * memberi tahu mahasiswa lebih awal -- prodi dan angkatan yang dipakai
 * jawaban dan dicatat tetap diurai API sendiri.
 *
 * "240" berarti angkatan 2024: dua digit pertama adalah tahunnya. Digit ketiga
 * tidak dipakai.
 */
export function uraiNim(
  nim: string,
  programs: Program[],
  tahunIni: number = new Date().getFullYear()
): HasilNim {
  if (programs.length === 0) return { status: "tanpa-daftar" }
  if (nim === "") return { status: "kosong" }
  if (!/^\d+$/.test(nim) || nim.length !== PANJANG_NIM) return { status: "belum-lengkap" }

  const angkatan = 2000 + Number(nim.slice(0, 2))
  const prodi = programs.find((program) => program.code === nim.slice(3, 7))
  if (!prodi) return { status: "tidak-dikenal", pesan: "Prodi pada NIM ini tidak dikenali." }
  if (angkatan > tahunIni) {
    return { status: "tidak-dikenal", pesan: "Angkatan pada NIM ini tidak sesuai." }
  }
  return { status: "sah", nim, prodi, angkatan }
}
