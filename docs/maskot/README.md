# Maskot asisten

Gumpalan putih yang menggantikan logo balon di widget asisten (portal, `/embed`,
dan tombol `embed.js`) sejak 2026-11-23. Komponennya
`src/components/chat/chat-maskot.tsx`; asetnya `public/maskot/`.

## Asal

Set GIF "maskot putih set 2, per ekspresi" dari user (2026-11-23): 12 GIF
512x512, 25 fps, 3 detik, berlatar biru tua #11141C yang menyatu dengan
gambar. GIF aslinya tidak disimpan di repo (4,3 MB); yang disimpan hasil
olahannya dan skrip pembuatnya.

Di percakapan maskot hanya ada di gelembung menunggu jawaban. Situasi jawaban
lainnya ditunjukkan maskot di kepala panel, yang berganti lalu kembali netral
(keputusan user 2026-11-23). Pemicunya ada di `ChatPanel` (`picu`) dan
`ekspresiBalasan` di `chat-maskot.tsx`.

| Berkas asli | Nama | Di mana |
|---|---|---|
| `01_netral.gif` | `netral` | tombol pembuka; kepala panel bila tidak ada reaksi; kepala "asisten tidak tersedia" |
| `02_ngantuk.gif` | `ngantuk` | tombol pembuka yang 60 detik tidak disentuh (panel tertutup, tidak diarahkan, tidak difokus); bangun saat diarahkan atau difokus |
| `03_dapat_ide.gif` | `dapat-ide` | gelembung menunggu jawaban (ganti tiga titik); satu-satunya maskot di percakapan |
| `05_bingung.gif` | `bingung` | kepala panel, dua putaran setelah balasan "Belum terjawab" (`refusal`) atau yang dihentikan Laya (`rejected`) |
| `06_senang.gif` | `senang` | kepala panel, dua putaran setelah basa-basi (`smalltalk`, mis. "terima kasih") |
| `07_melambai.gif` | `melambai` | kepala panel, satu putaran setiap panel dibuka dan setelah "selamat tinggal" |
| `08_pusing.gif` | `pusing` | kepala panel, dua putaran setelah galat atau jawaban yang koneksinya terputus |
| `10_selamat_tinggal.gif` | `selamat-tinggal` | kepala panel, satu putaran setelah "Percakapan baru" dikonfirmasi |
| `bonus_like.gif` | `bonus-like` | kepala panel, satu putaran setelah 👍 |
| `bonus_dislike.gif` | `bonus-dislike` | kepala panel, satu putaran setelah 👎 |
| `04_curiga.gif` | -- | sengaja tidak dipakai, lihat di bawah |
| `09_like_dislike.gif` | -- | tidak dipakai (keputusan user): isinya sudah ada di `bonus_like` dan `bonus_dislike` |

Pertanyaan baru (menunggu jawaban) mengembalikan kepala panel ke netral, begitu
pula jawaban dokumen biasa (keputusan user: wajah senang di atas kabar buruk
seperti tunggakan atau sanksi terasa janggal), balasan dukungan ("Ada yang siap membantu", mahasiswa yang sedang
tertekan) dan jawaban yang dihentikan.

Jangan pakai `curiga` untuk balasan yang ditolak Laya: gerbangnya bisa salah
menolak pertanyaan yang wajar, dan mahasiswanya akan merasa dituduh.

## Membuat ulang atau menambah ekspresi

```bash
node docs/maskot/buat-maskot.mjs "<folder per_ekspresi>"
```

Butuh ffmpeg dengan libwebp di PATH. **Setelah menjalankannya, naikkan
`VERSI_MASKOT`** di `src/components/chat/chat-maskot.tsx` dan `public/embed.js`
(nilainya harus sama): `/maskot/*` disimpan peramban dan CDN seminggu
(`next.config.ts`), dan versi di URL-nya yang memaksa aset baru diunduh. Untuk menambah ekspresi, tambahkan
barisnya di `EKSPRESI` (nama keluaran, berkas GIF, frame untuk versi diam) dan
di tipe `Ekspresi` di `chat-maskot.tsx`. Semua ekspresi dipotong dengan kotak
yang sama, jadi jalankan ulang untuk semuanya sekaligus. Kotaknya bisa melebar
bila ekspresi baru punya hiasan yang lebih jauh dari badan; ukur ulang badannya
lalu sesuaikan ukuran di CSS (bagian berikut).

Yang dilakukan skrip (rinciannya di komentar skrip):

- Latarnya dibuang dengan flood fill dari tepi gambar. Mata maskot hampir
  sewarna latar, jadi tidak bisa memakai colorkey biasa.
- Tepi halus dibuat transparan dengan "color to alpha". Bayangan dan lubang
  "selamat tinggal" (lebih gelap dari latar) diperingan supaya tidak terlalu
  pekat di latar putih.
- Ditambah garis tepi #171717 setebal 9 px (pada 512 px), sama dengan garis
  logo balon. Tanpa garis ini maskot putih hilang di panel putih.
- Hasilnya 128 px dengan 12,5 fps: WebP animasi (45–67 KB) dan satu frame
  diam (1–2 KB) untuk `prefers-reduced-motion`.

## Ukuran dan posisi

Kotak potongannya 494 px dari GIF 512 px (melebar karena lubang "selamat
tinggal"). Badan netral menempati x 20–104 dan y 54–110 dari 128 px: lebarnya
66% gambar, pusatnya di 49% x 65%. Ukuran tampil dipilih supaya badannya
kira-kira 33 px di tombol dan kepala panel, dan 30 px di gelembung menunggu:

| Kelas (`chat.module.css`) | Ukuran | Tempat |
|---|---|---|
| `.maskotTengah` | 50 px, `translate(1px, -7px)` | tombol pembuka dan kepala panel; badannya yang ditengahkan, bukan gambarnya. Salinannya `.launcher .maskot` di `public/embed.js` |
| `.maskotGelembung` | 45 px | gelembung menunggu |

## Situs penyemat

Panel di situs lain adalah halaman `/embed` portal di dalam iframe, jadi
maskot di panel ikut tampil tanpa disalin. Tombolnya digambar `embed.js` di
halaman penyemat, jadi `embed.js` memuat `netral.webp` (dan `ngantuk.webp`
setelah 60 detik) sendiri dari asal portal, dan hanya memantau tombolnya sendiri
untuk mengantuk/bangun (`aturMaskot`). Bila situs itu menolak gambarnya (CSP
`img-src` tanpa domain portal), tombolnya memakai logo balon (`LOGO` di
`embed.js`). Berkas berekstensi tidak melewati `src/proxy.ts`, sehingga
`/maskot/*.webp` bisa dimuat tanpa cookie Sign In.
