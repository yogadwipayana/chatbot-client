"use client"

import { FaChevronRight } from "react-icons/fa"

import type { Unit } from "@/lib/api/chat"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"

/**
 * Ubin topik: pintu masuk percakapan, seperti daftar kategori di halaman FAQ.
 *
 * Satu topik = satu unit layanan; pertanyaan berikutnya hanya dicari di dokumen
 * unit itu. Kotak pertanyaan baru muncul setelah salah satunya dipilih. Ubinnya
 * hanya nama unit -- ringkas, supaya seluruh daftar muat tanpa digulir.
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
  /** Topik yang sedang berlaku; undefined = belum memilih. */
  active: string | null | undefined
  onPick: (unit: string) => void
  id?: string
}) {
  return (
    <div id={id} className={styles.topics} role="group" aria-label="Pilih topik">
      {units.map((unit) => {
        const aktif = active === unit.nama
        return (
          <button
            key={unit.nama}
            type="button"
            className={cx(styles.topic, aktif && styles.topicActive)}
            aria-pressed={aktif}
            onClick={() => onPick(unit.nama)}
          >
            {unit.nama}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Balasan setelah topik dipilih. `questions` undefined = masih dimuat.
 *
 * Kalimatnya menyebut unitnya dengan jelas: itulah satu-satunya petunjuk bagi
 * mahasiswa bahwa pertanyaan berikutnya tidak lagi dicari di semua dokumen.
 */
export function topicReply(unit: string, questions: string[] | undefined): string {
  const lingkup = `Baik, pertanyaan Anda akan saya carikan di dokumen ${unit}.`
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
