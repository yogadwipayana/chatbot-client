"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaLock, FaUser } from "react-icons/fa"

import { PANJANG_NIM } from "@/lib/nim"
import { student } from "@/lib/portal-data"
import { keluarSads, tulisLoginSads } from "@/lib/sads"

import styles from "./login-form.module.css"

/**
 * Tiruan halaman Sign In SADS (AdminLTE `login-page`).
 *
 * Tidak memeriksa apa pun ke server: NIM wajib 10 angka, password boleh kosong
 * dan diabaikan. Berhasil = `kojindeta` ditulis seperti SADS (`lib/sads.ts`),
 * jadi widget asisten mengisi NIM dari situ. Selain NIM, isinya (`nama`, `jur`)
 * tetap mahasiswa contoh di `lib/portal-data.ts`.
 */
export function LoginForm() {
  const router = useRouter()
  const [nim, setNim] = useState("")
  const [galat, setGalat] = useState<string | null>(null)

  // Membuka halaman login = keluar, seperti `localStorage.clear()` di SADS.
  useEffect(() => {
    keluarSads()
  }, [])

  function masuk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (nim.length !== PANJANG_NIM) {
      setGalat(`NIM terdiri dari ${PANJANG_NIM} angka.`)
      return
    }
    tulisLoginSads({ id1: nim, nama: student.nama, jur: student.jurusan })
    router.replace("/")
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
          <form onSubmit={masuk} noValidate>
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
                aria-invalid={galat !== null}
                aria-describedby={galat ? "nim-galat" : undefined}
              />
              <FaUser className={styles.icon} aria-hidden />
            </div>
            <div className={styles.group}>
              <label htmlFor="password" className="sr-only">
                Password (boleh kosong)
              </label>
              {/* Tidak dikendalikan dan tidak dibaca: portal ini tidak memeriksa password. */}
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Password"
                autoComplete="current-password"
              />
              <FaLock className={styles.icon} aria-hidden />
            </div>
            {galat && (
              <p id="nim-galat" className={styles.error} role="alert">
                {galat}
              </p>
            )}
            <div className={styles.actions}>
              <button type="submit" className={styles.button}>
                Sign In
              </button>
            </div>
          </form>
          <p className={styles.hint}>
            Portal contoh: cukup isi NIM, password boleh dikosongkan.
          </p>
        </div>
      </div>
    </main>
  )
}
