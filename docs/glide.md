# Riset Widget Chatbot Glide

Tanggal pemeriksaan: **16 Oktober 2026**.

Objek riset: widget mengambang di kanan bawah [homepage Glide](https://www.glideapps.com/), pada path `/`, sesuai screenshot yang diberikan pengguna. Pemeriksaan dilakukan melalui browser desktop dengan membuka widget, mengunjungi keempat tab, mencari dan membaca artikel, serta mencoba satu pertanyaan kepada AI.

## Temuan utama

Widget tersebut menggunakan **Intercom Messenger** dengan **Fin AI Agent** sebagai asisten percakapan. Widget menggabungkan chat, daftar percakapan, berita produk, dan pusat bantuan dalam satu panel.

Identitas penyedia dikonfirmasi dari elemen dan script yang dimuat pada halaman:

- Script: `https://widget.intercom.io/widget/rnjf1j5t`.
- Iframe launcher: `intercom-launcher-frame`, berlabel `Buka Intercom Messenger`.
- Iframe panel: `intercom-messenger-frame`, berjudul `Intercom live chat`.
- Pada percakapan, asisten ditampilkan sebagai **Fin** dengan label **AI Agent**.

Temuan ini mengidentifikasi penyedia widget. Implementasi backend, model AI yang digunakan, dan konfigurasi internal Glide tidak diperiksa.

## Struktur dan fitur widget

| Bagian | Isi yang diamati | Hasil pemeriksaan |
|---|---|---|
| Launcher | Tombol mengambang di kanan bawah; berubah menjadi kontrol penutup saat panel terbuka | Berhasil membuka widget |
| Layar utama | Avatar tim, sapaan, tombol `Ngobrol dengan kami`, kartu berita, shortcut resource, dan pencarian bantuan | Berhasil dibuka dan isinya diperiksa |
| Pesan | Daftar percakapan dan tombol memulai chat | Saat pertama dibuka, tampil keadaan kosong: `Tidak ada pesan` |
| Berita | Feed pengumuman dan pembaruan produk | Berhasil dibuka; terdapat kartu seperti `Start with a Spreadsheet`, pembaruan integrasi, dan Data Backups |
| Bantuan | Kolom pencarian dan kategori artikel | Pencarian dan pembacaan artikel berhasil diuji |
| Percakapan | Chat dengan Fin, indikator mengetik, waktu pesan, status dilihat, dan composer pesan | Berhasil mengirim pertanyaan dan menerima jawaban |

### Layar utama

Bagian atas menampilkan avatar anggota tim dan sapaan:

> Hai di sana 👋 Bagaimana kami dapat membantu?

Tombol `Ngobrol dengan kami` menjadi aksi utama. Di bawahnya tersedia kartu berita bergambar, shortcut resource, dan area bantuan dengan artikel yang disarankan.

Shortcut yang ditemukan:

- [Ask the Community](https://community.glideapps.com/c/help-how-to/).
- [Search Glide Docs](https://docs.glideapps.com/).
- [Glide University Lessons](https://learn.glideapps.com/).
- [Hire a Glide Expert](https://glideapps.com/experts).
- [Build an App for Me](https://www.glideapps.com/solutions?utm_source=builder).
- [Refund Policy](https://www.glideapps.com/legal/refunds).

### Pesan dan alur percakapan

Alur yang diuji:

1. Buka launcher di homepage.
2. Pilih `Ngobrol dengan kami`.
3. Fin menampilkan pertanyaan pembuka untuk mengetahui kebutuhan pengunjung.
4. Pengunjung mendapat dua pilihan: `Meet with Sales` dan `Product question`.
5. Pilih `Product question`.
6. Fin memperkenalkan diri sebagai AI agent Glide, lalu menampilkan composer untuk mengetik pertanyaan.

Pilihan `Meet with Sales` terlihat, tetapi alurnya tidak dijalankan. Pada layar awal juga terlihat keterangan `Tim juga dapat membantu`; proses pengalihan ke manusia tidak diuji.

Kontrol dan status yang terlihat di percakapan:

- Tombol kembali ke Pesan, menu pilihan percakapan, dan tombol tutup.
- Bubble pesan pengguna dan asisten.
- Identitas Fin beserta label AI Agent.
- Indikator `Mengetik`, waktu relatif, serta status `Dilihat` dan `Belum dilihat`.
- Composer pesan dengan tombol kirim.
- Tombol unggah lampiran, pemilih emoji, pemilih GIF, dan mulai merekam suara.
- Petunjuk menjatuhkan file atau gambar ke percakapan.

Keberadaan kontrol lampiran, emoji, GIF, dan rekaman suara terkonfirmasi dari UI. Saat pengambilan screenshot lanjutan, pemilih emoji dan GIF berhasil dibuka; pencarian `smile` untuk emoji dan `hello` untuk GIF menampilkan hasil. Pengiriman media dan perekaman suara tidak diuji.

Menu pilihan percakapan juga menyediakan `Perluas jendela`, `Cari percakapan`, dan `Unduh transkrip`. Mode jendela besar dan pencarian kata `Glide` dalam chat berhasil dibuka. Pencarian menampilkan penyorotan, jumlah kecocokan, serta tombol berpindah ke kecocokan berikutnya atau sebelumnya. Unduhan transkrip tidak dijalankan.

Pada pengambilan screenshot lanjutan, percakapan uji muncul kembali setelah homepage dibuka melalui sesi otomasi baru pada profil Chrome yang sama. Tab Pesan menampilkan judul `Informasi Glide` dan cuplikan jawaban, sedangkan Layar utama menampilkan kartu `Pesan terbaru`. Pengamatan ini tidak memastikan perilaku pada browser atau profil lain, maupun durasi penyimpanan riwayat.

### Berita

Tab Berita menampilkan feed yang dapat digulir, dengan judul, ringkasan, gambar pada sejumlah kartu, dan label seperti `New feature` atau `Product update`.

Screenshot pengguna menunjukkan titik notifikasi merah pada ikon Berita. Perilaku penandaan berita sebagai sudah dibaca dan perubahan badge tidak diuji.

### Bantuan

Tab Bantuan menyediakan pencarian artikel serta kategori seperti Getting Started, Accounts and Billing, Data sources, dan Actions & Integrations.

Pengujian yang dilakukan:

1. Ketik `chat` pada kolom `Cari bantuan`.
2. Hasil pencarian muncul dengan judul, cuplikan teks, dan penyorotan kata yang cocok.
3. Buka hasil `What are Glide's support hours?`.
4. Artikel dimuat di dalam widget; halaman utama tetap berada di `/`.

Saat artikel dibuka, panel melebar. Tersedia tombol kembali, kontrol untuk menciutkan jendela, tautan membuka artikel di pusat bantuan, dan pilihan penilaian artikel berupa tiga ekspresi wajah. Penilaian tidak dikirim.

Saat pengambilan screenshot lanjutan, panel artikel juga berhasil diciutkan. Bagian bawah artikel menampilkan artikel terkait. Pencarian dengan kueri acak yang tidak cocok menampilkan keadaan tanpa hasil, pesan `Coba Lagi`, dan tombol `Ngobrol dengan kami`.

## Hasil uji Fin dalam bahasa Indonesia

Pertanyaan yang dikirim:

> Apa itu Glide? Jawab singkat dalam bahasa Indonesia.

Jawaban yang diterima:

> Glide adalah platform yang memungkinkan Anda membuat aplikasi tanpa perlu menulis kode.

Hasil: **Fin berhasil memahami permintaan dan menjawab singkat dalam bahasa Indonesia** pada pengujian ini. Tidak ada pengalihan ke staf manusia dalam alur yang diuji.

Label navigasi dan kontrol widget tampil dalam bahasa Indonesia, sedangkan beberapa sapaan bot, pilihan awal, artikel, dan berita masih menggunakan bahasa Inggris. Penyebab pemilihan bahasa antarmuka tidak diperiksa.

Satu pertanyaan ini belum cukup untuk menyimpulkan kualitas seluruh jawaban, kemampuan mempertahankan konteks percakapan, maupun cakupan dukungan multibahasa.

## Catatan desain dan interaksi

- Panel mengambang di kanan bawah, dengan sudut membulat dan bayangan yang menonjolkan panel dari halaman.
- Layar utama memakai header teal, teks terang, serta avatar tim untuk memberi identitas pada layanan bantuan.
- Isi panel dan navigasi bawah menggunakan warna gelap pada sesi yang diamati.
- Empat tab utama tetap tersedia di bawah saat menjelajah halaman utama widget, Pesan, Berita, dan Bantuan.
- Layar percakapan memiliki header dan composer sendiri; navigasi empat tab tidak tampil pada layar ini.
- Konten panel dapat digulir terpisah dari halaman situs.
- Lebar panel menyesuaikan jenis konten: pada sesi desktop yang diperiksa, panel utama memiliki lebar sekitar **400 CSS px**, sedangkan pembaca artikel melebar menjadi sekitar **688 CSS px**. Ini ukuran pada viewport pengujian, bukan spesifikasi universal.
- Artikel bantuan dapat dibaca tanpa meninggalkan konteks halaman situs.

## Koreksi terhadap pemeriksaan awal

Pemeriksaan pertama menemukan script HubSpot pada homepage, tetapi widget HubSpot disembunyikan oleh server dengan alasan `NO_MATCHING_WELCOME_MESSAGE`. Informasi tersebut **tidak mengidentifikasi widget pada screenshot pengguna**.

Pada sesi browser pertama, Intercom tidak muncul. Ketika diperiksa melalui Chrome langsung, Intercom muncul dan cocok dengan screenshot. Penyebab perbedaan kemunculan Intercom antar-sesi belum dipastikan; respons HubSpot tidak boleh dianggap sebagai penjelasan untuk kondisi Intercom.

Chatbot `Ask AI` di [dokumentasi Glide](https://www.glideapps.com/docs) adalah antarmuka terpisah. Hasil uji chatbot dokumentasi, termasuk penolakan permintaan ringkasan bahasa Indonesia pada pengujian awal, tidak berlaku sebagai penilaian terhadap Fin di homepage.

## Batas pemeriksaan

Riset ini memverifikasi tampilan desktop dan alur yang disebutkan di atas. Hal berikut belum diuji:

- Tampilan mobile, breakpoint responsif, navigasi keyboard menyeluruh, dan aksesibilitas pembaca layar.
- Alur sales, pengalihan ke manusia, waktu respons staf, dan penyelesaian tiket.
- Pengiriman lampiran, GIF, emoji, serta perekaman atau pengiriman suara.
- Penyimpanan riwayat setelah reload, berpindah halaman, berganti profil/browser, atau setelah periode waktu tertentu. Kemunculan kembali pada sesi otomasi baru di profil yang sama telah diamati sebagaimana dicatat di bagian Pesan.
- Ketepatan jawaban untuk pertanyaan kompleks dan percakapan lanjutan.
- Performa pemuatan, ukuran bundle, biaya, model AI, retensi data, dan pengaturan internal penyedia.

Sumber utama adalah pengamatan langsung pada [homepage Glide](https://www.glideapps.com/) dan widget Intercom yang dimuat di sana, ditambah screenshot yang diberikan pengguna. Isi berita, artikel, label, dan konfigurasi widget dapat berubah setelah tanggal pemeriksaan.


## Arsip screenshot

Tersedia **28 screenshot PNG** di [glide-screenshots/](glide-screenshots/), dikumpulkan pada 16 Oktober 2026. Gambar 00 berasal dari screenshot pengguna; gambar 15 dan 17 disalin dari capture pengujian sebelumnya pada hari yang sama. Gambar lainnya diambil saat pengarsipan ini.

Capture disimpan tanpa mengubah isi gambar. Screenshot browser mempertahankan konteks homepage di belakang widget; perbedaan gambar hero berasal dari animasi halaman. Nomor file merupakan identitas arsip, bukan urutan waktu seluruh interaksi.

Arsip mencakup keadaan UI desktop yang berhasil diperiksa. Keadaan Pesan kosong pada pengujian awal tidak sempat disimpan sebagai screenshot; pada pengarsipan ini riwayat uji sudah tersedia. Tampilan mobile, alur sales, handoff manusia, izin mikrofon, dan pengiriman media tidak termasuk dalam arsip ini.

### Indeks gambar

| Screenshot | Isi |
|---|---|
| [00 — Referensi pengguna](glide-screenshots/00-referensi-pengguna.png) | Screenshot awal dari pengguna; layar utama sebelum riwayat percakapan ditampilkan. |
| [01 — Launcher tertutup](glide-screenshots/01-launcher.png) | Homepage dengan tombol pembuka Intercom di kanan bawah. |
| [02 — Layar utama](glide-screenshots/02-layar-utama.png) | Header teal, avatar, kartu pesan terbaru, dan tombol mulai chat. |
| [03 — Layar utama: berita dan resource](glide-screenshots/03-layar-utama-resource.png) | Bagian tengah setelah digulir: kartu berita dan shortcut resource. |
| [04 — Layar utama: bantuan](glide-screenshots/04-layar-utama-bantuan.png) | Shortcut lengkap, pencarian bantuan, dan artikel yang disarankan. |
| [05 — Riwayat pesan](glide-screenshots/05-pesan-riwayat.png) | Percakapan uji sebelumnya dengan judul Informasi Glide dan cuplikan jawaban. |
| [06 — Berita terbaru](glide-screenshots/06-berita-terbaru.png) | Bagian atas feed berita. |
| [07 — Pembaruan produk](glide-screenshots/07-berita-pembaruan.png) | Feed berita setelah digulir. |
| [08 — Detail berita](glide-screenshots/08-detail-berita.png) | Gambar utama dan judul Start with a Spreadsheet dalam panel lebar. |
| [09 — Kategori bantuan](glide-screenshots/09-bantuan-kategori.png) | Pencarian dan daftar kategori artikel. |
| [10 — Koleksi Getting Started](glide-screenshots/10-bantuan-koleksi.png) | Daftar artikel dalam satu kategori. |
| [11 — Hasil pencarian bantuan](glide-screenshots/11-bantuan-hasil-pencarian.png) | Hasil pencarian chat dengan judul dan cuplikan teks. |
| [12 — Artikel dalam panel lebar](glide-screenshots/12-artikel-lebar.png) | Bagian awal artikel What are Glide's support hours?. |
| [13 — Artikel terkait dan feedback](glide-screenshots/13-artikel-feedback.png) | Bagian bawah artikel, tiga pilihan penilaian, dan tautan ke pusat bantuan. |
| [14 — Artikel dalam panel ringkas](glide-screenshots/14-artikel-ringkas.png) | Artikel yang sama setelah jendela diciutkan. |
| [15 — Pilihan awal Fin](glide-screenshots/15-fin-pilihan-awal.png) | Sapaan awal serta pilihan Meet with Sales dan Product question; capture dari pengujian sebelumnya. |
| [16 — Sapaan dan composer Fin](glide-screenshots/16-fin-sapaan-composer.png) | Layar setelah memilih Product question, dengan sapaan AI dan composer kosong. |
| [17 — Jawaban Fin dalam bahasa Indonesia](glide-screenshots/17-fin-jawaban-indonesia.png) | Pertanyaan dan jawaban uji; capture dari pengujian sebelumnya. |
| [18 — Menu percakapan](glide-screenshots/18-fin-menu-percakapan.png) | Opsi memperluas jendela, mencari percakapan, dan mengunduh transkrip. |
| [19 — Pemilih emoji](glide-screenshots/19-fin-pemilih-emoji.png) | Popover emoji dengan kategori dan kolom pencarian. |
| [20 — Pemilih GIF](glide-screenshots/20-fin-pemilih-gif.png) | Popover GIF dengan thumbnail dan kolom pencarian. |
| [21 — Pencarian GIF](glide-screenshots/21-fin-pencarian-gif.png) | Hasil pencarian GIF untuk hello; tidak ada GIF yang dikirim. |
| [22 — Isi detail berita](glide-screenshots/22-detail-berita-bawah.png) | Bagian lanjutan berita setelah digulir. |
| [23 — Isi lanjutan artikel](glide-screenshots/23-artikel-isi-lanjutan.png) | Bagian tengah artikel bantuan. |
| [24 — Pencarian tanpa hasil](glide-screenshots/24-pencarian-tanpa-hasil.png) | Keadaan kosong untuk kueri qzxjkvbnm984756231, dengan pesan Coba Lagi dan tombol mulai chat. |
| [25 — Percakapan diperbesar](glide-screenshots/25-fin-jendela-besar.png) | Percakapan uji dalam panel lebar. |
| [26 — Pencarian percakapan](glide-screenshots/26-fin-cari-percakapan.png) | Pencarian Glide di dalam chat, dengan penyorotan dan navigasi kecocokan. |
| [27 — Pencarian emoji](glide-screenshots/27-fin-pencarian-emoji.png) | Hasil pencarian smile; tidak ada emoji yang dikirim. |

### Galeri

Buka kelompok di bawah untuk melihat gambar langsung. Tautan pada indeks dapat digunakan bila penampil Markdown tidak mendukung elemen detail.

<details>
<summary>Referensi dan navigasi utama</summary>

**00. Referensi pengguna** — Screenshot awal dari pengguna; layar utama sebelum riwayat percakapan ditampilkan.

![Referensi pengguna](glide-screenshots/00-referensi-pengguna.png)

**01. Launcher tertutup** — Homepage dengan tombol pembuka Intercom di kanan bawah.

![Launcher tertutup](glide-screenshots/01-launcher.png)

**02. Layar utama** — Header teal, avatar, kartu pesan terbaru, dan tombol mulai chat.

![Layar utama](glide-screenshots/02-layar-utama.png)

**03. Layar utama: berita dan resource** — Bagian tengah setelah digulir: kartu berita dan shortcut resource.

![Layar utama: berita dan resource](glide-screenshots/03-layar-utama-resource.png)

**04. Layar utama: bantuan** — Shortcut lengkap, pencarian bantuan, dan artikel yang disarankan.

![Layar utama: bantuan](glide-screenshots/04-layar-utama-bantuan.png)

**05. Riwayat pesan** — Percakapan uji sebelumnya dengan judul Informasi Glide dan cuplikan jawaban.

![Riwayat pesan](glide-screenshots/05-pesan-riwayat.png)

</details>

<details>
<summary>Berita</summary>

**06. Berita terbaru** — Bagian atas feed berita.

![Berita terbaru](glide-screenshots/06-berita-terbaru.png)

**07. Pembaruan produk** — Feed berita setelah digulir.

![Pembaruan produk](glide-screenshots/07-berita-pembaruan.png)

**08. Detail berita** — Gambar utama dan judul Start with a Spreadsheet dalam panel lebar.

![Detail berita](glide-screenshots/08-detail-berita.png)

**22. Isi detail berita** — Bagian lanjutan berita setelah digulir.

![Isi detail berita](glide-screenshots/22-detail-berita-bawah.png)

</details>

<details>
<summary>Bantuan dan artikel</summary>

**09. Kategori bantuan** — Pencarian dan daftar kategori artikel.

![Kategori bantuan](glide-screenshots/09-bantuan-kategori.png)

**10. Koleksi Getting Started** — Daftar artikel dalam satu kategori.

![Koleksi Getting Started](glide-screenshots/10-bantuan-koleksi.png)

**11. Hasil pencarian bantuan** — Hasil pencarian chat dengan judul dan cuplikan teks.

![Hasil pencarian bantuan](glide-screenshots/11-bantuan-hasil-pencarian.png)

**12. Artikel dalam panel lebar** — Bagian awal artikel What are Glide's support hours?.

![Artikel dalam panel lebar](glide-screenshots/12-artikel-lebar.png)

**13. Artikel terkait dan feedback** — Bagian bawah artikel, tiga pilihan penilaian, dan tautan ke pusat bantuan.

![Artikel terkait dan feedback](glide-screenshots/13-artikel-feedback.png)

**14. Artikel dalam panel ringkas** — Artikel yang sama setelah jendela diciutkan.

![Artikel dalam panel ringkas](glide-screenshots/14-artikel-ringkas.png)

**23. Isi lanjutan artikel** — Bagian tengah artikel bantuan.

![Isi lanjutan artikel](glide-screenshots/23-artikel-isi-lanjutan.png)

**24. Pencarian tanpa hasil** — Keadaan kosong untuk kueri qzxjkvbnm984756231, dengan pesan Coba Lagi dan tombol mulai chat.

![Pencarian tanpa hasil](glide-screenshots/24-pencarian-tanpa-hasil.png)

</details>

<details>
<summary>Fin dan percakapan</summary>

**15. Pilihan awal Fin** — Sapaan awal serta pilihan Meet with Sales dan Product question; capture dari pengujian sebelumnya.

![Pilihan awal Fin](glide-screenshots/15-fin-pilihan-awal.png)

**16. Sapaan dan composer Fin** — Layar setelah memilih Product question, dengan sapaan AI dan composer kosong.

![Sapaan dan composer Fin](glide-screenshots/16-fin-sapaan-composer.png)

**17. Jawaban Fin dalam bahasa Indonesia** — Pertanyaan dan jawaban uji; capture dari pengujian sebelumnya.

![Jawaban Fin dalam bahasa Indonesia](glide-screenshots/17-fin-jawaban-indonesia.png)

**18. Menu percakapan** — Opsi memperluas jendela, mencari percakapan, dan mengunduh transkrip.

![Menu percakapan](glide-screenshots/18-fin-menu-percakapan.png)

**25. Percakapan diperbesar** — Percakapan uji dalam panel lebar.

![Percakapan diperbesar](glide-screenshots/25-fin-jendela-besar.png)

**26. Pencarian percakapan** — Pencarian Glide di dalam chat, dengan penyorotan dan navigasi kecocokan.

![Pencarian percakapan](glide-screenshots/26-fin-cari-percakapan.png)

</details>

<details>
<summary>Emoji dan GIF</summary>

**19. Pemilih emoji** — Popover emoji dengan kategori dan kolom pencarian.

![Pemilih emoji](glide-screenshots/19-fin-pemilih-emoji.png)

**20. Pemilih GIF** — Popover GIF dengan thumbnail dan kolom pencarian.

![Pemilih GIF](glide-screenshots/20-fin-pemilih-gif.png)

**21. Pencarian GIF** — Hasil pencarian GIF untuk hello; tidak ada GIF yang dikirim.

![Pencarian GIF](glide-screenshots/21-fin-pencarian-gif.png)

**27. Pencarian emoji** — Hasil pencarian smile; tidak ada emoji yang dikirim.

![Pencarian emoji](glide-screenshots/27-fin-pencarian-emoji.png)

</details>
