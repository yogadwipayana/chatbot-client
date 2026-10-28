/*
 * Asisten Administrasi -- skrip sematan untuk situs lain.
 *
 *   <script src="https://<domain-portal>/embed.js" data-key="emb_..." async></script>
 *
 * Satu baris itu memasang tombol bulat berlogo asisten di pojok kanan bawah. Panelnya
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
  // Ikon FaChevronDown (react-icons), sama dengan tombol di portal.
  const IKON_TUTUP = svg(
    "0 0 448 512",
    "M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
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

    /* Bulat berisi ikon saja; teks .label hanya untuk pembaca layar. */
    .launcher {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483000;
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      margin: 0;
      padding: 0;
      border: 1px solid #d73925;
      border-radius: 50%;
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

    /* Sama dengan .launcherIcon di chat.module.css: logo dan chevron
       bertumpuk, pergantiannya berputar searah jarum jam sambil memudar. */
    .icon {
      display: grid;
      grid-area: 1 / 1;
      place-items: center;
      transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .icon.tutup,
    .launcher.open .icon.buka {
      opacity: 0;
    }

    .icon.tutup {
      transform: rotate(-90deg) scale(0.4);
    }

    .launcher.open .icon.buka {
      transform: rotate(90deg) scale(0.4);
    }

    .launcher.open .icon.tutup {
      opacity: 1;
      transform: none;
    }

    .label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
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
      /* Sama dengan .panel di chat.module.css: muncul dari arah tombol sambil
         membesar dan memudar masuk; display ikut ditransisikan supaya bingkai
         tetap terlihat selama animasi menghilangnya. */
      transform-origin: bottom right;
      transition-property: width, opacity, transform, display;
      transition-duration: 0.2s, 0.25s, 0.25s, 0.25s;
      transition-timing-function: ease, ease-out, cubic-bezier(0.2, 0.8, 0.2, 1), linear;
      transition-behavior: allow-discrete;
    }

    @starting-style {
      .frame {
        opacity: 0;
        transform: translateY(16px) scale(0.95);
      }
    }

    /* "Perluas jendela" di menu panel (pesan asisten:perluas). */
    .frame.luas {
      width: min(680px, calc(100vw - 40px));
    }

    /* Panel di dalam iframe menunda hilangnya sedikit lebih lama dari ini
       (.embedded[hidden] di chat.module.css), supaya bingkainya tidak memudar
       dalam keadaan kosong. */
    .frame[hidden] {
      display: none;
      opacity: 0;
      transform: translateY(16px) scale(0.95);
      pointer-events: none;
      transition-duration: 0.2s, 0.18s, 0.18s, 0.18s;
      transition-timing-function: ease, ease-in, ease-in, linear;
    }

    iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
    }

    @media (max-width: 575px) {
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
      .icon,
      .frame {
        transition: none;
      }
    }
  `)
  root.adoptedStyleSheets = [sheet]
  root.innerHTML = `
    <div class="frame" id="panel" hidden></div>
    <button type="button" class="launcher" aria-expanded="false" aria-controls="panel">
      <span class="icon buka">${IKON_BUKA}</span><span class="icon tutup">${IKON_TUTUP}</span><span class="label"></span>
    </button>
  `

  const frame = root.querySelector(".frame")
  const launcher = root.querySelector(".launcher")
  const label = root.querySelector(".label")
  let iframe = null
  let open = false

  function render() {
    launcher.setAttribute("aria-expanded", String(open))
    // Kedua ikon selalu terpasang; kelas ini yang menukar (dan menganimasikan) keduanya.
    launcher.classList.toggle("open", open)
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
