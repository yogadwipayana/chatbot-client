/**
 * Data contoh portal akademik.
 *
 * API chatbot sengaja tidak menyimpan identitas mahasiswa (PRD §11), jadi
 * ringkasan studi di bawah hanya pengisi tampilan sampai portal ini terhubung ke
 * sistem akademik yang sebenarnya. Jangan pernah meneruskan isinya ke API chat.
 */

export type Student = {
  nim: string
  nama: string
  fakultas: string
  jurusan: string
  tipeKelas: string
  dosenPa: string
  periode: string
  ipSemesterSebelumnya: string
  sksLulusWajib: { lulus: number; total: number }
  sksLulusPilihan: { lulus: number; total: number }
}

export type Course = {
  nama: string
  jadwal: string[]
  dosen: string
  enrollmentKey: string
  linkZoom: string
  perwalian: boolean
  pembayaran: boolean
}

export const student: Student = {
  nim: "2401010273",
  nama: "I Kadek Yoga Dwipayana",
  fakultas: "Fakultas Teknologi dan Informatika",
  jurusan: "IF-MTI",
  tipeKelas: "Reguler",
  dosenPa: "Dr. I Kadek Budi Sandika, S.T., M.Pd.",
  periode: "Ganjil - 2026/2027",
  ipSemesterSebelumnya: "3.73",
  sksLulusWajib: { lulus: 84, total: 135 },
  sksLulusPilihan: { lulus: 0, total: 9 },
}

const SABTU_MALAM = "Sabtu 17:20 - 19:50 ()"

function course(nama: string, jadwal: string): Course {
  return {
    nama,
    jadwal: [jadwal],
    dosen: "",
    enrollmentKey: "",
    linkZoom: "",
    perwalian: true,
    pembayaran: true,
  }
}

export const courses: Course[] = [
  course("Communication Skill - MB", SABTU_MALAM),
  course("Kepemimpinan - MB", SABTU_MALAM),
  course("Keterampilan Kerja - MB", SABTU_MALAM),
  course("Magang Industri - MB", SABTU_MALAM),
  course("Manajemen Organisasi - MB", SABTU_MALAM),
  course("Metodologi Penelitian - AD", "Jumat 19:50 - 22:20 (ONLINE)"),
  course("Problem Solving - MB", SABTU_MALAM),
]
