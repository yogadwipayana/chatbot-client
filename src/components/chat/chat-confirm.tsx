"use client"

import { useEffect, useRef } from "react"

import styles from "./chat.module.css"

/**
 * Konfirmasi "Percakapan baru" dari menu ⋯. Percakapan tidak disimpan di mana
 * pun, jadi yang terhapus tidak dapat dibuka lagi: satu klik yang meleset di
 * menu tidak boleh menghapusnya.
 *
 * Dialog di dalam panel, bukan `confirm()` atau `<dialog>` modal: keduanya
 * menutupi seluruh halaman SADS, padahal yang ditanyakan hanya isi panel.
 * Latarnya menutupi panel, jadi sisa panel tidak dapat diklik; Tab berputar
 * di antara dua tombolnya. Fokus awal di "Batal", tindakan yang tidak
 * menghapus apa-apa. Escape dan klik di luar kotak sama dengan "Batal".
 */
export function KonfirmasiBaru({
  id,
  sibuk,
  onBatal,
  onSetuju,
}: {
  id: string
  /** Jawaban masih disusun: ikut dihentikan bila disetujui. */
  sibuk: boolean
  onBatal: () => void
  onSetuju: () => void
}) {
  const kotakRef = useRef<HTMLDivElement>(null)
  const batalRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    batalRef.current?.focus()
  }, [])

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      // Hanya dialognya: Escape di panel juga menutup panelnya.
      event.preventDefault()
      event.stopPropagation()
      onBatal()
      return
    }
    if (event.key !== "Tab") return
    const tombol = [...(kotakRef.current?.querySelectorAll("button") ?? [])]
    const pertama = tombol[0]
    const terakhir = tombol[tombol.length - 1]
    if (event.shiftKey && document.activeElement === pertama) {
      event.preventDefault()
      terakhir?.focus()
    } else if (!event.shiftKey && document.activeElement === terakhir) {
      event.preventDefault()
      pertama?.focus()
    }
  }

  return (
    <div
      className={styles.confirmBackdrop}
      onClick={(event) => event.target === event.currentTarget && onBatal()}
    >
      <div
        ref={kotakRef}
        className={styles.confirm}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-judul`}
        aria-describedby={`${id}-isi`}
        onKeyDown={onKeyDown}
      >
        <h3 id={`${id}-judul`} className={styles.confirmTitle}>
          Mulai percakapan baru?
        </h3>
        <p id={`${id}-isi`} className={styles.confirmText}>
          Percakapan ini akan dihapus dan tidak dapat dibuka lagi.
          {sibuk && " Jawaban yang sedang disusun juga dihentikan."}
        </p>
        <div className={styles.confirmActions}>
          <button ref={batalRef} type="button" className={styles.confirmCancel} onClick={onBatal}>
            Batal
          </button>
          <button type="button" className={styles.confirmOk} onClick={onSetuju}>
            Mulai baru
          </button>
        </div>
      </div>
    </div>
  )
}
