"use server"

import { cookies, headers } from "next/headers"

import {
  buatTokenAkses,
  COOKIE_AKSES,
  MASA_AKSES_DETIK,
  passwordCocok,
  passwordPortal,
} from "@/lib/akses-portal"
import { PANJANG_NIM } from "@/lib/nim"
import { bentukNim } from "@/lib/sads"

export type HasilMasuk =
  | { ok: true }
  | { ok: false; galat: string; isian?: "nim" | "password" }

/** Jeda setelah password salah, supaya menebak berurutan lambat. */
const JEDA_GAGAL_MS = 1000

/**
 * Sign In portal: memeriksa `CLIENT_PASSWORD` di server (`lib/akses-portal.ts`)
 * lalu memasang cookie akses yang diperiksa `src/proxy.ts`. `kojindeta` tetap
 * ditulis peramban setelah ini berhasil (`components/login/login-form.tsx`).
 *
 * Argumennya datang dari peramban, jadi bentuknya diperiksa ulang di sini.
 */
export async function masukPortal(nim: unknown, password: unknown): Promise<HasilMasuk> {
  const passwordBenar = passwordPortal()
  if (passwordBenar === null) {
    console.error("CLIENT_PASSWORD kosong: Sign In portal ditolak untuk semua NIM.")
    return { ok: false, galat: "Sign In belum dapat dipakai: password portal belum diatur." }
  }
  if (bentukNim(nim) === null) {
    return { ok: false, galat: `NIM terdiri dari ${PANJANG_NIM} angka.`, isian: "nim" }
  }
  if (typeof password !== "string" || !passwordCocok(password, passwordBenar)) {
    await new Promise((selesai) => setTimeout(selesai, JEDA_GAGAL_MS))
    return { ok: false, galat: "Password salah.", isian: "password" }
  }

  // `Secure` hanya bila portal dibuka lewat HTTPS: akses LAN `http://` dan
  // `next dev` tetap bisa Sign In. Server Action selalu membawa `Origin`.
  const asal = (await headers()).get("origin") ?? ""
  ;(await cookies()).set(COOKIE_AKSES, buatTokenAkses(passwordBenar), {
    httpOnly: true,
    sameSite: "lax",
    secure: asal.startsWith("https://"),
    path: "/",
    maxAge: MASA_AKSES_DETIK,
  })
  return { ok: true }
}

/** Keluar: cookie akses dihapus bersama `kojindeta` saat `/masuk` dibuka. */
export async function keluarPortal(): Promise<void> {
  ;(await cookies()).delete(COOKIE_AKSES)
}
