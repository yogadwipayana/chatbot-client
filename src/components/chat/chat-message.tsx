import {
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFilePdf,
  FaHandHoldingHeart,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaRobot,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa"

import { citationUrl, type Citation, type Contact } from "@/lib/api/chat"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import type { ChatEntry } from "./use-chat"

type AssistantEntry = Extract<ChatEntry, { role: "assistant" }>

export function UserMessage({ text }: { text: string }) {
  return (
    <div className={cx(styles.msg, styles.msgUser)}>
      <div className={styles.name}>Anda</div>
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
  ratings,
  onRate,
  showEscalation,
}: {
  entry: AssistantEntry
  ratings: Record<string, boolean>
  onRate: (messageId: string, helpful: boolean) => void
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

  if (entry.state === "error") {
    return <BotBubble tone="error">{entry.message}</BotBubble>
  }

  const { response, complete } = entry.reply
  // Sapaan tidak dinilai (bukan jawaban), begitu pula balasan dukungan --
  // meminta mahasiswa yang sedang tertekan menilai balasan tidak pantas.
  const dapatDinilai = response.kind === "answer" || response.kind === "refusal"
  const feedback = response.message_id && dapatDinilai && (
    <Feedback
      value={ratings[response.message_id]}
      onRate={(helpful) => onRate(response.message_id!, helpful)}
    />
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
        <RichText text={response.text} />
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

/**
 * Model kadang menulis penekanan Markdown (`**3 Agustus 2026**`). Hanya tebal
 * yang diterjemahkan; sisanya -- termasuk penanda sitasi `[Judul, hal. 12]` --
 * ditampilkan apa adanya.
 */
function RichText({ text }: { text: string }) {
  const bagian = text.split(/\*\*([\s\S]+?)\*\*/g)
  return (
    <>
      {bagian.map((teks, index) =>
        index % 2 === 1 ? <strong key={index}>{teks}</strong> : teks
      )}
    </>
  )
}

/** FE-2: verifikasi harus semudah satu klik. */
function Citations({ citations }: { citations: Citation[] }) {
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesLabel}>Sumber</p>
      <ul className={styles.citations}>
        {citations.map((citation) => (
          <li key={`${citation.document_id}-${citation.halaman}`}>
            <a
              className={styles.citation}
              href={citationUrl(citation)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFilePdf className={styles.pdfIcon} aria-hidden />
              <span className={styles.citationTitle}>{citation.judul}</span>
              <span className={styles.citationPage}>hal. {citation.halaman}</span>
              <FaExternalLinkAlt className={styles.externalIcon} aria-hidden />
              <span className="sr-only">(buka di tab baru)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
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
            <span>{contact.jam_layanan}</span>
            <span>
              {isEmail(contact.kontak) ? (
                <a href={`mailto:${contact.kontak}`}>{contact.kontak}</a>
              ) : (
                contact.kontak
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Feedback({
  value,
  onRate,
}: {
  value: boolean | undefined
  onRate: (helpful: boolean) => void
}) {
  return (
    <div className={styles.feedback}>
      <span>Membantu?</span>
      <button
        type="button"
        className={cx(styles.rate, value === true && styles.rateUp)}
        aria-pressed={value === true}
        aria-label="Ya, membantu"
        onClick={() => onRate(true)}
      >
        {value === true ? <FaThumbsUp aria-hidden /> : <FaRegThumbsUp aria-hidden />}
      </button>
      <button
        type="button"
        className={cx(styles.rate, value === false && styles.rateDown)}
        aria-pressed={value === false}
        aria-label="Tidak membantu"
        onClick={() => onRate(false)}
      >
        {value === false ? <FaThumbsDown aria-hidden /> : <FaRegThumbsDown aria-hidden />}
      </button>
    </div>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}
