/*
 * Asisten Administrasi -- skrip sematan untuk situs lain.
 *
 *   <script src="https://<domain-portal>/embed.js" async></script>
 *
 * Satu baris itu memasang tombol "Tanya Asisten" di pojok kanan bawah. Panelnya
 * adalah halaman /embed milik portal yang dimuat dalam iframe, jadi situs
 * penyemat tidak menyalin desain dan tidak memanggil API sendiri: permintaan ke
 * API berangkat dari asal portal, yang sudah terdaftar di CORS_ORIGINS API.
 *
 * Bila EMBED_ALLOWED_ORIGINS portal diisi, situs penyemat harus ada di sana
 * (next.config.ts); kalau tidak, peramban menolak menampilkan iframe-nya.
 *
 * Disajikan apa adanya dari public/, tanpa build step. Berkas ini berjalan di
 * halaman milik orang lain: jangan sentuh apa pun di luar elemennya sendiri.
 */
;(() => {
  "use strict"

  const script = document.currentScript
  // Terpasang dua kali (mis. lewat template dan tag manager): cukup satu tombol.
  if (!script || window.__asistenAdministrasi) return
  window.__asistenAdministrasi = true

  const ASAL = new URL(script.src).origin
  // Harus sama dengan src/components/chat/embedded-chat.tsx.
  const PESAN_BUKA = "asisten:buka"
  const PESAN_TUTUP = "asisten:tutup"

  // Ikon FaComments dan FaTimes (react-icons), sama dengan tombol di portal.
  const IKON_BUKA = svg(
    "0 0 576 512",
    "M416 192c0-88.4-93.1-160-208-160S0 103.6 0 192c0 34.3 14.1 65.9 38 92-13.4 30.2-35.5 54.2-35.8 54.5-2.2 2.3-2.8 5.7-1.5 8.7S4.8 352 8 352c36.6 0 66.9-12.3 88.7-25 32.2 15.7 70.3 25 111.3 25 114.9 0 208-71.6 208-160zm122 220c23.9-26 38-57.7 38-92 0-66.9-53.5-124.2-129.3-148.1.9 6.6 1.3 13.3 1.3 20.1 0 105.9-107.7 192-240 192-10.8 0-21.3-.8-31.7-1.9C207.8 439.6 281.8 480 368 480c41 0 79.1-9.2 111.3-25 21.8 12.7 52.1 25 88.7 25 3.2 0 6.1-1.9 7.3-4.8 1.3-2.9.7-6.3-1.5-8.7-.3-.3-22.4-24.2-35.8-54.5z"
  )
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

      .frame {
        right: 10px;
        left: 10px;
        bottom: 76px;
        width: auto;
        height: calc(100dvh - 88px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .launcher {
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
      iframe.src = `${ASAL}/embed?mode=widget`
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
    if (event.data && event.data.type === PESAN_TUTUP) setOpen(false, true)
  })

  render()
  if (document.body) document.body.append(host)
  else document.addEventListener("DOMContentLoaded", () => document.body.append(host))

  function svg(viewBox, d) {
    return `<svg viewBox="${viewBox}" aria-hidden="true" focusable="false"><path d="${d}"></path></svg>`
  }
})()
