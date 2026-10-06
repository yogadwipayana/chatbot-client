import type { Program, StudentProfile } from "@/lib/api/chat"

/** NIM INSTIKI: `aaabbddccc` -- angkatan, fakultas, prodi, nomor urut. */
export const PANJANG_NIM = 10

export type HasilNim =
  | { status: "kosong" }
  | { status: "belum-lengkap" }
  | { status: "tidak-dikenal"; pesan: string }
  | { status: "sah"; profil: StudentProfile; prodi: Program }

/**
 * Urai NIM menjadi profil yang boleh dikirim ke API: kode prodi (`bbdd`) dan
 * tahun angkatan. Nomor urutnya (`ccc`) -- satu-satunya bagian yang mengenali
 * orang -- tidak pernah keluar dari fungsi ini (PRD §11).
 *
 * "240" berarti angkatan 2024: dua digit pertama adalah tahunnya. Digit ketiga
 * tidak dipakai.
 */
export function uraiNim(
  nim: string,
  programs: Program[],
  tahunIni: number = new Date().getFullYear()
): HasilNim {
  if (nim === "") return { status: "kosong" }
  if (!/^\d+$/.test(nim) || nim.length !== PANJANG_NIM) return { status: "belum-lengkap" }

  const angkatan = 2000 + Number(nim.slice(0, 2))
  const prodi = programs.find((program) => program.code === nim.slice(3, 7))
  if (!prodi) return { status: "tidak-dikenal", pesan: "Prodi pada NIM ini tidak dikenali." }
  if (angkatan > tahunIni) {
    return { status: "tidak-dikenal", pesan: "Angkatan pada NIM ini tidak sesuai." }
  }
  return {
    status: "sah",
    profil: { program_code: prodi.code, intake_year: angkatan },
    prodi,
  }
}
