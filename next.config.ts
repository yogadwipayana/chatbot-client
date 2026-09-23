import path from "node:path";

import type { NextConfig } from "next";

/**
 * Situs yang boleh memuat `/embed` di dalam iframe (lihat `public/embed.js`),
 * dipisah koma, mis. `https://www.instiki.ac.id,https://pmb.instiki.ac.id`.
 * Kosong = situs mana pun.
 *
 * Dibaca saat `npm run build`, bukan saat server berjalan: mengubahnya berarti
 * build ulang, sama seperti NEXT_PUBLIC_API_BASE_URL.
 */
const embedAllowedOrigins = (process.env.EMBED_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((asal) => asal.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Tanpa ini Turbopack menebak akar proyek dari package-lock.json terdekat,
    // yang di beberapa mesin pengembang ada di direktori home.
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${
              embedAllowedOrigins.length > 0 ? ["'self'", ...embedAllowedOrigins].join(" ") : "*"
            }`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
