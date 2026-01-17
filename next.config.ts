import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // ⚠️ MANTENLO EN 'false' SOLO PARA LA PRUEBA DE HOY
  disable: process.env.NODE_ENV === 'development', 
});

const nextConfig: NextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'development',

  // 1. ESTO ROMPE EL BUCLE INFINITO
  // Le dice a Next.js: "No reinicies si cambia sw.js o workbox"
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /sw\.js|workbox-.*\.js/,
    };
    return config;
  },

  // 2. ESTO PERMITE QUE TU CELULAR ENTRE SIN ERRORES (CORS)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);