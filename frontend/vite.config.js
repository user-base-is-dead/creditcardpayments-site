import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // nginx proxies requests through with Host: creditcardpayment.in — Vite's
    // dev server blocks unrecognized Host headers by default, so it must be
    // allowlisted here or every proxied request gets a 403.
    allowedHosts: ["creditcardpayment.in", "www.creditcardpayment.in"],

    // During development, forward API and websocket traffic to the backend
    // (Node/Express + Socket.io on :4000) so the frontend can use same-origin
    // relative URLs like fetch('/api/...') and io().
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})