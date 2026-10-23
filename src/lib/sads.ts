import { PANJANG_NIM } from "@/lib/nim"

/**
 * Data login SADS di `localStorage`, satu-satunya sumber NIM asisten: panelnya
 * tidak punya isian NIM, jadi tanpa login SADS asisten tidak dapat dipakai.
 *
 * SADS (sads.instiki.ac.id) menulis kunci `kojindeta` setelah Sign In berhasil,
 * dan halaman login-nya menjalankan `localStorage.clear()` setiap kali dibuka --
 * itulah cara SADS keluar. Isinya banyak (peran, menu, HTML sidebar), tetapi
 * yang dibaca asisten hanya `id1`, yaitu NIM. `nama` dan `jur` tidak dipakai:
 * API tidak menyimpan identitas mahasiswa selain NIM (PRD §11).
 *
 * Dibaca di dua tempat yang harus sejalan:
 * - widget portal (`chat-widget.tsx`), satu asal dengan tiruan login portal
 *   (`/masuk`, `components/login/login-form.tsx`);
 * - `public/embed.js` di halaman SADS, yang meneruskan NIM-nya ke iframe
 *   `/embed`. Iframe itu beda asal, jadi tidak bisa membacanya sendiri.
 */
export const KUNCI_LOGIN_SADS = "kojindeta"

/**
 * Dikirim ke `window` setiap kali portal menulis atau menghapus `kojindeta`.
 * Peristiwa `storage` hanya sampai ke tab lain, bukan tab yang mengubahnya.
 */
export const PERISTIWA_LOGIN_SADS = "sads:login"

/** Bagian `kojindeta` yang ditiru portal. SADS sungguhan menyimpan jauh lebih banyak. */
export type LoginSads = {
  /** NIM, untuk akun mahasiswa. */
  id1: string
  nama: string
  jur: string
}

/** NIM mahasiswa yang sedang masuk SADS di asal halaman ini, atau null. */
export function nimLoginSads(): string | null {
  try {
    return nimDariLoginSads(localStorage.getItem(KUNCI_LOGIN_SADS))
  } catch {
    // localStorage diblokir: dianggap belum masuk.
    return null
  }
}

/** NIM dari isi `kojindeta`; aturannya di `bacaLoginSads`. */
export function nimDariLoginSads(nilai: string | null): string | null {
  return bacaLoginSads(nilai)?.id1 ?? null
}

/**
 * Isi `kojindeta`, atau null bila belum masuk, datanya rusak, atau akunnya
 * bukan mahasiswa. Aturan NIM-nya harus sama dengan `nimSads` di
 * `public/embed.js`.
 */
export function bacaLoginSads(nilai: string | null): LoginSads | null {
  if (!nilai) return null
  let data: unknown
  try {
    data = JSON.parse(nilai)
  } catch {
    return null
  }
  if (!data || typeof data !== "object") return null
  const { id1, nama, jur, role } = data as Record<string, unknown>
  // Dosen dan staf juga masuk SADS, dan `id1` mereka bukan NIM. Peran 1 =
  // Mahasiswa. Tiruan portal tidak menulis `role`, jadi yang kosong diterima.
  if (role !== undefined && Number(role) !== 1) return null
  const nim = bentukNim(id1)
  if (nim === null) return null
  return {
    id1: nim,
    nama: typeof nama === "string" ? nama : "",
    jur: typeof jur === "string" ? jur : "",
  }
}

/**
 * NIM dari luar panel (data login SADS, pesan `embed.js`): tepat 10 angka,
 * selain itu null. Sah-tidaknya prodi dan angkatan tetap diperiksa `uraiNim`.
 */
export function bentukNim(nilai: unknown): string | null {
  const nim =
    typeof nilai === "string" ? nilai.trim() : typeof nilai === "number" ? String(nilai) : ""
  return /^\d+$/.test(nim) && nim.length === PANJANG_NIM ? nim : null
}

/** Sign In tiruan portal; SADS sungguhan menulis kuncinya sendiri. */
export function tulisLoginSads(data: LoginSads) {
  try {
    localStorage.setItem(KUNCI_LOGIN_SADS, JSON.stringify(data))
  } catch {
    // localStorage diblokir: portal tetap di halaman login.
  }
  window.dispatchEvent(new Event(PERISTIWA_LOGIN_SADS))
}

/**
 * Keluar dari tiruan login. SADS sendiri mengosongkan seluruh localStorage;
 * portal hanya menghapus kunci login, karena sesi chat (`lib/session.ts`)
 * disimpan di asal yang sama.
 */
export function keluarSads() {
  try {
    localStorage.removeItem(KUNCI_LOGIN_SADS)
  } catch {
    // localStorage diblokir: memang tidak ada yang tersimpan.
  }
  window.dispatchEvent(new Event(PERISTIWA_LOGIN_SADS))
}
