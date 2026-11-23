/*
 * Membuat aset maskot widget (public/maskot/*.webp) dari GIF asli.
 *
 *   node docs/maskot/buat-maskot.mjs <folder GIF per_ekspresi> [folder keluaran]
 *
 * Keluaran bawaan: public/maskot. Butuh ffmpeg (dengan libwebp) di PATH; tanpa
 * paket npm. Sesudahnya naikkan VERSI_MASKOT di chat-maskot.tsx dan embed.js. Asal-usul, ekspresi, dan alasan setiap langkah ada di README.md
 * di folder ini.
 *
 * GIF aslinya 512x512, 25 fps, 3 detik, dengan latar biru tua (#11141C) yang
 * menyatu dengan gambar. Setiap frame:
 *   1. Latar dicari dengan flood fill dari tepi gambar lewat piksel yang
 *      warnanya dekat latar. Mata maskot hampir sewarna latar (#16181D), jadi
 *      tidak bisa dibuang dengan colorkey biasa; flood fill tidak sampai ke
 *      sana karena mata dikelilingi badan putih.
 *   2. Piksel latar dan pita 2 px di sekitarnya dijadikan transparan dengan
 *      "color to alpha" terhadap warna latar, supaya tepi halus (anti-alias),
 *      huruf zzz, dan garis gerak tetap halus, bukan bergerigi.
 *   3. Bayangan elips di bawah badan (lebih gelap dari latar) dijadikan
 *      bayangan abu tipis; di latar putih bayangan sepekat aslinya terlalu berat.
 *   4. Garis tepi gelap #171717 (sama dengan logo balon) di sekeliling semua
 *      bagian terang, supaya maskot putih tetap terlihat di panel putih.
 *   5. Semua ekspresi dipotong dengan kotak yang sama (badan tidak bergeser
 *      saat ekspresi berganti), diperkecil ke 128 px dan 12,5 fps, lalu
 *      disimpan sebagai WebP animasi
 *      plus satu frame diam untuk `prefers-reduced-motion`.
 */
import { execFileSync } from "node:child_process"
import { mkdirSync } from "node:fs"
import path from "node:path"

// [nama keluaran, berkas GIF, frame untuk versi diam]
// Sengaja tidak dipakai: `09_like_dislike.gif` (isinya sudah ada di
// `bonus_like` dan `bonus_dislike`) dan `04_curiga.gif` (lihat README.md).
const EKSPRESI = [
  ["netral", "01_netral.gif", 0],
  ["ngantuk", "02_ngantuk.gif", 0],
  ["dapat-ide", "03_dapat_ide.gif", 60],
  ["bingung", "05_bingung.gif", 18],
  ["senang", "06_senang.gif", 0],
  ["melambai", "07_melambai.gif", 20],
  ["pusing", "08_pusing.gif", 0],
  ["selamat-tinggal", "10_selamat_tinggal.gif", 27],
  ["bonus-like", "bonus_like.gif", 20],
  ["bonus-dislike", "bonus_dislike.gif", 20],
]

const SISI = 512
const LATAR = [17, 20, 28]
const DEKAT_LATAR = 24 // selisih kanal terbesar yang masih dianggap latar
const PITA_TEPI = 2 // px di sekitar latar yang ikut di-"color to alpha"
const GARIS = [23, 23, 23] // #171717, warna garis logo balon
const TEBAL_GARIS = 9 // px pada ukuran 512
const BAYANGAN = [16, 24, 40] // warna bayangan panel (rgba(16, 24, 40, ...))
const KEKUATAN_BAYANGAN = 0.45
const UKURAN = 128 // px keluaran; tampil paling besar 64 px (2x)
// Setiap frame mengubah seluruh badan, jadi WebP tidak bisa menghemat lewat
// selisih antarframe: ukuran berkas sebanding jumlah frame. 12,5 fps masih
// halus untuk gerakan selambat ini dan memangkas ukurannya separuh.
const LANGKAH_FRAME = 2
const KUALITAS = 70

const [, , folderGif, folderKeluar = path.join(import.meta.dirname, "..", "..", "public", "maskot")] =
  process.argv
if (!folderGif) {
  console.error("Pakai: node docs/maskot/buat-maskot.mjs <folder GIF> [folder keluaran]")
  process.exit(1)
}

function bacaFrame(berkas) {
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", berkas, "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
    { maxBuffer: 1 << 30 }
  )
  const ukuranFrame = SISI * SISI * 4
  const frames = []
  for (let o = 0; o + ukuranFrame <= raw.length; o += ukuranFrame) {
    frames.push(raw.subarray(o, o + ukuranFrame))
  }
  return frames
}

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

/** Transformasi jarak Euclid 1D (Felzenszwalb-Huttenlocher), kuadrat jarak. */
function edt1d(f, n, d, v, z) {
  let k = 0
  v[0] = 0
  z[0] = -Infinity
  z[1] = Infinity
  for (let q = 1; q < n; q++) {
    let s
    for (;;) {
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      if (s <= z[k]) k--
      else break
    }
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = Infinity
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
}

/** Jarak (px) setiap piksel ke piksel `mask` terdekat. */
function jarakKe(mask) {
  const INF = 1e12
  const g = new Float64Array(SISI * SISI)
  const f = new Float64Array(SISI)
  const d = new Float64Array(SISI)
  const v = new Int32Array(SISI)
  const z = new Float64Array(SISI + 1)
  for (let x = 0; x < SISI; x++) {
    for (let y = 0; y < SISI; y++) f[y] = mask[y * SISI + x] ? 0 : INF
    edt1d(f, SISI, d, v, z)
    for (let y = 0; y < SISI; y++) g[y * SISI + x] = d[y]
  }
  const hasil = new Float64Array(SISI * SISI)
  for (let y = 0; y < SISI; y++) {
    for (let x = 0; x < SISI; x++) f[x] = g[y * SISI + x]
    edt1d(f, SISI, d, v, z)
    for (let x = 0; x < SISI; x++) hasil[y * SISI + x] = Math.sqrt(d[x])
  }
  return hasil
}

/** Satu frame GIF -> RGBA transparan bergaris tepi (Float32, 0..1). */
function olahFrame(px) {
  const N = SISI * SISI
  // 1. Latar: flood fill dari tepi lewat piksel yang dekat warna latar.
  const dekat = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]
    dekat[i] =
      Math.max(Math.abs(r - LATAR[0]), Math.abs(g - LATAR[1]), Math.abs(b - LATAR[2])) <= DEKAT_LATAR
        ? 1
        : 0
  }
  const latar = new Uint8Array(N)
  const antre = new Int32Array(N)
  let kepala = 0, ekor = 0
  const masuk = (i) => {
    if (dekat[i] && !latar[i]) {
      latar[i] = 1
      antre[ekor++] = i
    }
  }
  for (let t = 0; t < SISI; t++) {
    masuk(t)
    masuk((SISI - 1) * SISI + t)
    masuk(t * SISI)
    masuk(t * SISI + SISI - 1)
  }
  while (kepala < ekor) {
    const i = antre[kepala++]
    const x = i % SISI, y = (i / SISI) | 0
    if (x > 0) masuk(i - 1)
    if (x < SISI - 1) masuk(i + 1)
    if (y > 0) masuk(i - SISI)
    if (y < SISI - 1) masuk(i + SISI)
  }

  // 2-3. Latar + pita tepi: color to alpha; selebihnya utuh dan pekat.
  const jarakLatar = jarakKe(latar)
  const a = new Float32Array(N)
  const fg = new Float32Array(N * 3)
  const terang = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    const p = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]
    if (jarakLatar[i] > PITA_TEPI) {
      a[i] = 1
      fg.set(p, i * 3)
      terang[i] = 1
      continue
    }
    let alfa = 0
    for (let c = 0; c < 3; c++) {
      const s = p[c] - LATAR[c]
      const ac = s > 0 ? s / (255 - LATAR[c]) : s < 0 ? -s / LATAR[c] : 0
      if (ac > alfa) alfa = ac
    }
    if (alfa < 0.03) continue
    const warna = p.map((v, c) => Math.min(255, Math.max(0, LATAR[c] + (v - LATAR[c]) / alfa)))
    if (luma(...warna) < 60) {
      // Bayangan (lebih gelap dari latar).
      a[i] = alfa * KEKUATAN_BAYANGAN
      fg.set(BAYANGAN, i * 3)
    } else {
      a[i] = alfa
      fg.set(warna, i * 3)
      if (alfa >= 0.3) terang[i] = 1
    }
  }

  // 4. Garis tepi di bawah semua bagian terang (bukan bayangan).
  const jarakTerang = jarakKe(terang)
  const out = new Float32Array(N * 4)
  for (let i = 0; i < N; i++) {
    const o = Math.min(1, Math.max(0, TEBAL_GARIS + 0.5 - jarakTerang[i]))
    const ai = a[i]
    const ao = ai + o * (1 - ai)
    out[i * 4 + 3] = ao
    for (let c = 0; c < 3; c++) {
      // Piksel transparan diberi warna garis: tepi tidak berpendar saat diperkecil.
      out[i * 4 + c] = ao > 0 ? (fg[i * 3 + c] * ai + GARIS[c] * o * (1 - ai)) / ao : GARIS[c]
    }
  }
  return out
}

function kotakIsi(frames, kotak) {
  for (const f of frames) {
    for (let y = 0; y < SISI; y++) {
      for (let x = 0; x < SISI; x++) {
        if (f[(y * SISI + x) * 4 + 3] > 0.02) {
          if (x < kotak.x0) kotak.x0 = x
          if (x > kotak.x1) kotak.x1 = x
          if (y < kotak.y0) kotak.y0 = y
          if (y > kotak.y1) kotak.y1 = y
        }
      }
    }
  }
}

function potong(f, { x, y, sisi }) {
  const buf = Buffer.alloc(sisi * sisi * 4)
  for (let yy = 0; yy < sisi; yy++) {
    for (let xx = 0; xx < sisi; xx++) {
      const sx = x + xx, sy = y + yy
      const o = (yy * sisi + xx) * 4
      if (sx < 0 || sy < 0 || sx >= SISI || sy >= SISI) {
        buf[o] = GARIS[0]
        buf[o + 1] = GARIS[1]
        buf[o + 2] = GARIS[2]
        continue
      }
      const i = (sy * SISI + sx) * 4
      for (let c = 0; c < 4; c++) buf[o + c] = Math.round(f[i + c] * (c === 3 ? 255 : 1))
    }
  }
  return buf
}

function tulisWebp(buf, sisi, keluar, animasi) {
  execFileSync(
    "ffmpeg",
    [
      "-v", "error", "-y",
      "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${sisi}x${sisi}`, "-framerate", String(25 / LANGKAH_FRAME), "-i", "-",
      "-vf", `scale=${UKURAN}:${UKURAN}:flags=area`,
      ...(animasi
        ? ["-c:v", "libwebp_anim", "-loop", "0"]
        : ["-c:v", "libwebp", "-frames:v", "1"]),
      "-pix_fmt", "yuva420p", "-quality", String(KUALITAS), "-compression_level", "6",
      keluar,
    ],
    { input: buf, maxBuffer: 1 << 30 }
  )
}

const hasil = []
const kotak = { x0: SISI, y0: SISI, x1: -1, y1: -1 }
for (const [nama, berkas, frameDiam] of EKSPRESI) {
  const frames = bacaFrame(path.join(folderGif, berkas)).map(olahFrame)
  kotakIsi(frames, kotak)
  hasil.push({ nama, frames, frameDiam })
  console.log(`${nama}: ${frames.length} frame`)
}

// 5. Satu kotak persegi untuk semua ekspresi, berpusat di tengah isi.
const jarak = 6
const sisi = Math.max(kotak.x1 - kotak.x0, kotak.y1 - kotak.y0) + 1 + jarak * 2
const potongan = {
  x: Math.round((kotak.x0 + kotak.x1) / 2 - sisi / 2),
  y: Math.round((kotak.y0 + kotak.y1) / 2 - sisi / 2),
  sisi,
}
console.log("isi", kotak, "potongan", potongan)

mkdirSync(folderKeluar, { recursive: true })
for (const { nama, frames, frameDiam } of hasil) {
  const dipakai = frames.filter((_, i) => i % LANGKAH_FRAME === 0)
  const semua = Buffer.concat(dipakai.map((f) => potong(f, potongan)))
  tulisWebp(semua, sisi, path.join(folderKeluar, `${nama}.webp`), true)
  tulisWebp(potong(frames[frameDiam], potongan), sisi, path.join(folderKeluar, `${nama}-diam.webp`), false)
}
console.log("selesai:", folderKeluar)
