import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    // Tanpa ini Turbopack menebak akar proyek dari package-lock.json terdekat,
    // yang di beberapa mesin pengembang ada di direktori home.
    root: path.join(__dirname),
  },
};

export default nextConfig;
