import { Box } from "@/components/ui/box"
import type { Student } from "@/lib/portal-data"

import styles from "./student-summary.module.css"

export function StudentSummary({ student }: { student: Student }) {
  const profil: Array<[string, string]> = [
    ["NIM", student.nim],
    ["Nama", student.nama],
    ["Fakultas", student.fakultas],
    ["Jurusan", student.jurusan],
    ["Tipe Kelas", student.tipeKelas],
    ["Dosen PA", student.dosenPa],
  ]

  return (
    <Box>
      <div className={styles.summary}>
        <table className={styles.profile}>
          <tbody>
            {profil.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className={styles.colon}>:</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className={styles.stats}>
          <dt>IP Semester Sebelumnya</dt>
          <dd>
            <strong>{student.ipSemesterSebelumnya}</strong>
          </dd>
          <dt>SKS Lulus Wajib</dt>
          <dd>
            <strong>{student.sksLulusWajib.lulus}</strong> / {student.sksLulusWajib.total}
          </dd>
          <dt>SKS Lulus Pilihan</dt>
          <dd>
            <strong>{student.sksLulusPilihan.lulus}</strong> / {student.sksLulusPilihan.total}
          </dd>
        </dl>
      </div>
    </Box>
  )
}
