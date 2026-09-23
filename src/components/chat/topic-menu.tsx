"use client"

import type { IconType } from "react-icons"
import {
  FaBookOpen,
  FaBuilding,
  FaCertificate,
  FaChevronRight,
  FaConciergeBell,
  FaGraduationCap,
  FaLayerGroup,
  FaQuestion,
  FaRoute,
  FaUniversity,
  FaUsers,
  FaWallet,
} from "react-icons/fa"

import type { Unit } from "@/lib/api/chat"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"

export const TOPIK_LAIN = "Topik lain"

/**
 * Ikon per unit, hanya hiasan. Kuncinya nama unit dalam huruf kecil; unit yang
 * baru ditambahkan atau diganti namanya di tabel `units` tetap tampil, dengan
 * ikon umum.
 */
const IKON: Record<string, IconType> = {
  baak: FaUniversity,
  fo: FaConciergeBell,
  keuangan: FaWallet,
  kemahasiswaan: FaUsers,
  prodi: FaGraduationCap,
  plk: FaRoute,
  fakultas: FaBuilding,
  ups: FaCertificate,
  akademik: FaBookOpen,
}

/**
 * Ubin topik: pintu masuk percakapan, seperti daftar kategori di halaman FAQ.
 *
 * Satu topik = satu unit layanan; pertanyaan berikutnya hanya dicari di dokumen
 * unit itu. Kotak pertanyaan baru muncul setelah salah satunya dipilih.
 * "Topik lain" tetap ada untuk mahasiswa yang tidak tahu unit mana yang
 * menangani urusannya -- memaksa mereka menebak justru berakhir penolakan.
 *
 * Setelah satu topik dipilih menunya disembunyikan ChatPanel -- sembilan ubin
 * yang menetap di atas percakapan mendorong jawaban keluar layar -- dan dibuka
 * lagi lewat tombol "Ganti topik" di dekat kotak pertanyaan. Saat dibuka lagi,
 * ubin yang sedang berlaku ditandai `active`.
 */
export function TopicMenu({
  units,
  active,
  onPick,
  id,
}: {
  units: Unit[]
  /** Topik yang sedang berlaku; null = "Topik lain"; undefined = belum memilih. */
  active: string | null | undefined
  onPick: (unit: string | null) => void
  id?: string
}) {
  return (
    <div id={id} className={styles.topics} role="group" aria-label="Pilih topik">
      {units.map((unit) => {
        const Ikon = IKON[unit.nama.toLowerCase()] ?? FaLayerGroup
        const aktif = active === unit.nama
        return (
          <button
            key={unit.nama}
            type="button"
            className={cx(styles.topic, aktif && styles.topicActive)}
            aria-pressed={aktif}
            onClick={() => onPick(unit.nama)}
          >
            <span className={styles.topicIcon} aria-hidden>
              <Ikon />
            </span>
            <span className={styles.topicName}>{unit.nama}</span>
            {unit.deskripsi && <span className={styles.topicDesc}>{unit.deskripsi}</span>}
          </button>
        )
      })}
      <button
        type="button"
        className={cx(styles.topic, styles.topicOther, active === null && styles.topicActive)}
        aria-pressed={active === null}
        onClick={() => onPick(null)}
      >
        <span className={styles.topicIcon} aria-hidden>
          <FaQuestion />
        </span>
        <span className={styles.topicText}>
          <span className={styles.topicName}>{TOPIK_LAIN}</span>
          <span className={styles.topicDesc}>Belum tahu unitnya? Cari di semua unit</span>
        </span>
        <FaChevronRight aria-hidden className={styles.topicArrow} />
      </button>
    </div>
  )
}

/**
 * Balasan setelah topik dipilih. `questions` undefined = masih dimuat.
 *
 * Kalimatnya menyebut unitnya dengan jelas: itulah satu-satunya petunjuk bagi
 * mahasiswa bahwa pertanyaan berikutnya tidak lagi dicari di semua dokumen.
 */
export function topicReply(unit: string | null, questions: string[] | undefined): string {
  const lingkup = unit
    ? `Baik, pertanyaan Anda akan saya carikan di dokumen ${unit}.`
    : "Baik, saya akan mencari di dokumen semua unit."
  if (questions === undefined) return lingkup
  return questions.length > 0
    ? `${lingkup}\nPilih pertanyaan yang sering diajukan di bawah ini, atau tulis pertanyaan Anda sendiri.`
    : `${lingkup}\nSilakan tulis pertanyaan Anda di bawah.`
}

/** Pertanyaan siap klik: entri tanya jawab admin, jadi selalu ada jawabannya. */
export function FaqQuestions({
  questions,
  onAsk,
  disabled,
}: {
  questions: string[]
  onAsk: (question: string) => void
  disabled: boolean
}) {
  if (questions.length === 0) return null
  return (
    <div
      className={styles.faqQuestions}
      role="group"
      aria-label="Pertanyaan yang sering diajukan"
    >
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          className={styles.suggestion}
          onClick={() => onAsk(question)}
          disabled={disabled}
        >
          <span>{question}</span>
          <FaChevronRight aria-hidden className={styles.topicArrow} />
        </button>
      ))}
    </div>
  )
}
