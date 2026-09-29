import { Fragment, useState } from "react"
import {
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFilePdf,
  FaHandHoldingHeart,
  FaRegCommentDots,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaRobot,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa"

import { citationUrl, type Citation, type Contact } from "@/lib/api/chat"
import { potongKontak } from "@/lib/kontak"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import type { ChatEntry, FeedbackControls, NoteState } from "./use-chat"

type AssistantEntry = Extract<ChatEntry, { role: "assistant" }>

/**
 * `unit` ditampilkan di samping nama: setelah mahasiswa berganti pilihan di
 * tengah percakapan, hanya label ini yang menjelaskan kenapa pertanyaan yang
 * mirip mendapat jawaban -- atau penolakan -- yang berbeda.
 */
export function UserMessage({ text, unit }: { text: string; unit: string | null }) {
  return (
    <div className={cx(styles.msg, styles.msgUser)}>
      <div className={styles.name}>
        Anda
        {unit && <span className={styles.scopeTag}> · ke {unit}</span>}
      </div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

/** Baris pesan asisten: avatar, gelembung, lalu tambahan di bawahnya. */
export function BotBubble({
  tone,
  children,
  extra,
}: {
  tone?: "pending" | "error" | "refusal" | "support"
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div className={styles.msg}>
      <div className={styles.name}>Asisten</div>
      <div className={styles.row}>
        <span className={styles.avatar} aria-hidden>
          <FaRobot />
        </span>
        <div className={styles.body}>
          <div className={cx(styles.text, tone && styles[tone])}>{children}</div>
          {extra}
        </div>
      </div>
    </div>
  )
}

export function AssistantMessage({
  entry,
  controls,
  showEscalation,
}: {
  entry: AssistantEntry
  controls: FeedbackControls
  /** false bila jawaban setelah ini sudah membawa banner kontak yang sama. */
  showEscalation: boolean
}) {
  if (entry.state === "pending") {
    return (
      <BotBubble tone="pending">
        <span className={styles.dots} aria-hidden>
          <span />
          <span />
          <span />
        </span>
        {entry.stage ? `${capitalize(entry.stage)}…` : <span className="sr-only">Menunggu balasan</span>}
      </BotBubble>
    )
  }

  // FE-1: jawaban yang sedang mengalir. Tanpa sitasi dan tanpa tombol penilaian
  // -- keduanya baru berarti setelah kalimat terakhirnya utuh, dan `message_id`
  // yang dibutuhkan penilaian memang baru tiba bersama event penutup.
  if (entry.state === "streaming") {
    return (
      <BotBubble>
        <RichText text={entry.text} />
        <span className={styles.caret} aria-hidden />
        <span className="sr-only">Jawaban sedang ditulis</span>
      </BotBubble>
    )
  }

  if (entry.state === "error") {
    return <BotBubble tone="error">{entry.message}</BotBubble>
  }

  if (entry.state === "cancelled") {
    return (
      <BotBubble tone="pending">
        Jawaban dihentikan. Kirim ulang pertanyaan bila masih diperlukan.
      </BotBubble>
    )
  }

  const { response, complete } = entry.reply
  // Sapaan tidak dinilai (bukan jawaban), begitu pula balasan dukungan --
  // meminta mahasiswa yang sedang tertekan menilai balasan tidak pantas.
  const dapatDinilai = response.kind === "answer" || response.kind === "refusal"
  const feedback = response.message_id && dapatDinilai && (
    <Feedback messageId={response.message_id} controls={controls} />
  )

  // FE-4: penolakan dan balasan dukungan tampil berbeda dari jawaban, dan tidak
  // pernah membawa sitasi. Teksnya dari server sudah memuat daftar kontak.
  if (response.kind === "refusal" || response.kind === "support") {
    const refusal = response.kind === "refusal"
    return (
      <BotBubble tone={response.kind} extra={feedback}>
        <span className={styles.label}>
          {refusal ? <FaExclamationTriangle aria-hidden /> : <FaHandHoldingHeart aria-hidden />}
          {refusal ? "Tidak ditemukan di dokumen resmi" : "Ada yang siap membantu"}
        </span>
        <RichText text={response.text} tautKontak />
      </BotBubble>
    )
  }

  return (
    <BotBubble
      extra={
        <>
          {!complete && (
            <p className={styles.notice}>
              Koneksi terputus sebelum jawaban selesai, jadi sumbernya tidak ditampilkan. Kirim
              ulang pertanyaan untuk jawaban lengkap.
            </p>
          )}
          {complete && response.citations.length > 0 && <Citations citations={response.citations} />}
          {showEscalation && response.escalated && response.contacts.length > 0 && (
            <Escalation contacts={response.contacts} />
          )}
          {complete && feedback}
        </>
      }
    >
      <RichText text={response.text} />
    </BotBubble>
  )
}

/** Tebal `**...**` atau kode sebaris `` `...` ``, mana yang lebih dulu muncul. */
const PENANDA_MARKDOWN = /(\*\*[\s\S]+?\*\*|`[^`\n]+`)/g

/**
 * Model kadang menulis penekanan Markdown: tebal (`**3 Agustus 2026**`) dan
 * kode sebaris (`` `TRANSFER NomorVA NOMINAL` `` -- format SMS, kode bank).
 * Hanya dua itu yang diterjemahkan; sisanya -- termasuk penanda sitasi
 * `[Judul, hal. 12]` -- ditampilkan apa adanya. Admin memakai salinan yang
 * sama (`RichText` di `admin/src/components/common.tsx`).
 *
 * `tautKontak`: nomor telepon dijadikan tautan. Hanya untuk teks yang disusun
 * server dari daftar kontak (penolakan, dukungan), bukan jawaban LLM.
 */
function RichText({ text, tautKontak = false }: { text: string; tautKontak?: boolean }) {
  const bagian = text.split(PENANDA_MARKDOWN)
  return (
    <>
      {bagian.map((teks, index) =>
        index % 2 === 0 ? (
          tautKontak ? (
            <TeksKontak key={index} text={teks} />
          ) : (
            teks
          )
        ) : teks.startsWith("`") ? (
          <code key={index} className={styles.code}>
            {teks.slice(1, -1)}
          </code>
        ) : (
          <strong key={index}>
            <RichText text={teks.slice(2, -2)} />
          </strong>
        )
      )}
    </>
  )
}

/** Teks kontak dengan nomor telepon/WhatsApp yang dapat diketuk (`potongKontak`). */
function TeksKontak({ text }: { text: string }) {
  return (
    <>
      {potongKontak(text).map((bagian, index) =>
        bagian.href ? (
          <a
            key={index}
            href={bagian.href}
            {...(bagian.eksternal && { target: "_blank", rel: "noopener noreferrer" })}
          >
            {bagian.teks}
          </a>
        ) : (
          <Fragment key={index}>{bagian.teks}</Fragment>
        )
      )}
    </>
  )
}

/**
 * FE-2: verifikasi harus semudah satu klik.
 *
 * Satu dokumen tampil sebagai satu kartu meskipun jawaban mengutip beberapa
 * halamannya. Dua kartu berjudul sama yang hanya berbeda "hal." terbaca seperti
 * dua dokumen berbeda, dan mahasiswa harus membandingkan judul panjang yang
 * terpotong ellipsis untuk tahu keduanya sama.
 */
function Citations({ citations }: { citations: Citation[] }) {
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesLabel}>Sumber</p>
      <ul className={styles.citations}>
        {kelompokkan(citations).map((kelompok) => (
          <li key={kelompok.key}>
            <CitationCard kelompok={kelompok} />
          </li>
        ))}
      </ul>
    </div>
  )
}

type CitationGroup = {
  key: string
  title: string
  type: Citation["type"]
  /** Halaman unik dokumen ini, urut menaik. */
  pages: Citation[]
}

/**
 * Kelompokkan per dokumen, urutan kelompok mengikuti kutipan pertamanya --
 * itu urutan yang dibaca mahasiswa, dan server sudah menyusunnya begitu.
 * Halaman di dalam kartu justru diurutkan menaik: "hal. 1 dan 2" lebih mudah
 * dibaca daripada urutan kemunculannya di jawaban.
 */
function kelompokkan(citations: Citation[]): CitationGroup[] {
  const urut: CitationGroup[] = []
  const indeks = new Map<string, CitationGroup>()

  for (const citation of citations) {
    // Entri tanya jawab tak berberkas masih punya `document_id`; judul hanya
    // cadangan bila suatu saat ada sumber tanpa id.
    const key = citation.document_id || citation.title
    let kelompok = indeks.get(key)
    if (!kelompok) {
      kelompok = { key, title: citation.title, type: citation.type, pages: [] }
      indeks.set(key, kelompok)
      urut.push(kelompok)
    }
    if (!kelompok.pages.some((h) => h.page === citation.page)) {
      kelompok.pages.push(citation)
    }
  }

  for (const kelompok of urut) kelompok.pages.sort((a, b) => a.page - b.page)
  return urut
}

/**
 * Sumber PDF dibuka tepat di halaman yang dikutip. Sumber tanya jawab ditulis
 * admin langsung di dashboard dan tidak punya berkas: kartunya tetap tampil --
 * mahasiswa berhak tahu jawaban itu bersumber -- tetapi tanpa tautan yang
 * pasti buntu, dan tanpa nomor halaman yang tidak berarti apa-apa.
 */
function CitationCard({ kelompok }: { kelompok: CitationGroup }) {
  if (kelompok.type === "tanya_jawab") {
    return (
      <div className={cx(styles.citation, styles.citationStatic)}>
        <FaRegCommentDots className={styles.qaIcon} aria-hidden />
        <span className={styles.citationTitle}>{kelompok.title}</span>
        <span className={styles.citationPage}>Tanya jawab resmi</span>
      </div>
    )
  }

  // Satu halaman: seluruh kartu tetap satu tautan, target kliknya sebesar mungkin.
  if (kelompok.pages.length === 1) {
    const citation = kelompok.pages[0]
    return (
      <a
        className={styles.citation}
        href={citationUrl(citation)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaFilePdf className={styles.pdfIcon} aria-hidden />
        <span className={styles.citationTitle}>{kelompok.title}</span>
        <span className={styles.citationPage}>hal. {citation.page}</span>
        <FaExternalLinkAlt className={styles.externalIcon} aria-hidden />
        <span className="sr-only">(buka di tab baru)</span>
      </a>
    )
  }

  // Beberapa halaman: kartunya bukan tautan, karena tiap nomor menuju halaman
  // yang berbeda. Satu klik tetap cukup -- yang diklik nomornya.
  return (
    <div className={cx(styles.citation, styles.citationGrouped)}>
      <FaFilePdf className={styles.pdfIcon} aria-hidden />
      <span className={styles.citationTitle}>{kelompok.title}</span>
      <span className={styles.citationPages}>
        hal.{" "}
        {kelompok.pages.map((citation, index) => (
          <Fragment key={citation.page}>
            {pemisah(index, kelompok.pages.length)}
            <a
              className={styles.pageLink}
              href={citationUrl(citation)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${kelompok.title}, halaman ${citation.page} (buka di tab baru)`}
            >
              {citation.page}
            </a>
          </Fragment>
        ))}
      </span>
      <FaExternalLinkAlt className={styles.externalIcon} aria-hidden />
    </div>
  )
}

/** "1 dan 2", lalu "1, 2, dan 5" begitu halamannya lebih dari dua. */
function pemisah(index: number, jumlah: number): string {
  if (index === 0) return ""
  if (index < jumlah - 1) return ", "
  return jumlah > 2 ? ", dan " : " dan "
}

/** FE-3: topik berisiko tinggi, arahkan ke unit yang berwenang. */
function Escalation({ contacts }: { contacts: Contact[] }) {
  return (
    <div className={styles.escalation} role="note">
      <p className={styles.escalationTitle}>
        <FaExclamationTriangle aria-hidden /> Pastikan juga ke unit terkait
      </p>
      <ul className={styles.contacts}>
        {contacts.map((contact) => (
          <li key={contact.unit}>
            <strong>{contact.unit}</strong>
            <span>{contact.service_hours}</span>
            <span>
              {isEmail(contact.contact) ? (
                <a href={`mailto:${contact.contact}`}>{contact.contact}</a>
              ) : (
                <TeksKontak text={contact.contact} />
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Feedback({
  messageId,
  controls,
}: {
  messageId: string
  controls: FeedbackControls
}) {
  const value = controls.ratings[messageId]
  const note = controls.notes[messageId]
  return (
    <>
      <div className={styles.feedback}>
        <span>Membantu?</span>
        <button
          type="button"
          className={cx(styles.rate, value === true && styles.rateUp)}
          aria-pressed={value === true}
          aria-label="Ya, membantu"
          onClick={() => controls.rate(messageId, true)}
        >
          {value === true ? <FaThumbsUp aria-hidden /> : <FaRegThumbsUp aria-hidden />}
        </button>
        <button
          type="button"
          className={cx(styles.rate, value === false && styles.rateDown)}
          aria-pressed={value === false}
          aria-label="Tidak membantu"
          onClick={() => controls.rate(messageId, false)}
        >
          {value === false ? <FaThumbsDown aria-hidden /> : <FaRegThumbsDown aria-hidden />}
        </button>
      </div>
      {note === "sent" ? (
        <p className={styles.noteThanks} role="status">
          Terima kasih, catatan Anda sudah terkirim.
        </p>
      ) : (
        note && <NoteBox messageId={messageId} state={note} controls={controls} />
      )}
    </>
  )
}

/**
 * Kotak catatan yang menyertai 👎 (kolom `feedback.comment`).
 *
 * Jempol ke bawah saja hanya memberi tahu admin bahwa ada yang salah, bukan
 * apanya: daftar umpan balik AD-4 berisi baris tanpa keterangan yang harus
 * ditebak satu per satu. Kotak ini muncul SETELAH penilaiannya terkirim, bukan
 * sebagai syarat -- FE-5 tetap satu klik, dan mengabaikan kotak ini sama sekali
 * tidak membatalkan apa pun.
 */
function NoteBox({
  messageId,
  state,
  controls,
}: {
  messageId: string
  state: NoteState
  controls: FeedbackControls
}) {
  const [draft, setDraft] = useState("")
  const sending = state === "sending"

  return (
    <form
      className={styles.noteForm}
      onSubmit={(event) => {
        event.preventDefault()
        if (!sending) controls.submitNote(messageId, draft)
      }}
    >
      <label htmlFor={`catatan-${messageId}`} className={styles.noteLabel}>
        Apa yang kurang tepat? (opsional)
      </label>
      <textarea
        id={`catatan-${messageId}`}
        className={styles.noteInput}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Misalnya: jawabannya tidak menyebut biayanya"
        rows={2}
        maxLength={1000}
        disabled={sending}
      />
      {state === "error" && (
        <p className={styles.noteError} role="alert">
          Catatan gagal terkirim. Coba lagi sebentar lagi — penilaian 👎 Anda sudah tercatat.
        </p>
      )}
      <div className={styles.noteActions}>
        <button type="submit" className={styles.noteSend} disabled={sending || !draft.trim()}>
          {sending ? "Mengirim…" : "Kirim catatan"}
        </button>
        <button
          type="button"
          className={styles.noteSkip}
          onClick={() => controls.dismissNote(messageId)}
          disabled={sending}
        >
          Lewati
        </button>
      </div>
    </form>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}
