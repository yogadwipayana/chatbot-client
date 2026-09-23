import type { Metadata } from "next"

import { EmbeddedChat } from "@/components/chat/embedded-chat"

export const metadata: Metadata = {
  title: "Asisten Administrasi",
}

/**
 * Asisten tanpa kerangka portal, untuk dimuat situs lain lewat `public/embed.js`
 * (`?mode=widget`) atau dibuka langsung sebagai halaman penuh.
 *
 * Situs yang boleh memuatnya dalam iframe diatur `EMBED_ALLOWED_ORIGINS`
 * (`next.config.ts`).
 */
export default async function EmbedPage({ searchParams }: PageProps<"/embed">) {
  const { mode } = await searchParams
  return <EmbeddedChat widget={mode === "widget"} />
}
