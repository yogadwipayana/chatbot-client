import { createHash, createHmac, timingSafeEqual } from "node:crypto"

/**
 * Gerbang password portal: Sign In di `/masuk` meminta `CLIENT_PASSWORD`, satu
 * password yang sama untuk semua NIM. Tanpanya siapa pun bisa masuk hanya
 * dengan NIM.
 *
 * HANYA untuk server (`src/proxy.ts`, `src/app/masuk/actions.ts`): modul ini
 * membaca password dari `process.env`, jadi jangan diimpor komponen klien.
 *
 * Sign In yang berhasil menerima cookie httpOnly `portal_akses` berisi
 * `<kedaluwarsa>.<HMAC-SHA256(CLIENT_PASSWORD, kedaluwarsa)>`. Proxy memeriksanya
 * di setiap halaman portal; mengganti password membatalkan semua cookie lama.
 * NIM tidak ada di dalamnya: NIM tetap dibaca dari `kojindeta` (`lib/sads.ts`).
 */
export const COOKIE_AKSES = "portal_akses"

/** Lama satu Sign In berlaku, dalam detik. */
export const MASA_AKSES_DETIK = 12 * 60 * 60

/** `CLIENT_PASSWORD`, dibaca saat berjalan; null bila kosong = tidak ada yang bisa masuk. */
export function passwordPortal(): string | null {
  return process.env.CLIENT_PASSWORD || null
}

/** Waktu pembandingannya tidak bergantung pada isi, panjang, atau awalan masukan. */
export function passwordCocok(masukan: string, password: string): boolean {
  return timingSafeEqual(ringkas(masukan), ringkas(password))
}

export function buatTokenAkses(password: string, sekarangMs: number = Date.now()): string {
  const kedaluwarsa = Math.floor(sekarangMs / 1000) + MASA_AKSES_DETIK
  return `${kedaluwarsa}.${tanda(password, kedaluwarsa)}`
}

export function tokenAksesSah(
  token: string | undefined,
  password: string,
  sekarangMs: number = Date.now()
): boolean {
  if (!token) return false
  // 32 bita HMAC dalam base64url = 43 karakter.
  const bagian = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token)
  if (!bagian) return false
  const kedaluwarsa = Number(bagian[1])
  if (kedaluwarsa <= Math.floor(sekarangMs / 1000)) return false
  const harapan = Buffer.from(tanda(password, kedaluwarsa))
  const diberikan = Buffer.from(bagian[2])
  return harapan.length === diberikan.length && timingSafeEqual(harapan, diberikan)
}

function tanda(password: string, kedaluwarsa: number): string {
  return createHmac("sha256", password).update(`portal-akses:${kedaluwarsa}`).digest("base64url")
}

function ringkas(nilai: string): Buffer {
  return createHash("sha256").update(nilai).digest()
}
