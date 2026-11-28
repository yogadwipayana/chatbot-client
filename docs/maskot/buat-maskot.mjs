import { mkdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const EKSPRESI = [
  "idle_breathing",
  "idle_blink",
  "idle_curious",
  "idle_wobble",
  "searching_multi_action",
  "confused",
  "no_answer_confused_sad",
  "sad",
  "success",
]

const UKURAN = 128
const UBAH_UKURAN = { fit: "contain", background: "transparent" }
const WEBP = { quality: 78, alphaQuality: 100, effort: 5 }
const [folderGif, folderKeluar = path.resolve(import.meta.dirname, "../../public/maskot")] =
  process.argv.slice(2)

if (!folderGif) {
  console.error("Pakai: node docs/maskot/buat-maskot.mjs <folder GIF> [folder keluaran]")
  process.exit(1)
}

await mkdir(folderKeluar, { recursive: true })

for (const ekspresi of EKSPRESI) {
  const masukan = path.join(folderGif, `${ekspresi}.gif`)
  const nama = ekspresi.replaceAll("_", "-")
  const animasi = sharp(masukan, { animated: true })
  const { pages, delay } = await animasi.metadata()
  if (!pages || pages < 2 || delay?.length !== pages) {
    throw new Error(`${ekspresi}.gif harus berisi animasi dengan durasi per frame`)
  }

  await animasi
    .resize(UKURAN, UKURAN, UBAH_UKURAN)
    .webp({ ...WEBP, delay, loop: 0 })
    .toFile(path.join(folderKeluar, `${nama}.webp`))

  await sharp(masukan, { page: Math.floor(pages / 2) })
    .resize(UKURAN, UKURAN, UBAH_UKURAN)
    .webp(WEBP)
    .toFile(path.join(folderKeluar, `${nama}-diam.webp`))

  console.log(`${nama}: ${delay.reduce((total, ms) => total + ms, 0)} ms`)
}
