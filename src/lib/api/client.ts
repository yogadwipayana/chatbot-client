import type { components } from "./schema"

/**
 * Tipe dibangkitkan dari `api/api.yaml` (`npm run gen:api`). Kontrak itu satu-
 * satunya sumber kebenaran bentuk data antara backend dan portal: ubah YAML-nya,
 * bangkitkan ulang, dan TypeScript menunjukkan setiap tempat yang ikut terdampak.
 */
export type Schemas = components["schemas"]

/**
 * Kosongkan (`NEXT_PUBLIC_API_BASE_URL=`) bila portal dan API disajikan dari
 * domain yang sama di balik Caddy.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/+$/, "")

export const GAGAL_TERHUBUNG =
  "Tidak dapat terhubung ke server. Periksa koneksi internet atau coba lagi sebentar lagi."

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

/**
 * Kalimat galat siap tampil. Untuk 429 dan 503 (kill switch) backend sudah menulis
 * `detail` yang memuat jalan keluar, jadi ditampilkan apa adanya.
 */
export function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null | undefined)?.detail
  if (typeof detail === "string" && detail) return detail
  if (status === 422) return "Pertanyaan tidak dapat diproses. Periksa kembali isinya lalu kirim ulang."
  if (status >= 500) return "Terjadi gangguan di server. Coba lagi beberapa saat lagi."
  return `Permintaan gagal (kode ${status}).`
}
