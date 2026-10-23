"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes } from "react-icons/fa"

import styles from "./chat.module.css"

/** Nama sorotan di `CSS.highlights`; gayanya `::highlight(...)` di chat.module.css. */
const SOROT = "asisten-cari"
const SOROT_AKTIF = "asisten-cari-aktif"

/**
 * "Cari percakapan" dari menu panel, seperti widget Glide (docs/glide.md,
 * gambar 26): kata yang dicari disorot di gelembung pesan, temuan yang sedang
 * dilihat diberi warna lain, dan jumlahnya ditulis "1/3".
 *
 * Urutannya dari pesan terbaru di dasar: "1" adalah temuan paling bawah, dan
 * tombol panah atas mundur ke pesan yang lebih lama.
 *
 * Sorotan memakai CSS Custom Highlight API, bukan `<mark>`: gelembung pesan
 * dirender React dan tidak boleh diubah dari luar. Peramban tanpa API itu
 * tetap mendapat jumlah temuan dan guliran ke temuannya, hanya tanpa warna.
 */
export function CariPercakapan({
  id,
  listRef,
  isi,
  onClose,
}: {
  id: string
  /** Daftar pesan yang dicari dan digulir. */
  listRef: RefObject<HTMLDivElement | null>
  /** Berubah setiap kali isi percakapan berubah; pencarian diulang. */
  isi: unknown
  onClose: () => void
}) {
  const [kueri, setKueri] = useState("")
  // Temuan yang sedang dilihat; 0 = paling bawah (terbaru).
  const [indeks, setIndeks] = useState(0)
  const [jumlah, setJumlah] = useState(0)
  const temuan = useRef<Range[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cari ulang setiap kali kuerinya berubah, dan saat jawaban baru tiba.
  useEffect(() => {
    const list = listRef.current
    const hasil = list ? cariRentang(list, kueri.trim()) : []
    temuan.current = hasil
    setJumlah(hasil.length)
    setIndeks((lama) => Math.min(lama, Math.max(hasil.length - 1, 0)))
    if (dukungSorotan()) CSS.highlights.set(SOROT, new Highlight(...hasil))
    return () => {
      if (dukungSorotan()) CSS.highlights.delete(SOROT)
    }
  }, [kueri, isi, listRef])

  useEffect(() => {
    const range = temuan.current[indeks]
    if (!range || !dukungSorotan()) return
    const sorot = new Highlight(range)
    // Di atas sorotan biasa, yang juga memuat rentang ini.
    sorot.priority = 1
    CSS.highlights.set(SOROT_AKTIF, sorot)
    return () => {
      CSS.highlights.delete(SOROT_AKTIF)
    }
  }, [indeks, jumlah, kueri, isi])

  // Guliran hanya mengikuti pilihan mahasiswa, bukan setiap potongan jawaban
  // yang tiba: selagi jawaban mengalir panel tetap menggulir ke dasar.
  useEffect(() => {
    const list = listRef.current
    const range = temuan.current[indeks]
    if (list && range) gulirKe(list, range)
  }, [indeks, kueri, listRef])

  function pindah(langkah: 1 | -1) {
    if (jumlah === 0) return
    setIndeks((lama) => (lama + langkah + jumlah) % jumlah)
  }

  return (
    <div className={styles.search} role="search">
      <div className={styles.searchBox}>
        <FaSearch aria-hidden className={styles.searchIcon} />
        <label htmlFor={id} className="sr-only">
          Cari di percakapan
        </label>
        <input
          ref={inputRef}
          id={id}
          className={styles.searchInput}
          type="text"
          value={kueri}
          onChange={(event) => {
            setKueri(event.target.value)
            setIndeks(0)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              pindah(event.shiftKey ? -1 : 1)
            } else if (event.key === "Escape") {
              // Escape di sini menutup pencarian saja, bukan seluruh panel.
              event.preventDefault()
              event.stopPropagation()
              onClose()
            }
          }}
          placeholder="Cari di percakapan"
          autoComplete="off"
          aria-describedby={`${id}-jumlah`}
        />
        <span id={`${id}-jumlah`} className={styles.searchCount} aria-live="polite">
          {kueri.trim() === "" ? null : jumlah === 0 ? (
            <>
              0/0<span className="sr-only"> tidak ditemukan</span>
            </>
          ) : (
            <>
              {indeks + 1}/{jumlah}
              <span className="sr-only"> temuan</span>
            </>
          )}
        </span>
      </div>
      <button
        type="button"
        className={styles.searchButton}
        onClick={() => pindah(1)}
        disabled={jumlah < 2}
        aria-label="Temuan sebelumnya (lebih lama)"
      >
        <FaChevronUp aria-hidden />
      </button>
      <button
        type="button"
        className={styles.searchButton}
        onClick={() => pindah(-1)}
        disabled={jumlah < 2}
        aria-label="Temuan berikutnya (lebih baru)"
      >
        <FaChevronDown aria-hidden />
      </button>
      <button
        type="button"
        className={styles.searchButton}
        onClick={onClose}
        aria-label="Tutup pencarian"
      >
        <FaTimes aria-hidden />
      </button>
    </div>
  )
}

function dukungSorotan(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS
}

/**
 * Setiap kemunculan `kueri` di gelembung pesan, terbaru dulu. Hanya teks yang
 * terlihat: tulisan khusus pembaca layar (`.sr-only`) dilewati. Kata yang
 * terbelah dua elemen -- sebagian tebal, sebagian tidak -- tidak ditemukan.
 */
function cariRentang(akar: HTMLElement, kueri: string): Range[] {
  if (!kueri) return []
  // Bendera "i" pada teks aslinya, bukan `toLowerCase()`: huruf seperti "İ"
  // berubah panjang saat dikecilkan dan menggeser posisi temuannya.
  const pola = new RegExp(kueri.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu")
  const hasil: Range[] = []
  for (const gelembung of akar.querySelectorAll(`.${styles.text}`)) {
    const walker = document.createTreeWalker(gelembung, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.parentElement?.closest(".sr-only") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    })
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const cocok of (node.textContent ?? "").matchAll(pola)) {
        const range = document.createRange()
        range.setStart(node, cocok.index)
        range.setEnd(node, cocok.index + cocok[0].length)
        hasil.push(range)
      }
    }
  }
  return hasil.reverse()
}

/** Temuan di luar layar digulir ke tengah daftar pesan. */
function gulirKe(list: HTMLElement, range: Range) {
  const kotak = range.getBoundingClientRect()
  const wadah = list.getBoundingClientRect()
  if (kotak.top >= wadah.top && kotak.bottom <= wadah.bottom) return
  list.scrollTop += kotak.top - wadah.top - (wadah.height - kotak.height) / 2
}
