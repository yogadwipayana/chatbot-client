import type { Metadata } from "next"
import { Source_Sans_3 } from "next/font/google"

import "./globals.css"

// Pengganti terdekat "Source Sans Pro", huruf bawaan tema AdminLTE yang dipakai SADS.
const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "SADS",
    template: "%s · SADS",
  },
  description: "Portal akademik mahasiswa dengan asisten administrasi berbasis dokumen resmi.",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={sourceSans.variable}>
      <body>{children}</body>
    </html>
  )
}
