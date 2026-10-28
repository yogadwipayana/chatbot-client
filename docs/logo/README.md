# Logo chatbot

Logo dipakai di empat tempat:

- **Ikon tab peramban** admin dan client: `src/app/icon.svg` dan `src/app/favicon.ico` di masing-masing app. Next.js memasangnya otomatis.
- **Logo admin** (sidebar dan halaman login `/masuk`, termasuk kepala widget contoh di sebelah formulir): komponen `AppLogo` di `admin/src/components/layout/app-logo.tsx`.
- **Logo widget chatbot** (kepala panel di portal dan di `/embed`): komponen `ChatLogo` di `client/src/components/chat/chat-logo.tsx`, sejak `balon-bayangan`.
- **Tombol pembuka widget** (bulat, ikon saja): `ChatLogo` ukuran 24 di tombol portal, dan salinannya (`BALON` + `IKON_BUKA`) di `client/public/embed.js` untuk situs penyemat, karena berkas itu tanpa build step dan tidak bisa mengimpor komponen.

Semua logo hitam putih (keputusan user 2026-10-23). File `.svg` berganti warna sendiri saat peramban memakai mode gelap. File `.ico` adalah cadangan untuk peramban lama dan tidak punya mode gelap. Logo di sidebar memakai warna `primary` tema, jadi ikut terbalik di mode gelap.

| File | Bentuk | Status |
|---|---|---|
| `balon-bayangan.svg` / `.ico` | Balon obrolan putih bergaris tebal dengan bayangan padat (gaya neo-brutalis) dan dua baris teks | **Dipakai** sejak 2026-10-23 |
| `balon-a.svg` / `.ico` | Huruf A tebal (Asisten Administrasi) yang dilubangi dari balon obrolan padat | Arsip (2026-10-23) |
| `balon-piksel.svg` / `.ico` | Balon obrolan bergaya piksel (16×16) dengan wajah bot | Arsip (2026-10-23) |
| `balon-wajah.svg` / `.ico` | Balon obrolan bergaris (gaya garis tunggal) dengan wajah tersenyum | Arsip (2026-10-23) |
| `balon-bintang.svg` / `.ico` | Balon obrolan padat dengan bintang (asisten AI) yang dilubangi, tanpa kotak latar | Arsip (2026-10-23) |
| `topi-balon.svg` / `.ico` | Topi wisuda yang bagian bawahnya menjadi balon obrolan, di dalam kotak bersudut bulat | Arsip (2026-10-23) |

## Mengganti logo

1. Salin `<nama>.svg` ke `admin/src/app/icon.svg` dan `client/src/app/icon.svg`.
2. Salin `<nama>.ico` ke `admin/src/app/favicon.ico` dan `client/src/app/favicon.ico`.
3. Ganti isi `<svg>` di `AppLogo` dengan bentuk yang sama, termasuk `viewBox` (logo piksel `0 0 16 16` dengan `shapeRendering="crispEdges"`, logo lain `0 0 32 32` tanpa atribut itu). Pakai kelas `fill-primary`/`stroke-primary` untuk warna gelap dan `fill-primary-foreground`/`stroke-primary-foreground` untuk warna terang; jangan pakai warna tetap.
4. Ganti juga isi `<svg>` di `ChatLogo` dan salinannya di `public/embed.js` (`BALON`, `IKON_BUKA`). Kepala panel widget berwarna merah dan tidak punya mode gelap, jadi di sana pakai warna tetap `#171717` dan `#fff` (versi terang logo), bukan kelas tema.
5. Muat ulang tab dengan Ctrl+F5, karena peramban menyimpan ikon tab di cache.

Isi `<svg>` untuk `AppLogo` versi `balon-a`:

```tsx
      <path
        className="fill-primary"
        fillRule="evenodd"
        d="M16 2.5a13 13 0 0 1 0 26c-1.6 0-3.2-.3-4.6-.8L5.6 30c-.8.3-1.6-.4-1.3-1.2l1.8-5.2A13 13 0 0 1 16 2.5zm0 5.5-6.6 15h3.4l1.1-2.7h4.2l1.1 2.7h3.4zm0 6.1 1.2 3.4h-2.4z"
      />
```

Isi `<svg>` untuk `AppLogo` versi `balon-piksel` (pakai `viewBox="0 0 16 16"` dan `shapeRendering="crispEdges"`):

```tsx
      <path
        className="fill-primary"
        d="M3 1h10v1h-10zM2 2h12v1h-12zM1 3h14v1h-14zM1 4h4v2h-4zM7 4h2v2h-2zM11 4h4v2h-4zM1 6h14v2h-14zM1 8h5v1h-5zM10 8h5v1h-5zM1 9h14v1h-14zM2 10h12v1h-12zM3 11h10v1h-10zM3 12h4v1h-4zM3 13h2v1h-2zM3 14h1v1h-1z"
      />
```

Isi `<svg>` untuk `AppLogo` versi `balon-wajah`:

```tsx
      <g
        className="stroke-primary"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          strokeWidth="2.6"
          d="M11 5h10a7 7 0 0 1 7 7v4a7 7 0 0 1-7 7h-8l-5 4v-4.9A7 7 0 0 1 4 16v-4a7 7 0 0 1 7-7z"
        />
        <path strokeWidth="2.4" d="M12.3 16.6c2 1.7 5.4 1.7 7.4 0" />
      </g>
      <circle cx="12.3" cy="12" r="1.7" className="fill-primary" />
      <circle cx="19.7" cy="12" r="1.7" className="fill-primary" />
```

Isi `<svg>` untuk `AppLogo` versi `balon-bintang`:

```tsx
      <path
        className="fill-primary"
        fillRule="evenodd"
        d="M16 2a14 14 0 0 1 0 28H2V16A14 14 0 0 1 16 2zm0 7c-.75 4.4-2.6 6.25-7 7 4.4.75 6.25 2.6 7 7 .75-4.4 2.6-6.25 7-7-4.4-.75-6.25-2.6-7-7z"
      />
```

Isi `<svg>` untuk `AppLogo` versi `topi-balon`:

```tsx
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M16 5 27.5 10 16 15 4.5 10z" className="fill-primary-foreground" />
      <path
        d="M8.5 13.5 16 16.8l7.5-3.3V20a3.5 3.5 0 0 1-3.5 3.5h-6.4l-3.9 3.2c-.5.4-1.2.1-1.2-.6z"
        className="fill-primary-foreground"
      />
      <path
        d="M25.6 10.9v5.2"
        className="stroke-primary-foreground"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="25.6" cy="16.8" r="1.3" className="fill-primary-foreground" />
```
