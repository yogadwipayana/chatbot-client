"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { FaLock, FaUser } from "react-icons/fa"

import { keluarPortal, masukPortal } from "@/app/masuk/actions"
import { PANJANG_NIM } from "@/lib/nim"
import { student } from "@/lib/portal-data"
import { keluarSads, tulisLoginSads } from "@/lib/sads"

import styles from "./login-form.module.css"

type Galat = { pesan: string; isian?: "nim" | "password" }

/**
 * Tiruan halaman Sign In SADS (AdminLTE `login-page`).
 *
 * NIM wajib 10 angka dan password wajib sama dengan `CLIENT_PASSWORD` --
 * diperiksa di server (`app/masuk/actions.ts`), yang lalu memasang cookie akses
 * untuk `src/proxy.ts`. NIM-nya sendiri tidak diperiksa ke mana pun. Berhasil =
 * `kojindeta` ditulis seperti SADS (`lib/sads.ts`), jadi widget asisten mengisi
 * NIM dari situ. Selain NIM, isinya (`nama`, `jur`) tetap mahasiswa contoh di
 * `lib/portal-data.ts`.
 */
export function LoginForm() {
  const router = useRouter()
  const [nim, setNim] = useState("")
  const [password, setPassword] = useState("")
  const [galat, setGalat] = useState<Galat | null>(null)
  const [memproses, mulai] = useTransition()

  // Membuka halaman login = keluar, seperti `localStorage.clear()` di SADS.
  // Cookie akses ikut dihapus: setelah Sign out, `/` harus meminta password lagi.
  useEffect(() => {
    keluarSads()
    keluarPortal().catch(() => {
      // Gagal menghubungi server: cookie habis sendiri setelah `MASA_AKSES_DETIK`.
    })
  }, [])

  function masuk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (memproses) return
    if (nim.length !== PANJANG_NIM) {
      setGalat({ pesan: `NIM terdiri dari ${PANJANG_NIM} angka.`, isian: "nim" })
      return
    }
    if (password === "") {
      setGalat({ pesan: "Password wajib diisi.", isian: "password" })
      return
    }
    mulai(async () => {
      const hasil = await masukPortal(nim, password).catch(() => null)
      if (!hasil) {
        setGalat({ pesan: "Sign In gagal. Coba lagi beberapa saat lagi." })
        return
      }
      if (!hasil.ok) {
        setGalat({ pesan: hasil.galat, isian: hasil.isian })
        return
      }
      tulisLoginSads({ id1: nim, nama: student.nama, jur: student.jurusan })
      router.replace("/")
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.box}>
        <div className={styles.logo}>
          <b>SADS</b>
          <h1 className={styles.subtitle}>Sistem Akademik INSTIKI</h1>
        </div>

        <div className={styles.body}>
          <p className={styles.message}>Sign in to start your session</p>
          <form onSubmit={masuk} noValidate aria-busy={memproses}>
            <div className={styles.group}>
              <label htmlFor="nim" className="sr-only">
                NIM
              </label>
              <input
                id="nim"
                className={styles.input}
                value={nim}
                onChange={(event) => {
                  setNim(event.target.value.replace(/\D/g, "").slice(0, PANJANG_NIM))
                  setGalat(null)
                }}
                placeholder="NIM"
                inputMode="numeric"
                autoComplete="username"
                autoFocus
                required
                aria-invalid={galat?.isian === "nim"}
                aria-describedby={galat ? "masuk-galat" : undefined}
              />
              <FaUser className={styles.icon} aria-hidden />
            </div>
            <div className={styles.group}>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setGalat(null)
                }}
                placeholder="Password"
                autoComplete="current-password"
                required
                aria-invalid={galat?.isian === "password"}
                aria-describedby={galat ? "masuk-galat" : undefined}
              />
              <FaLock className={styles.icon} aria-hidden />
            </div>
            {galat && (
              <p id="masuk-galat" className={styles.error} role="alert">
                {galat.pesan}
              </p>
            )}
            <div className={styles.actions}>
              <button type="submit" className={styles.button} disabled={memproses}>
                Sign In
              </button>
            </div>
          </form>
          <p className={styles.hint}>
            Portal contoh: isi NIM 10 angka dan password portal dari pengelola.
          </p>
        </div>
      </div>
    </main>
  )
}
