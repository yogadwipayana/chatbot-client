"use client"

import { FaCheck, FaChevronRight } from "react-icons/fa"

import type { Unit } from "@/lib/api/chat"
import { PANJANG_NIM, type HasilNim } from "@/lib/nim"
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
            {unit.name}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Isian NIM di atas ubin topik. Wajib: ubin topik dan kotak pertanyaan baru
 * aktif setelah NIM-nya sah. Jawaban yang di dokumen berbeda per prodi atau
 * angkatan -- harga sertifikasi, kurikulum -- dijawab untuk penanya, dan NIM-nya
 * dicatat bersama pertanyaan; teks di bawah isian memberi tahu keduanya
 * sebelum NIM diketik.
 *
 * Hanya angka yang diterima. Hasil uraiannya ditampilkan di bawahnya, jadi NIM
 * yang salah ketik terlihat sebelum pertanyaan pertama terkirim.
 */
export function NimField({
  id,
  value,
  onChange,
  hasil,
}: {
  id: string
  value: string
  onChange: (nim: string) => void
  hasil: HasilNim
}) {
  const salah = hasil.status === "tidak-dikenal" || hasil.status === "tanpa-daftar"
  return (
    <div className={styles.nim}>
      <div className={styles.nimRow}>
        <label htmlFor={id} className={styles.nimLabel}>
          NIM <span>(wajib)</span>
        </label>
        <input
          id={id}
          className={styles.nimInput}
          value={value}
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, "").slice(0, PANJANG_NIM))
          }
          // Tanpa `maxLength`: peramban memotong sebelum `onChange` menyaring,
          // jadi NIM yang ditempel berspasi ("2401 0101 01") kehilangan angka
          // terakhirnya. Batasnya dipegang `slice` di atas.
          inputMode="numeric"
          autoComplete="off"
          placeholder="mis. 2401010101"
          required
          aria-invalid={salah}
          aria-describedby={`${id}-info`}
        />
      </div>
      <p id={`${id}-info`} className={cx(styles.nimInfo, salah && styles.nimInfoError)}>
        {hasil.status === "sah" ? (
          <>
            <FaCheck aria-hidden className={styles.nimOk} />
            {hasil.prodi.name} ({hasil.prodi.level}) · angkatan {hasil.angkatan}
          </>
        ) : hasil.status === "tidak-dikenal" ? (
          hasil.pesan
        ) : hasil.status === "tanpa-daftar" ? (
          "Daftar prodi gagal dimuat, jadi NIM belum dapat diperiksa. Tutup lalu buka lagi panel ini, atau muat ulang halaman."
        ) : hasil.status === "belum-lengkap" ? (
          `NIM terdiri dari ${PANJANG_NIM} angka.`
        ) : (
          "Jawaban disesuaikan dengan prodi dan angkatan Anda. NIM dicatat bersama pertanyaan Anda."
        )}
      </p>
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
