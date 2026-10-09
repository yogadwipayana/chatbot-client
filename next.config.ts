import path from "node:path";

import type { NextConfig } from "next";

/**
 * Header yang aman untuk semua jalur, termasuk `/embed` yang dibingkai situs
 * lain. Sengaja tanpa `X-Frame-Options`: ia akan menimpa `frame-ancestors`
 * per kunci sematan dan mematahkan panel di situs penyemat. CSP lengkap juga
 * belum: widget dan `/embed` harus diuji dulu di setiap situs penyemat.
 */
const headerKeamanan = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Situs yang boleh memuat `/embed` di dalam iframe tidak lagi diatur di sini,
// melainkan per kunci sematan dari dashboard admin; header `frame-ancestors`
// seluruh portal dipasang `src/proxy.ts` saat berjalan.
const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  turbopack: {
    // Tanpa ini Turbopack menebak akar proyek dari package-lock.json terdekat,
    // yang di beberapa mesin pengembang ada di direktori home.
    root: path.join(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: headerKeamanan }];
  },
};

export default nextConfig;
