"use client"

import { useState } from "react"
import { BsArrowDownUp, BsSortDown, BsSortDownAlt } from "react-icons/bs"
import { FaCheck, FaTimes } from "react-icons/fa"

import { Box } from "@/components/ui/box"
import type { Course } from "@/lib/portal-data"
import { cx } from "@/lib/utils"

import styles from "./course-table.module.css"

type SortKey = keyof Course
type Sort = { key: SortKey; direction: "asc" | "desc" }

const COLUMNS: Array<{ key: SortKey; label: string; center?: boolean }> = [
  { key: "nama", label: "Matakuliah" },
  { key: "jadwal", label: "Jadwal" },
  { key: "dosen", label: "Dosen" },
  { key: "enrollmentKey", label: "Enrollment Key" },
  { key: "linkZoom", label: "Link Zoom" },
  { key: "perwalian", label: "Perwalian", center: true },
  { key: "pembayaran", label: "Pembayaran", center: true },
]

export function CourseTable({ courses }: { courses: Course[] }) {
  const [sort, setSort] = useState<Sort>({ key: "nama", direction: "asc" })

  const sorted = [...courses].sort((a, b) => {
    const order = sortValue(a, sort.key).localeCompare(sortValue(b, sort.key), "id", {
      numeric: true,
    })
    return sort.direction === "asc" ? order : -order
  })

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    )
  }

  return (
    <Box title="Daftar Matakuliah Yang Diambil">
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => {
                const active = sort.key === key
                const Icon = !active ? BsArrowDownUp : sort.direction === "asc" ? BsSortDownAlt : BsSortDown
                return (
                  <th
                    key={key}
                    scope="col"
                    aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <button
                      type="button"
                      className={cx(styles.sortButton, active && styles.sorted)}
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <Icon className={styles.sortIcon} aria-hidden />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((course) => (
              <tr key={course.nama}>
                <td>{course.nama}</td>
                <td>
                  <ol className={styles.schedule}>
                    {course.jadwal.map((jadwal) => (
                      <li key={jadwal}>{jadwal}</li>
                    ))}
                  </ol>
                </td>
                <td>{course.dosen}</td>
                <td>{course.enrollmentKey}</td>
                <td>
                  {course.linkZoom && (
                    <a href={course.linkZoom} target="_blank" rel="noopener noreferrer">
                      {course.linkZoom}
                    </a>
                  )}
                </td>
                <td className={styles.center}>
                  <StatusMark ok={course.perwalian} label="Perwalian" />
                </td>
                <td className={styles.center}>
                  <StatusMark ok={course.pembayaran} label="Pembayaran" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  )
}

function StatusMark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cx(styles.mark, ok ? styles.markOk : styles.markPending)}>
      {ok ? <FaCheck aria-hidden /> : <FaTimes aria-hidden />}
      <span className="sr-only">{`${label} ${ok ? "sudah" : "belum"} selesai`}</span>
    </span>
  )
}

function sortValue(course: Course, key: SortKey): string {
  const value = course[key]
  return Array.isArray(value) ? value.join(" ") : String(value)
}
