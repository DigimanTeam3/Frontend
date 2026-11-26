import { fileURLToPath, URL } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // API_PROXY_TARGET is read here only (no VITE_ prefix), so it never ends up in the bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET

  return {
    // `npm run dev:https` (mode "https") serves a self-signed HTTPS dev server for phones on the LAN.
    plugins: [react(), tailwindcss(), mode === 'https' && basicSsl()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      // Pre-bundle these together so the app and the React wrapper share one maplibre-gl instance
      // (setWorkerUrl in EventMap must reach the instance that creates the map).
      include: ['maplibre-gl', '@vis.gl/react-maplibre'],
    },
    build: {
      // maplibre-gl alone is ~1.1 MB (about 300 kB gzip). It is split out and loaded only on /map.
      chunkSizeWarningLimit: 1200,
      rolldownOptions: {
        output: {
          // Emit the MapLibre worker (.mjs) as .js so any static host serves it as JavaScript
          // (browsers refuse worker scripts with a wrong MIME type).
          assetFileNames: (asset) =>
            asset.names.some((name) => name.endsWith('.mjs'))
              ? 'assets/[name]-[hash].js'
              : 'assets/[name]-[hash][extname]',
        },
      },
    },
    server: {
      // Allow Cloudflare quick tunnel hostnames (cloudflared tunnel --url http://localhost:5173).
      allowedHosts: ['.trycloudflare.com'],
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              // Backend routes start at /events, /me ... (same as Vercel rewrites in production).
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  }
})
