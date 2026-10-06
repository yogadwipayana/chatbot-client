"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { FaExchangeAlt, FaPaperPlane, FaRobot, FaStop, FaTimes } from "react-icons/fa"

import {
  fetchFaqQuestions,
  fetchPrograms,
  fetchUnits,
  type Program,
  type Unit,
} from "@/lib/api/chat"
import { uraiNim } from "@/lib/nim"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import { AssistantMessage, BotBubble, UserMessage } from "./chat-message"
import { FaqQuestions, NimField, TopicMenu, topicReply } from "./topic-menu"
import { bannerEskalasiTerakhir, useChat } from "./use-chat"

export const PANEL_ID = "asisten-administrasi"

/**
 * Batas panjang pertanyaan yang diketik. Di bawah batas API (500) dengan
 * sengaja: pencarian dokumen bekerja paling baik untuk satu pertanyaan pendek,
 * dan kotak sependek ini menolak curhat panjang sebelum terkirim, bukan
 * sesudah. Batas API lebih longgar karena pertanyaan siap klik -- entri tanya
 * jawab admin -- boleh sampai 500 karakter.
 */
const MAKS_KARAKTER = 200

/**
 * Isi asisten administrasi (FE-1..FE-5), dipakai widget portal dan halaman
 * `/embed` yang dimuat situs lain.
 *
 * Percakapan dimulai dari menu topik, seperti halaman FAQ: kotak pertanyaan
 * baru muncul setelah mahasiswa memilih unit, supaya setiap pertanyaan sudah
 * dipersempit ke dokumen unit yang menanganinya. Sesudah itu menunya minggir
 * -- yang dibaca tinggal percakapan -- dan topiknya diganti lewat tombol di
 * dekat kotak pertanyaan. Saran pertanyaan umum (FE-6) sengaja tidak
 * ditampilkan di sapaan -- mengkliknya akan melewati pilihan unit; pertanyaan
 * siap klik kini muncul per topik.
 *
 * Tetap terpasang saat ditutup, hanya disembunyikan: percakapan dan draf yang
 * belum terkirim tidak boleh hilang hanya karena panel ditutup sebentar.
 */
export function ChatPanel({
  open,
  onClose,
  className,
  embedKey,
}: {
  open: boolean
  /** Tanpa ini tidak ada tombol tutup -- `/embed` yang dibuka sebagai halaman penuh. */
  onClose?: () => void
  className: string
  /** Kunci situs penyemat; hanya diisi panel `/embed` yang dimuat situs lain. */
  embedKey?: string
}) {
  const [draft, setDraft] = useState("")
  // Menu topik dibuka lagi lewat tombol "Ganti topik". Sembilan ubin yang
  // menetap di atas percakapan mendorong jawaban keluar layar padahal
  // topiknya sudah dipilih -- yang dibaca mahasiswa adalah jawabannya.
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  // null = belum dimuat; dimuat saat panel pertama kali dibuka, bukan tiap
  // halaman dibuka. Kosong (gagal dimuat) = tanpa menu topik, dan kotak
  // pertanyaan langsung tersedia dengan pencarian ke semua unit -- chat tidak
  // boleh terkunci hanya karena daftar unit gagal dimuat.
  const [units, setUnits] = useState<Unit[] | null>(null)
  // Dimuat bersama `units`. Kosong (gagal dimuat) = tanpa isian NIM: tanpa
  // daftar prodi NIM-nya tidak dapat diurai.
  const [programs, setPrograms] = useState<Program[]>([])
  // Daftar prodi yang gagal dimuat dicoba lagi setiap kali panel dibuka lagi;
  // tanpanya isian NIM baru kembali setelah halaman dimuat ulang. Ref, bukan
  // state: percobaannya menunggu panel dibuka lagi, tidak langsung menyusul
  // kegagalan yang baru saja terjadi.
  const prodiPerluDicobaLagi = useRef(false)
  // NIM hanya hidup di sini dan tidak pernah dikirim; yang ikut pertanyaan
  // adalah hasil uraiannya. Sengaja tidak disimpan di localStorage: di
  // komputer lab bersama, NIM mahasiswa sebelumnya tidak boleh terisi sendiri.
  const [nim, setNim] = useState("")
  const hasilNim = uraiNim(nim, programs)
  // Pertanyaan siap klik per topik, kuncinya nama unit.
  // Kunci yang belum ada = masih dimuat.
  const [faq, setFaq] = useState<Record<string, string[]>>({})
  const faqDiminta = useRef(new Set<string>())
  const { entries, busy, send, cancel, feedback, unit, chooseTopic } = useChat(
    embedKey,
    hasilNim.status === "sah" ? hasilNim.profil : null
  )
  const bannerEskalasi = bannerEskalasiTerakhir(entries)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const adaTopik = units !== null && units.length > 0
  const jumlahPilihan = entries.filter((entry) => entry.role === "topic").length
  const bolehMengetik = jumlahPilihan > 0 || (units !== null && units.length === 0)
  const sudahMemilih = adaTopik && jumlahPilihan > 0

  // Satu menu saja, pindah tempat: di sapaan selagi belum ada topik, dan di
  // dasar percakapan saat dibuka lagi -- di sana ia terlihat tanpa menggulir
  // balik ke atas, tepat di atas kotak pertanyaan.
  // NIM ikut pindah bersama ubinnya: dibuka lagi lewat "Ganti topik", di
  // situlah NIM yang salah ketik diperbaiki.
  const menu = adaTopik ? (
    <>
      {programs.length > 0 && (
        <NimField id={`${PANEL_ID}-nim`} value={nim} onChange={setNim} hasil={hasilNim} />
      )}
      <TopicMenu
        id={`${PANEL_ID}-topik`}
        units={units}
        active={sudahMemilih ? unit : undefined}
        onPick={(pilihan) => {
          setMenuTerbuka(false)
          chooseTopic(pilihan)
        }}
      />
    </>
  ) : null

  useEffect(() => {
    if (!open || units !== null) return
    const controller = new AbortController()
    void Promise.all([fetchUnits(controller.signal), fetchPrograms(controller.signal)]).then(
      ([items, prodi]) => {
        if (controller.signal.aborted) return
        prodiPerluDicobaLagi.current = prodi.length === 0
        setPrograms(prodi)
        setUnits(items)
      }
    )
    return () => controller.abort()
  }, [open, units])

  // Unit sengaja tidak ikut dicoba lagi: menu topik yang tiba-tiba muncul di
  // tengah percakapan tanpa topik akan menyembunyikan kotak pertanyaannya.
  useEffect(() => {
    if (!open || !prodiPerluDicobaLagi.current) return
    const controller = new AbortController()
    void fetchPrograms(controller.signal).then((prodi) => {
      if (controller.signal.aborted) return
      prodiPerluDicobaLagi.current = prodi.length === 0
      setPrograms(prodi)
    })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    for (const entry of entries) {
      if (entry.role !== "topic") continue
      const kunci = entry.unit
      if (faqDiminta.current.has(kunci)) continue
      faqDiminta.current.add(kunci)
      fetchFaqQuestions(entry.unit).then((items) =>
        setFaq((prev) => ({ ...prev, [kunci]: items }))
      )
    }
  }, [entries])

  // Fokus ke tempat mahasiswa harus bertindak berikutnya: kotak pertanyaan
  // bila sudah ada, ubin topik pertama bila belum. Juga setiap kali topik
  // dipilih, karena kotaknya baru muncul setelah itu.
  useEffect(() => {
    if (!open) return
    if (inputRef.current) inputRef.current.focus()
    else document.querySelector<HTMLButtonElement>(`#${PANEL_ID}-topik button`)?.focus()
  }, [open, units, jumlahPilihan])

  // Kotak pertanyaan setinggi isinya, tumbuh ke atas karena ia menempel di
  // dasar panel -- pertanyaan dua tiga baris terbaca utuh, tidak tergulir
  // mendatar. `auto` dulu supaya kotaknya ikut menyusut lagi setelah dikirim.
  // `max-height` di CSS yang menghentikannya; sisanya digulirkan textarea.
  // Panel tertutup hanya disembunyikan, dan yang tersembunyi tidak punya
  // ukuran: mengukurnya di sana menghasilkan kotak setinggi nol, jadi
  // pengukurannya menunggu panel terlihat lagi.
  useEffect(() => {
    const box = inputRef.current
    if (!box || !open) return
    box.style.height = "auto"
    // `scrollHeight` tidak menghitung tepi, sedangkan tingginya border-box.
    box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`
  }, [draft, bolehMengetik, open])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [entries, faq, open, menuTerbuka])

  function ask(question: string) {
    if (!question.trim() || busy) return
    setDraft("")
    void send(question)
  }

  return (
    <section
      id={PANEL_ID}
      className={className}
      hidden={!open}
      // Dibuka sebagai halaman penuh ia bukan dialog di atas halaman lain.
      role={onClose ? "dialog" : undefined}
      aria-labelledby={`${PANEL_ID}-judul`}
      onKeyDown={(event) => event.key === "Escape" && onClose?.()}
    >
      <header className={styles.header}>
        <span className={styles.headerAvatar} aria-hidden>
          <FaRobot />
        </span>
        <div className={styles.heading}>
          <h2 id={`${PANEL_ID}-judul`} className={styles.title}>
            Asisten Administrasi
          </h2>
          <p className={styles.subtitle}>Menjawab dari dokumen resmi kampus</p>
        </div>
        {onClose && (
          <button
            type="button"
            className={styles.tool}
            onClick={onClose}
            aria-label="Tutup asisten"
          >
            <FaTimes aria-hidden />
          </button>
        )}
      </header>

      {/* `aria-busy` menahan pembacaan selagi jawaban mengalir: tanpa itu
          pembaca layar mengulang kalimat yang sama setiap satu potongan
          tiba, dan jawabannya tidak pernah terbaca utuh. */}
      <div ref={listRef} className={styles.messages} aria-live="polite" aria-busy={busy}>
        <BotBubble>
          <strong className={styles.greeting}>Hai, Civitas INSTIKI!</strong>
          {adaTopik
            ? "Apa yang ingin Anda tanyakan?\nPilih topik di bawah ini."
            : "Apa yang ingin Anda tanyakan? Tulis pertanyaan Anda di bawah."}
        </BotBubble>

        {!sudahMemilih && menu}

        {entries.map((entry) => {
          if (entry.role === "user") {
            return <UserMessage key={entry.id} text={entry.text} unit={entry.unit} />
          }
          if (entry.role === "topic") {
            const questions = faq[entry.unit]
            return (
              <Fragment key={entry.id}>
                <UserMessage text={entry.unit} unit={null} />
                <BotBubble
                  extra={
                    questions && (
                      <FaqQuestions
                        questions={questions}
                        disabled={busy}
                        onAsk={(question) => void send(question, entry.unit)}
                      />
                    )
                  }
                >
                  {topicReply(entry.unit, questions)}
                </BotBubble>
              </Fragment>
            )
          }
          return (
            <AssistantMessage
              key={entry.id}
              entry={entry}
              controls={feedback}
              showEscalation={bannerEskalasi.has(entry.id)}
            />
          )
        })}

        {sudahMemilih && menuTerbuka && menu}
      </div>

      <footer className={styles.footer}>
        {sudahMemilih && (
          // Menu yang tersembunyi membuat lingkup pencarian ikut tak terlihat,
          // jadi topik yang sedang berlaku disebut di sini -- di sebelah satu-
          // satunya tombol untuk menggantinya.
          <div className={styles.scopeBar}>
            <span className={styles.scopeName}>
              Topik: <strong>{unit}</strong>
              {hasilNim.status === "sah" &&
                ` · ${hasilNim.prodi.name} ${hasilNim.profil.intake_year}`}
            </span>
            <button
              type="button"
              className={cx(styles.scopeChange, menuTerbuka && styles.scopeChangeOpen)}
              onClick={() => setMenuTerbuka((terbuka) => !terbuka)}
              aria-expanded={menuTerbuka}
              aria-controls={`${PANEL_ID}-topik`}
            >
              {menuTerbuka ? <FaTimes aria-hidden /> : <FaExchangeAlt aria-hidden />}
              {menuTerbuka ? "Tutup daftar" : "Ganti topik"}
            </button>
          </div>
        )}
        {bolehMengetik ? (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault()
              ask(draft)
            }}
          >
            <label htmlFor={`${PANEL_ID}-input`} className="sr-only">
              Pertanyaan
            </label>
            <textarea
              ref={inputRef}
              id={`${PANEL_ID}-input`}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAKS_KARAKTER))}
              // Enter mengirim, seperti waktu kotaknya masih sebaris;
              // Shift+Enter menyisakan cara berganti baris. Saat IME masih
              // menyusun kata, Enter miliknya -- ia yang memilih kandidat.
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                ask(draft)
              }}
              placeholder={unit ? `Tulis pertanyaan seputar ${unit}…` : "Tulis pertanyaan…"}
              rows={1}
              maxLength={MAKS_KARAKTER}
              autoComplete="off"
              aria-describedby={`${PANEL_ID}-sisa`}
            />
            {busy ? (
              // Tempat yang sama dengan tombol kirim: selagi jawaban disusun,
              // satu-satunya tindakan yang masuk akal adalah menghentikannya.
              <button
                type="button"
                className={styles.send}
                onClick={cancel}
                aria-label="Hentikan jawaban"
                title="Hentikan jawaban"
              >
                <FaStop aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                className={styles.send}
                disabled={!draft.trim()}
                aria-label="Kirim pertanyaan"
              >
                <FaPaperPlane aria-hidden />
              </button>
            )}
          </form>
        ) : (
          <p className={styles.composerHint}>
            {units === null ? "Memuat topik…" : "Pilih topik di atas untuk mulai bertanya."}
          </p>
        )}
        {bolehMengetik && (
          // Terbaca pembaca layar saat kotaknya difokus (`aria-describedby`),
          // jadi batasnya diketahui sebelum mengetik, bukan setelah mentok.
          <p
            id={`${PANEL_ID}-sisa`}
            className={`${styles.counter} ${draft.length >= MAKS_KARAKTER ? styles.counterFull : ""}`}
          >
            {draft.length}/{MAKS_KARAKTER} karakter
          </p>
        )}
        <p className={styles.disclaimer}>Periksa sumbernya sebelum mengambil keputusan penting.</p>
      </footer>
    </section>
  )
}
