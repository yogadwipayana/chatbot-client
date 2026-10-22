"use client"

import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react"

import {
  bacaLoginSads,
  KUNCI_LOGIN_SADS,
  PERISTIWA_LOGIN_SADS,
  type LoginSads,
} from "@/lib/sads"

const KonteksLogin = createContext<LoginSads | null>(null)

/**
 * Halaman portal hanya untuk yang sudah Sign In, seperti SADS: tanpa
 * `kojindeta` di localStorage, pengunjung dialihkan ke `/masuk`.
 *
 * Datanya hanya ada di peramban, jadi server merender halaman kosong dan isinya
 * baru muncul setelah localStorage terbaca. Keluar di tab lain (`/masuk`
 * dibuka) ikut mengalihkan tab ini.
 */
export function GerbangLoginSads({ children }: { children: React.ReactNode }) {
  const mentah = useSyncExternalStore<string | null | undefined>(
    berlangganan,
    bacaMentah,
    belumDiketahui
  )
  const login = useMemo(() => (mentah === undefined ? undefined : bacaLoginSads(mentah)), [mentah])
  const router = useRouter()

  useEffect(() => {
    if (login === null) router.replace("/masuk")
  }, [login, router])

  if (!login) return null
  return <KonteksLogin value={login}>{children}</KonteksLogin>
}

/** Data login yang sedang berlaku; hanya di dalam `GerbangLoginSads`. */
export function useLoginSads(): LoginSads {
  const login = useContext(KonteksLogin)
  if (!login) throw new Error("useLoginSads dipakai di luar GerbangLoginSads")
  return login
}

/** NIM yang sedang masuk, untuk komponen server seperti ringkasan dashboard. */
export function NimLogin() {
  return useLoginSads().id1
}

function berlangganan(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    // `key` null = `localStorage.clear()`.
    if (event.key === null || event.key === KUNCI_LOGIN_SADS) onChange()
  }
  window.addEventListener("storage", onStorage)
  window.addEventListener(PERISTIWA_LOGIN_SADS, onChange)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(PERISTIWA_LOGIN_SADS, onChange)
  }
}

/** String mentah, bukan hasil urai: snapshot harus sama selama isinya sama. */
function bacaMentah(): string | null {
  try {
    return localStorage.getItem(KUNCI_LOGIN_SADS)
  } catch {
    return null
  }
}

/** Di server (dan saat hidrasi) localStorage belum dapat dibaca. */
function belumDiketahui(): string | null | undefined {
  return undefined
}
