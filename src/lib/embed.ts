/**
 * Hasil pemeriksaan kunci sematan oleh `src/proxy.ts`, dibawa ke halaman
 * `/embed` sebagai header permintaan. Proxy selalu menimpanya, jadi nilai yang
 * dikirim peramban sendiri tidak pernah sampai ke halaman.
 */
export const HEADER_STATUS_SEMATAN = "x-asisten-sematan"

export type StatusSematan =
  /** Kunci aktif; panel boleh dimuat di situs yang terdaftar untuk kunci itu. */
  | "berlaku"
  /** Tanpa `?key=`: dibuka sebagai halaman penuh lewat tautan biasa. */
  | "tanpa-kunci"
  /** Kunci tidak dikenal atau sudah dinonaktifkan dari dashboard. */
  | "tidak-berlaku"
  /** API tidak dapat ditanya; kunci tidak dapat dipastikan. */
  | "gagal"

export function isStatusSematan(value: string | null): value is StatusSematan {
  return (
    value === "berlaku" || value === "tanpa-kunci" || value === "tidak-berlaku" || value === "gagal"
  )
}
