# Maskot asisten

Maskot slime merah berasal dari `ai_chatbot_slime_mascot_8_gifs_smooth.zip`.
Widget memakai WebP transparan dari `public/maskot/`. Komponennya ada di
`src/components/chat/chat-maskot.tsx` dan dipakai di portal serta panel `/embed`.

| GIF sumber | Pemakaian |
|---|---|
| `idle_blink.gif` | Rotasi tombol portal dan animasi awal tombol sematan |
| `idle_breathing.gif` | Kepala panel saat idle |
| `idle_curious.gif` | Rotasi tombol portal dan kepala panel saat dibuka |
| `idle_wobble.gif` | Rotasi tombol portal, tombol sematan setelah 60 detik idle, dan pembuka percakapan baru |
| `searching_multi_action.gif` | Gelembung selama menunggu jawaban |
| `success.gif` | Jawaban berhasil dan penilaian membantu |
| `no_answer_confused_sad.gif` | Balasan saat chatbot belum menemukan jawaban |
| `sad.gif` | Koneksi terputus, galat, atau penilaian tidak membantu |
| `confused.gif` | Pertanyaan yang ditolak, misalnya di luar topik |

Setiap ekspresi memiliki WebP animasi 128 × 128 dengan jeda frame sesuai GIF
sumber dan versi `-diam.webp` untuk `prefers-reduced-motion`. Reaksi kepala
panel kembali ke idle sesudah diputar.
Saat panel portal tertutup, tombol memilih secara acak satu dari dua ekspresi
idle lainnya setelah durasi animasi yang sedang tampil.
Tombol pada situs penyemat dimuat oleh `public/embed.js` dari asal portal.

## Membuat ulang aset

Ekstrak ZIP dan jalankan dari folder `client` setelah `npm ci` memasang
dependensi Next.js, termasuk Sharp.

```bash
node docs/maskot/buat-maskot.mjs "<folder berisi GIF>"
```

Gunakan durasi yang dicetak skrip untuk memperbarui `DURASI` di
`chat-maskot.tsx`. Naikkan `VERSI_MASKOT` ke nilai yang sama di
`chat-maskot.tsx` dan `public/embed.js` agar peramban memuat berkas baru.
