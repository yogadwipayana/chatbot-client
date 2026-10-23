/*
 * Asisten Administrasi -- skrip sematan untuk situs lain.
 *
 *   <script src="https://<domain-portal>/embed.js" data-key="emb_..." async></script>
 *
 * Satu baris itu memasang tombol "Tanya Asisten" di pojok kanan bawah. Panelnya
 * adalah halaman /embed milik portal yang dimuat dalam iframe, jadi situs
 * penyemat tidak menyalin desain dan tidak memanggil API sendiri: permintaan ke
 * API berangkat dari asal portal, yang sudah terdaftar di CORS_ORIGINS API.
 *
 * data-key adalah kunci sematan situs ini, dibuat di halaman Sematan dashboard
 * admin. Kunci bukan rahasia; yang membatasinya daftar situs milik kunci itu,
 * yang diperiksa portal (src/proxy.ts) setiap kali panel dibuka. Situs di luar
 * daftar itu tetap mendapat tombolnya, tetapi peramban menolak panelnya.
 *
 * Di SADS, NIM mahasiswa yang sedang masuk dibaca dari localStorage halaman
 * (`kojindeta`, ditulis SADS sendiri) dan diteruskan ke panel, yang tidak
 * punya isian NIM. Hanya dibaca, dan hanya NIM yang dikirim.
 *
 * Disajikan apa adanya dari public/, tanpa build step. Berkas ini berjalan di
 * halaman milik orang lain: jangan sentuh apa pun di luar elemennya sendiri.
 */
;(() => {
  "use strict"

  const script = document.currentScript
  // Terpasang dua kali (mis. lewat template dan tag manager): cukup satu tombol.
  if (!script || window.__asistenAdministrasi) return

  const KUNCI = (script.getAttribute("data-key") || "").trim()
  if (!KUNCI) {
    // Tanpa kunci panelnya pasti ditolak portal; tombol yang membuka panel
    // kosong lebih membingungkan daripada tidak ada tombol sama sekali.
    console.warn(
      "[Asisten Administrasi] Atribut data-key belum diisi pada tag <script> embed.js. " +
        "Minta kode sematan lengkap dari pengelola portal (dashboard admin, menu Sematan)."
    )
    return
  }
  // Setelah kunci diperiksa: tag tanpa kunci tidak boleh menghalangi tag yang benar.
  window.__asistenAdministrasi = true

  const ASAL = new URL(script.src).origin
  // Harus sama dengan src/components/chat/embedded-chat.tsx.
  const PESAN_BUKA = "asisten:buka"
  const PESAN_TUTUP = "asisten:tutup"
  const PESAN_SIAP = "asisten:siap"
  const PESAN_IDENTITAS = "asisten:identitas"
  const PESAN_PERLUAS = "asisten:perluas"

  // Logo asisten, salinan `ChatLogo` (src/components/chat/chat-logo.tsx) di
  // tombol portal: bila logonya diganti, samakan keduanya (docs/logo/README.md).
  // Warnanya tetap; `fill` pada tiap path mengalahkan `fill: currentColor`.
  const BALON =
    "M8 4h12a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7.5l-4.6 3.8c-.6.5-1.4.1-1.4-.7V20.6A5 5 0 0 1 3 16V9a5 5 0 0 1 5-5z"
  const IKON_BUKA =
    `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">` +
    `<path fill="#171717" transform="translate(3.5 3.5)" d="${BALON}"></path>` +
    `<path fill="#fff" stroke="#171717" stroke-width="2.4" stroke-linejoin="round" d="${BALON}"></path>` +
    `<path fill="none" stroke="#171717" stroke-width="2.4" stroke-linecap="round" d="M8.5 10.5h11M8.5 15h6.5"></path>` +
    `</svg>`
  // Ikon FaTimes (react-icons), sama dengan tombol di portal.
  const IKON_TUTUP = svg(
    "0 0 352 512",
    "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
  )

  // Bukan <div>: aturan seperti `div { margin: ... }` milik situs penyemat
  // tidak boleh ikut mengenai elemen ini.
  const host = document.createElement("asisten-administrasi")
  host.setAttribute("data-asisten-administrasi", "")
  // Shadow DOM: CSS situs penyemat tidak bisa merusak tombol, dan CSS tombol
  // tidak bocor ke situs penyemat.
  const root = host.attachShadow({ mode: "open" })
  // Constructable stylesheet, bukan <style>: situs dengan CSP `style-src` tanpa
  // 'unsafe-inline' memblokir <style> sisipan, dan tombolnya tampil tanpa gaya
  // di tengah halaman. CSP tidak mengatur stylesheet yang dibangun lewat CSSOM.
  const sheet = new CSSStyleSheet()
  // Warna dan ukuran menyalin .launcher dan .panel di chat.module.css.
  sheet.replaceSync(`
    :host {
      all: initial;
    }

    .launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 46px;
      margin: 0;
      padding: 0 18px;
      border: 1px solid #d73925;
      border-radius: 23px;
      background: #dd4b39;
      color: #fff;
      font: 600 15px/1 "Source Sans 3", "Source Sans Pro", "Helvetica Neue", Helvetica, Arial,
        sans-serif;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: background-color 0.15s, box-shadow 0.15s;
    }

    .launcher:hover {
      background: #c23321;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
    }

    .launcher:focus-visible {
      outline: 2px solid #3c8dbc;
      outline-offset: 2px;
    }

    .launcher svg {
      width: 1em;
      height: 1em;
      font-size: 18px;
      fill: currentColor;
    }

    /* Sama dengan <ChatLogo size={24} /> di tombol portal. */
    .launcher svg.logo {
      font-size: 24px;
    }

    .frame {
      position: fixed;
      right: 20px;
      bottom: 78px;
      z-index: 2147483000;
      width: 380px;
      height: min(580px, calc(100dvh - 100px));
      overflow: hidden;
      border-radius: 3px;
      background: #fff;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
      transition: width 0.2s ease;
    }

    /* "Perluas jendela" di menu panel (pesan asisten:perluas). */
    .frame.luas {
      width: min(680px, calc(100vw - 40px));
    }

    .frame[hidden] {
      display: none;
    }

    iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
    }

    @media (max-width: 575px) {
      .launcher {
        width: 46px;
        padding: 0;
        justify-content: center;
      }

      .label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      .frame,
      .frame.luas {
        right: 10px;
        left: 10px;
        bottom: 76px;
        width: auto;
        height: calc(100dvh - 88px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .launcher,
      .frame {
        transition: none;
      }
    }
  `)
  root.adoptedStyleSheets = [sheet]
  root.innerHTML = `
    <div class="frame" id="panel" hidden></div>
    <button type="button" class="launcher" aria-expanded="false" aria-controls="panel">
      <span class="icon"></span><span class="label"></span>
    </button>
  `

  const frame = root.querySelector(".frame")
  const launcher = root.querySelector(".launcher")
  const icon = root.querySelector(".icon")
  const label = root.querySelector(".label")
  let iframe = null
  let open = false

  function render() {
    launcher.setAttribute("aria-expanded", String(open))
    icon.innerHTML = open ? IKON_TUTUP : IKON_BUKA
    label.textContent = open ? "Tutup" : "Tanya Asisten"
  }

  /** `dariPanel` = ditutup lewat tombol di dalam panel, yang sudah tahu sendiri. */
  function setOpen(next, dariPanel) {
    open = next
    // Portal baru dimuat saat tombolnya pertama kali ditekan: halaman penyemat
    // tidak ikut menanggung beratnya bagi pengunjung yang tidak bertanya apa-apa.
    if (next && !iframe) {
      iframe = document.createElement("iframe")
      iframe.title = "Asisten Administrasi"
      iframe.src = `${ASAL}/embed?mode=widget&key=${encodeURIComponent(KUNCI)}`
      frame.append(iframe)
    }
    frame.hidden = !next
    render()

    if (next) {
      // Fokus harus pindah ke iframe dulu; tanpanya kotak pertanyaan di dalamnya
      // tidak bisa memfokuskan diri. Sebelum /embed selesai dimuat pesan ini
      // dibuang peramban karena asalnya belum cocok -- tidak apa-apa, halaman
      // itu memang mulai dalam keadaan terbuka.
      iframe.focus()
      iframe.contentWindow.postMessage({ type: PESAN_BUKA }, ASAL)
    } else {
      if (!dariPanel && iframe) iframe.contentWindow.postMessage({ type: PESAN_TUTUP }, ASAL)
      launcher.focus()
    }
  }

  launcher.addEventListener("click", () => setOpen(!open, false))

  window.addEventListener("message", (event) => {
    if (!iframe || event.source !== iframe.contentWindow || event.origin !== ASAL) return
    const type = event.data && event.data.type
    if (type === PESAN_TUTUP) setOpen(false, true)
    // Panel baru bisa menerima pesan setelah ia sendiri berkata siap; pesan
    // yang dikirim saat iframe masih dimuat dibuang peramban.
    else if (type === PESAN_SIAP) {
      iframe.contentWindow.postMessage({ type: PESAN_IDENTITAS, nim: nimSads() }, ASAL)
    }
    // Di layar sempit iframe-nya sudah selebar layar (media query di atas).
    else if (type === PESAN_PERLUAS) frame.classList.toggle("luas", event.data.luas === true)
  })

  render()
  if (document.body) document.body.append(host)
  else document.addEventListener("DOMContentLoaded", () => document.body.append(host))

  /**
   * NIM mahasiswa yang sedang masuk SADS, dari data login yang ditulis SADS di
   * localStorage (`kojindeta`, field `id1`). null di situs lain, sebelum masuk,
   * dan untuk akun dosen/staf (`role` selain 1), yang `id1`-nya bukan NIM.
   * Harus sama dengan bacaLoginSads di src/lib/sads.ts.
   */
  function nimSads() {
    try {
      const data = JSON.parse(localStorage.getItem("kojindeta") || "null")
      if (!data || typeof data !== "object") return null
      if (data.role !== undefined && Number(data.role) !== 1) return null
      const nim = typeof data.id1 === "number" ? String(data.id1) : String(data.id1 || "").trim()
      return /^\d{10}$/.test(nim) ? nim : null
    } catch {
      // Isinya bukan JSON, atau localStorage diblokir: dianggap belum masuk.
      return null
    }
  }

  function svg(viewBox, d) {
    return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false"><path d="${d}"></path></svg>`
  }
})()
