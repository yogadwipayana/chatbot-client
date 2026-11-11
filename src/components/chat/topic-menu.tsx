"use client"

import { FiChevronRight } from "react-icons/fi"

import type { Unit } from "@/lib/api/chat"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"

/**
 * Ubin topik: pintu masuk percakapan, seperti daftar kategori di halaman FAQ.
 *
 * Satu topik = satu unit layanan; pertanyaan berikutnya hanya dicari di dokumen
 * unit itu. Kotak pertanyaan baru muncul setelah salah satunya dipilih. Barisnya
 * hanya nama unit, tanpa ikon atau emoji (keputusan user 2026-11-11), dalam
 * satu kartu daftar: satu kolom di bawah sambutan, dua kolom (`.choicesCompact`)
 * saat dibuka lagi di dasar percakapan. Keterangan unit (bila diisi admin)
 * tampil kecil di bawah namanya.
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
  disabled,
  id,
}: {
  units: Unit[]
  /** Topik yang sedang berlaku; undefined = belum memilih. */
  active: string | null | undefined
  onPick: (unit: string) => void
  /** Selama NIM belum sah: memilih topik berarti mulai bertanya. */
  disabled: boolean
  id?: string
}) {
  return (
    <div id={id} className={styles.topics} role="group" aria-label="Pilih topik">
      {units.map((unit) => {
        const aktif = active === unit.name
        return (
          <button
            key={unit.name}
            type="button"
            className={cx(styles.topic, aktif && styles.topicActive)}
            aria-pressed={aktif}
            onClick={() => onPick(unit.name)}
            disabled={disabled}
          >
            <span className={styles.topicBody}>
              <span className={styles.topicName}>{unit.name}</span>
              {unit.description && <span className={styles.topicDesc}>{unit.description}</span>}
            </span>
            <FiChevronRight aria-hidden className={styles.topicArrow} />
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
          <FiChevronRight aria-hidden className={styles.topicArrow} />
        </button>
      ))}
    </div>
  )
}
