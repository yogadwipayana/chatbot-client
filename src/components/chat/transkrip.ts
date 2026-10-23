import type { Citation } from "@/lib/api/chat"

import { tanpaPenanda } from "./markdown"
import type { ChatEntry } from "./use-chat"

/**
 * "Unduh transkrip" di menu panel (seperti widget Glide, docs/glide.md):
 * percakapan yang sedang tampil sebagai teks biasa, beserta sumber, lampiran,
 * dan kontak unitnya.
 *
 * Hanya yang terlihat di panel. NIM tidak ditulis meskipun ikut setiap
 * pertanyaan: berkasnya mudah tertinggal di folder Unduhan komputer lab.
 */
export function susunTranskrip({
  entries,
  sapaan,
  balasanTopik,
  eskalasi,
  waktu,
}: {
  entries: ChatEntry[]
  /** Teks gelembung sapaan, persis seperti yang tampil. */
  sapaan: string
  /** Balasan setelah topik dipilih (`topicReply`). */
  balasanTopik: (unit: string) => string
  /** Jawaban yang menampilkan kotak kontak (`bannerEskalasiTerakhir`). */
  eskalasi: Set<number>
  waktu: Date
}): string {
  const bagian = [
    `Transkrip Asisten Administrasi INSTIKI\nDiunduh: ${formatWaktu(waktu)}`,
    pesan("Asisten", sapaan),
  ]

  for (const entry of entries) {
    if (entry.role === "user") {
      bagian.push(pesan(entry.unit ? `Anda (ke ${entry.unit})` : "Anda", entry.text))
    } else if (entry.role === "topic") {
      bagian.push(pesan("Anda", entry.unit), pesan("Asisten", balasanTopik(entry.unit)))
    } else if (entry.state === "pending") {
      bagian.push(pesan("Asisten", "(Jawaban belum selesai.)"))
    } else if (entry.state === "streaming") {
      bagian.push(pesan("Asisten", `${tanpaPenanda(entry.text)}\n(Jawaban belum selesai.)`))
    } else if (entry.state === "error") {
      bagian.push(pesan("Asisten", entry.message))
    } else if (entry.state === "cancelled") {
      bagian.push(pesan("Asisten", "Jawaban dihentikan."))
    } else {
      const { response, complete } = entry.reply
      const baris = []
      if (response.kind === "refusal") baris.push("[Tidak ditemukan di dokumen resmi]")
      if (response.kind === "support") baris.push("[Ada yang siap membantu]")
      baris.push(tanpaPenanda(response.text))
      if (!complete) baris.push("(Koneksi terputus sebelum jawaban selesai.)")
      // Sama dengan panel: lampiran dan sumber hanya untuk jawaban yang utuh.
      if (complete) {
        for (const lampiran of response.attachments) {
          baris.push(
            "",
            `${lampiran.title} (${lampiran.source}):`,
            ...lampiran.items.map((item, index) => `${index + 1}. ${item}`)
          )
        }
        if (response.citations.length > 0) {
          baris.push("", "Sumber:", ...daftarSumber(response.citations).map((s) => `- ${s}`))
        }
      }
      if (eskalasi.has(entry.id) && response.escalated && response.contacts.length > 0) {
        baris.push(
          "",
          "Pastikan juga ke unit terkait:",
          ...response.contacts.map((kontak) =>
            [`- ${kontak.unit}: ${kontak.contact}`, kontak.service_hours]
              .filter(Boolean)
              .join(", ")
          )
        )
      }
      bagian.push(pesan("Asisten", baris.join("\n")))
    }
  }

  return `${bagian.join("\n\n")}\n`
}

/** `transkrip-asisten-2026-10-23-1345.txt`, menurut jam peramban. */
export function namaBerkasTranskrip(waktu: Date): string {
  const dua = (n: number) => String(n).padStart(2, "0")
  const tanggal = `${waktu.getFullYear()}-${dua(waktu.getMonth() + 1)}-${dua(waktu.getDate())}`
  return `transkrip-asisten-${tanggal}-${dua(waktu.getHours())}${dua(waktu.getMinutes())}.txt`
}

/** Unduh teks sebagai berkas, tanpa ke server. */
export function unduhTeks(namaBerkas: string, isi: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: "text/plain;charset=utf-8" }))
  const tautan = document.createElement("a")
  tautan.href = url
  tautan.download = namaBerkas
  document.body.append(tautan)
  tautan.click()
  tautan.remove()
  // Setelah klik, unduhan sudah memegang isinya sendiri.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function pesan(pengirim: string, isi: string): string {
  return `${pengirim}:\n${isi}`
}

/** Satu baris per dokumen, seperti kartu sumber di panel. */
function daftarSumber(citations: Citation[]): string[] {
  const kelompok = new Map<string, { title: string; type: Citation["type"]; pages: number[] }>()
  for (const citation of citations) {
    const key = citation.document_id || citation.title
    const isi = kelompok.get(key) ?? { title: citation.title, type: citation.type, pages: [] }
    if (!isi.pages.includes(citation.page)) isi.pages.push(citation.page)
    kelompok.set(key, isi)
  }
  return [...kelompok.values()].map(({ title, type, pages }) => {
    if (type === "data") return `${title} (data langsung)`
    if (type === "tanya_jawab") return `${title} (tanya jawab resmi)`
    return `${title}, hal. ${pages.sort((a, b) => a - b).join(", ")}`
  })
}

function formatWaktu(waktu: Date): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(waktu)
}
