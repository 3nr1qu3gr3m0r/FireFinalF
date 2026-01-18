import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // Mantenlo en false para probar Push y PWA
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 1. SOLUCIÓN BLINDADA PARA WINDOWS (Watch Options)
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      // Usamos una lista directa de patrones para ignorar
      ignored: [
        '**/node_modules',
        '**/.next',
        '**/public/sw.js',        // Ignorar explícitamente el Service Worker
        '**/public/workbox-*.js', // Ignorar los archivos de Workbox
        '**/public/worker-*.js'   // Por si acaso genera este formato
      ],
    };
    return config;
  },

  // 2. HEADERS PARA QUE EL CELULAR NO TE BLOQUEE
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