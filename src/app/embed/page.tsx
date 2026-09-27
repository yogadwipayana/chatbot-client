import type { Metadata } from "next"
import { headers } from "next/headers"

import { EmbedUnavailable, EmbeddedChat } from "@/components/chat/embedded-chat"
import { HEADER_STATUS_SEMATAN, isStatusSematan } from "@/lib/embed"

export const metadata: Metadata = {
  title: "Asisten Administrasi",
}

/**
 * Asisten tanpa kerangka portal, untuk dimuat situs lain lewat `public/embed.js`
 * (`?mode=widget&key=emb_...`) atau dibuka langsung sebagai halaman penuh.
 *
 * Kuncinya sudah diperiksa `src/proxy.ts` sebelum halaman ini dirender; di sini
 * hanya hasilnya yang dibaca. Tanpa hasil itu -- proxy tidak berjalan -- halaman
 * menolak, bukan menganggap kuncinya sah.
 */
export default async function EmbedPage({ searchParams }: PageProps<"/embed">) {
  const [{ mode, key }, daftarHeader] = await Promise.all([searchParams, headers()])
  const nilai = daftarHeader.get(HEADER_STATUS_SEMATAN)
  const status = isStatusSematan(nilai) ? nilai : "gagal"
  const widget = mode === "widget"

  if (status === "tidak-berlaku" || status === "gagal") {
    return <EmbedUnavailable status={status} />
  }
  return (
    <EmbeddedChat
      widget={widget}
      embedKey={status === "berlaku" && typeof key === "string" ? key : undefined}
    />
  )
}
