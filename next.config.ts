import path from "node:path";

import type { NextConfig } from "next";

// Situs yang boleh memuat `/embed` di dalam iframe tidak lagi diatur di sini,
// melainkan per kunci sematan dari dashboard admin; header `frame-ancestors`
// seluruh portal dipasang `src/proxy.ts` saat berjalan.
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Tanpa ini Turbopack menebak akar proyek dari package-lock.json terdekat,
    // yang di beberapa mesin pengembang ada di direktori home.
    root: path.join(__dirname),
  },
};

export default nextConfig;
