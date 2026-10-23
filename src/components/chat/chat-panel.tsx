"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { FaExchangeAlt, FaPaperPlane, FaStop, FaTimes } from "react-icons/fa"

import {
  fetchFaqQuestions,
  fetchPrograms,
  fetchUnits,
  type Program,
  type Unit,
} from "@/lib/api/chat"
import { uraiNim, type HasilNim } from "@/lib/nim"
import { cx } from "@/lib/utils"

import styles from "./chat.module.css"
import { ChatLogo } from "./chat-logo"
import { MenuPanel } from "./chat-menu"
import { AssistantMessage, BotBubble, UserMessage } from "./chat-message"
import { CariPercakapan } from "./chat-search"
import { FaqQuestions, TopicMenu, topicReply } from "./topic-menu"
import { namaBerkasTranskrip, susunTranskrip, unduhTeks } from "./transkrip"
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
 * dipersempit ke dokumen unit yang menanganinya. NIM tetap wajib, tetapi tidak
 * diketik: diambil dari login SADS (`nimSads`), dan tanpa NIM yang sah menu
 * topiknya nonaktif. Sesudah topik dipilih menunya minggir
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
  nimSads = null,
  expandable = false,
  onExpandChange,
}: {
  open: boolean
  /** Tanpa ini tidak ada tombol tutup -- `/embed` yang dibuka sebagai halaman penuh. */
  onClose?: () => void
  className: string
  /**
   * Menu ⋯ menawarkan "Perluas jendela". Widget portal melebarkan `.panel`
   * sendiri; panel `/embed` di situs lain meminta `embed.js` melebarkan
   * iframe-nya lewat `onExpandChange`.
   */
  expandable?: boolean
  onExpandChange?: (luas: boolean) => void
  /** Kunci situs penyemat; hanya diisi panel `/embed` yang dimuat situs lain. */
  embedKey?: string
  /**
   * NIM mahasiswa yang sedang masuk SADS (`lib/sads.ts`), dari widget portal
   * atau dari `embed.js` di halaman SADS. Satu-satunya sumber NIM: panel tidak
   * punya isian NIM, jadi tanpa login SADS tidak ada yang bisa ditanyakan.
   */
  nimSads?: string | null
}) {
  const [draft, setDraft] = useState("")
  // Menu topik dibuka lagi lewat tombol "Ganti topik". Sembilan ubin yang
  // menetap di atas percakapan mendorong jawaban keluar layar padahal
  // topiknya sudah dipilih -- yang dibaca mahasiswa adalah jawabannya.
  const [menuTerbuka, setMenuTerbuka] = useState(false)
  // null = belum dimuat; dimuat saat panel pertama kali dibuka, bukan tiap
  // halaman dibuka. Kosong (gagal dimuat) = tanpa menu topik, dan kotak
  // pertanyaan langsung tersedia -- setelah NIM sah -- dengan pencarian ke
  // semua unit: chat tidak boleh terkunci hanya karena daftar unit gagal dimuat.
  const [units, setUnits] = useState<Unit[] | null>(null)
  // Dimuat bersama `units`. Kosong (gagal dimuat) = NIM belum dapat diperiksa,
  // dan karena NIM wajib, kotak pertanyaan menunggu sampai daftar ini termuat.
  const [programs, setPrograms] = useState<Program[]>([])
  // Daftar prodi yang gagal dimuat dicoba lagi setiap kali panel dibuka lagi;
  // tanpanya chat terkunci sampai halaman dimuat ulang. Ref, bukan
  // state: percobaannya menunggu panel dibuka lagi, tidak langsung menyusul
  // kegagalan yang baru saja terjadi.
  const prodiPerluDicobaLagi = useRef(false)
  // NIM ikut setiap pertanyaan dan dicatat API bersamanya (`messages.meta`).
  // Sengaja tidak disimpan asisten di localStorage: di komputer lab bersama,
  // NIM mahasiswa sebelumnya tidak boleh terpakai lagi -- pertanyaan orang
  // berikutnya akan tercatat atas NIM itu. Data login SADS ikut hilang saat
  // mahasiswa keluar dari SADS. Prodi dan angkatannya tidak ditampilkan.
  const hasilNim = uraiNim(nimSads ?? "", programs)
  const nimSah = hasilNim.status === "sah"
  // Pertanyaan siap klik per topik, kuncinya nama unit.
  // Kunci yang belum ada = masih dimuat.
  const [faq, setFaq] = useState<Record<string, string[]>>({})
  const faqDiminta = useRef(new Set<string>())
  const { entries, busy, send, cancel, feedback, unit, chooseTopic } = useChat(
    embedKey,
    hasilNim.status === "sah" ? hasilNim.nim : null
  )
  const bannerEskalasi = bannerEskalasiTerakhir(entries)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Menu ⋯ di kepala panel (`chat-menu.tsx`).
  const menuTombolRef = useRef<HTMLButtonElement>(null)
  const [luas, setLuas] = useState(false)
  const [cariTerbuka, setCariTerbuka] = useState(false)
  // Pencarian diulang setiap kali isi percakapan berubah. Balasan topik ikut
  // berubah saat pertanyaan siap kliknya selesai dimuat.
  const isiPercakapan = useMemo(() => [entries, faq], [entries, faq])

  const adaTopik = units !== null && units.length > 0
  const ajakan = adaTopik ? "Silakan pilih topik di bawah ini." : "Silakan tulis pertanyaan di bawah."
  const jumlahPilihan = entries.filter((entry) => entry.role === "topic").length
  const bolehMengetik = nimSah && (jumlahPilihan > 0 || (units !== null && units.length === 0))
  const sudahMemilih = adaTopik && jumlahPilihan > 0

  // Satu menu saja, pindah tempat: di sapaan selagi belum ada topik, dan di
  // dasar percakapan saat dibuka lagi -- di sana ia terlihat tanpa menggulir
  // balik ke atas, tepat di atas kotak pertanyaan.
  // Bentuknya meniru pilihan awal widget Glide (docs/glide.md): sapaan di
  // atas, pilihan menempel di dasar percakapan, tepat di atas kotak pertanyaan.
  const menu = adaTopik ? (
    <div className={styles.choices}>
      <TopicMenu
        id={`${PANEL_ID}-topik`}
        units={units}
        active={sudahMemilih ? unit : undefined}
        disabled={!nimSah}
        onPick={(pilihan) => {
          setMenuTerbuka(false)
          chooseTopic(pilihan)
        }}
      />
    </div>
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
  // dipilih, karena kotaknya baru muncul setelah itu, dan saat NIM dari
  // `embed.js` tiba belakangan, karena baru saat itu ubinnya aktif.
  useEffect(() => {
    if (!open) return
    if (inputRef.current) inputRef.current.focus()
    else document.querySelector<HTMLButtonElement>(`#${PANEL_ID}-topik button:enabled`)?.focus()
  }, [open, units, jumlahPilihan, nimSah])

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

  function gantiLuas() {
    setLuas(!luas)
    onExpandChange?.(!luas)
  }

  function bukaPencarian() {
    if (cariTerbuka) document.getElementById(`${PANEL_ID}-cari`)?.focus()
    else setCariTerbuka(true)
  }

  function tutupPencarian() {
    setCariTerbuka(false)
    menuTombolRef.current?.focus()
  }

  function unduhTranskrip() {
    const waktu = new Date()
    const isi = susunTranskrip({
      entries,
      sapaan: `Hai, Civitas INSTIKI!\nApa yang ingin Anda tanyakan?\n${ajakan}`,
      balasanTopik: (nama) => topicReply(nama, faq[nama]),
      eskalasi: bannerEskalasi,
      waktu,
    })
    unduhTeks(namaBerkasTranskrip(waktu), isi)
  }

  return (
    <section
      id={PANEL_ID}
      className={cx(className, expandable && luas && styles.panelWide)}
      hidden={!open}
      // Dibuka sebagai halaman penuh ia bukan dialog di atas halaman lain.
      role={onClose ? "dialog" : undefined}
      aria-labelledby={`${PANEL_ID}-judul`}
      onKeyDown={(event) => event.key === "Escape" && onClose?.()}
    >
      <header className={styles.header}>
        <span className={styles.headerAvatar} aria-hidden>
          <ChatLogo />
        </span>
        <div className={styles.heading}>
          <h2 id={`${PANEL_ID}-judul`} className={styles.title}>
            Asisten Administrasi
          </h2>
          <p className={styles.subtitle}>Menjawab dari dokumen resmi kampus</p>
        </div>
        <MenuPanel
          id={`${PANEL_ID}-menu`}
          tombolRef={menuTombolRef}
          luas={luas}
          bisaDiperluas={expandable}
          onPerluas={gantiLuas}
          onCari={bukaPencarian}
          onUnduh={unduhTranskrip}
          unduhNonaktif={entries.length === 0}
        />
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

      {cariTerbuka && (
        <CariPercakapan
          id={`${PANEL_ID}-cari`}
          listRef={listRef}
          isi={isiPercakapan}
          onClose={tutupPencarian}
        />
      )}

      {/* `aria-busy` menahan pembacaan selagi jawaban mengalir: tanpa itu
          pembaca layar mengulang kalimat yang sama setiap satu potongan
          tiba, dan jawabannya tidak pernah terbaca utuh. */}
      <div ref={listRef} className={styles.messages} aria-live="polite" aria-busy={busy}>
        <BotBubble>
          <strong className={styles.greeting}>Hai, Civitas INSTIKI!</strong>
          {"Apa yang ingin Anda tanyakan?\n"}
          {ajakan}
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
                        disabled={busy || !nimSah}
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

      {/* Selama belum ada kotak pertanyaan, dasar panel menyatu dengan
          percakapan: yang terlihat hanya pilihan di atasnya. */}
      <footer className={cx(styles.footer, !bolehMengetik && styles.footerBare)}>
        {sudahMemilih && (
          // Menu yang tersembunyi membuat lingkup pencarian ikut tak terlihat,
          // jadi topik yang sedang berlaku disebut di sini -- di sebelah satu-
          // satunya tombol untuk menggantinya.
          <div className={styles.scopeBar}>
            <span className={styles.scopeName}>
              Topik: <strong>{unit}</strong>
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
        ) : units === null ? (
          <p className={styles.composerHint}>Memuat topik…</p>
        ) : hasilNim.status !== "sah" ? (
          // Tanpa isian NIM, hanya di sini mahasiswa tahu kenapa ubin topik
          // dan kotak pertanyaannya tidak dapat dipakai.
          <p className={styles.composerHint} role="status">
            {alasanTanpaNim(hasilNim)}
          </p>
        ) : null}
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

/** Kenapa belum bisa bertanya, untuk setiap NIM yang tidak sah. */
function alasanTanpaNim(hasil: Exclude<HasilNim, { status: "sah" }>): string {
  switch (hasil.status) {
    case "tanpa-daftar":
      return "Daftar prodi gagal dimuat, jadi NIM Anda belum dapat diperiksa. Tutup lalu buka lagi panel ini, atau muat ulang halaman."
    case "tidak-dikenal":
      return `NIM akun SADS Anda belum dapat dipakai. ${hasil.pesan}`
    // Belum masuk SADS, atau yang masuk dosen/staf (`bacaLoginSads`).
    case "kosong":
    case "belum-lengkap":
      return "Asisten hanya dapat dipakai mahasiswa yang sudah masuk SADS."
  }
}
