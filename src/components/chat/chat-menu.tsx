"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import { FaCompressAlt, FaEllipsisH, FaExpandAlt, FaRegEdit, FaSearch } from "react-icons/fa"

import { cx } from "@/lib/utils"

import styles from "./chat.module.css"

/**
 * Tombol ⋯ di kepala panel, di samping ✕, seperti widget Glide (docs/glide.md,
 * gambar 18): perluas jendela, cari percakapan, percakapan baru (di Glide:
 * unduh transkrip).
 *
 * Pola menu tombol WAI-ARIA: panah atas/bawah berpindah pilihan, Escape
 * menutup menu dan mengembalikan fokus ke tombol ⋯ -- tanpa ikut menutup panel.
 */
export function MenuPanel({
  id,
  tombolRef,
  luas,
  bisaDiperluas,
  onPerluas,
  onCari,
  onBaru,
  baruNonaktif,
}: {
  id: string
  /** Tombol ⋯, supaya panel bisa mengembalikan fokus ke sana. */
  tombolRef: RefObject<HTMLButtonElement | null>
  luas: boolean
  /** false di layar sempit dan di `/embed` halaman penuh: panelnya sudah selebar mungkin. */
  bisaDiperluas: boolean
  onPerluas: () => void
  onCari: () => void
  onBaru: () => void
  /** Belum ada percakapan selain sapaan: tidak ada yang perlu dikosongkan. */
  baruNonaktif: boolean
}) {
  const [terbuka, setTerbuka] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!terbuka) return
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]:enabled")?.focus()
    // Klik di mana pun di luar menu dan tombolnya menutup menu.
    function klikDiLuar(event: PointerEvent) {
      const sasaran = event.target as Node
      if (menuRef.current?.contains(sasaran) || tombolRef.current?.contains(sasaran)) return
      setTerbuka(false)
    }
    document.addEventListener("pointerdown", klikDiLuar)
    return () => document.removeEventListener("pointerdown", klikDiLuar)
  }, [terbuka, tombolRef])

  function pilih(aksi: () => void) {
    setTerbuka(false)
    // Pilihannya hilang bersama menunya: fokus kembali ke ⋯, kecuali aksinya
    // sendiri memindahkannya (kotak pencarian).
    tombolRef.current?.focus()
    aksi()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const pilihan = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:enabled") ?? []),
    ]
    const sekarang = pilihan.indexOf(document.activeElement as HTMLButtonElement)
    const fokus = (indeks: number) => {
      event.preventDefault()
      pilihan[(indeks + pilihan.length) % pilihan.length]?.focus()
    }
    if (event.key === "ArrowDown") fokus(sekarang + 1)
    else if (event.key === "ArrowUp") fokus(sekarang - 1)
    else if (event.key === "Home") fokus(0)
    else if (event.key === "End") fokus(pilihan.length - 1)
    else if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      setTerbuka(false)
      tombolRef.current?.focus()
    } else if (event.key === "Tab") setTerbuka(false)
  }

  return (
    <div className={styles.menuWrap}>
      <button
        ref={tombolRef}
        type="button"
        className={cx(styles.tool, terbuka && styles.toolActive)}
        onClick={() => setTerbuka((lama) => !lama)}
        aria-label="Pilihan lain"
        aria-haspopup="menu"
        aria-expanded={terbuka}
        aria-controls={terbuka ? id : undefined}
      >
        <FaEllipsisH aria-hidden />
      </button>
      {terbuka && (
        <div
          ref={menuRef}
          id={id}
          className={styles.menu}
          role="menu"
          aria-label="Pilihan lain"
          onKeyDown={onKeyDown}
        >
          {bisaDiperluas && (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              onClick={() => pilih(onPerluas)}
            >
              {luas ? <FaCompressAlt aria-hidden /> : <FaExpandAlt aria-hidden />}
              {luas ? "Ciutkan jendela" : "Perluas jendela"}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => pilih(onCari)}
          >
            <FaSearch aria-hidden />
            Cari percakapan
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => pilih(onBaru)}
            disabled={baruNonaktif}
          >
            <FaRegEdit aria-hidden />
            Percakapan baru
          </button>
        </div>
      )}
    </div>
  )
}
