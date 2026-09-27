import { NextResponse, type NextRequest } from "next/server"

import { HEADER_STATUS_SEMATAN, type StatusSematan } from "@/lib/embed"

/**
 * Siapa yang boleh membingkai portal dalam iframe (`frame-ancestors`).
 *
 * `/embed?key=emb_...` -- panel yang dipasang situs lain lewat `public/embed.js`
 * -- menanyakan kuncinya ke API setiap kali dimuat, lalu hanya boleh dibingkai
 * situs yang terdaftar untuk kunci itu. Daftarnya dikelola di halaman Sematan
 * dashboard admin, jadi perubahannya berlaku saat panel dibuka berikutnya tanpa
 * build ulang portal.
 *
 * Halaman lain, termasuk `/` yang juga membawa widget chat, hanya boleh
 * dibingkai portal sendiri. Tanpa ini situs mana pun dapat meng-iframe `/` dan
 * memakai asisten tanpa kunci sama sekali.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/embed") {
    return denganAncestors(NextResponse.next(), ["'self'"])
  }

  const { status, ancestors } = await periksaKunci(request.nextUrl.searchParams.get("key"))
  const headers = new Headers(request.headers)
  headers.set(HEADER_STATUS_SEMATAN, status)
  return denganAncestors(NextResponse.next({ request: { headers } }), ancestors)
}

export const config = {
  // Berkas statis (`/embed.js`, `/logo.svg`, `/_next/...`) tidak butuh header ini.
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
}

type HasilPemeriksaan = { status: StatusSematan; ancestors: string[] }

/** Satu asal sah dari API, persis bentuk yang dibuat `normalisasi_asal` di sana. */
const ASAL = /^https?:\/\/(\*\.)?[a-z0-9.-]+(:\d{1,5})?$/

async function periksaKunci(kunci: string | null): Promise<HasilPemeriksaan> {
  // Tautan biasa ke halaman chat penuh: boleh dibuka, tidak boleh dibingkai.
  if (!kunci) return { status: "tanpa-kunci", ancestors: ["'self'"] }

  // Kunci yang tidak berlaku atau API yang mati: halaman hanya berisi pesan
  // "tidak tersedia", tanpa chat. Aman dibingkai siapa pun, dan pemilik situs
  // melihat pesan itu -- bukan panel kosong yang ditolak peramban tanpa sebab.
  const bolehSiapaPun = ["*"]
  let response: Response
  try {
    response = await fetch(`${apiInternal()}/api/embed/keys/${encodeURIComponent(kunci)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    return { status: "gagal", ancestors: bolehSiapaPun }
  }
  if (response.status === 404) return { status: "tidak-berlaku", ancestors: bolehSiapaPun }
  if (!response.ok) return { status: "gagal", ancestors: bolehSiapaPun }

  const data = (await response.json().catch(() => null)) as { allowed_origins?: unknown } | null
  if (!data || !Array.isArray(data.allowed_origins)) {
    return { status: "gagal", ancestors: bolehSiapaPun }
  }
  // Nilainya ditulis ke header; yang bentuknya aneh dibuang, bukan diteruskan.
  const asal = data.allowed_origins.filter((a): a is string => typeof a === "string" && ASAL.test(a))
  // Daftar kosong di API = situs mana pun. Daftar yang isinya terbuang semua
  // tetap dibatasi portal sendiri: salah ketik tidak boleh membuka ke semua situs.
  if (data.allowed_origins.length === 0) return { status: "berlaku", ancestors: ["*"] }
  return { status: "berlaku", ancestors: ["'self'", ...asal] }
}

function denganAncestors(response: NextResponse, ancestors: string[]): NextResponse {
  response.headers.set("Content-Security-Policy", `frame-ancestors ${ancestors.join(" ")}`)
  return response
}

/**
 * Alamat API dari sisi SERVER portal, dibaca saat berjalan -- bukan
 * `NEXT_PUBLIC_API_BASE_URL`, yang adalah alamat dari sisi peramban dan bisa
 * kosong (satu domain di balik Caddy) atau tidak terjangkau dari dalam kontainer.
 */
function apiInternal(): string {
  const publik = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  const alamat =
    process.env.API_INTERNAL_URL || (/^https?:\/\//.test(publik) ? publik : "http://localhost:8000")
  return alamat.replace(/\/+$/, "")
}
