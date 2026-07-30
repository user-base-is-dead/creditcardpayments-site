import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

// Resolve .env files next to this config, not relative to the shell's cwd, so
// the settings below work no matter where the deploy script runs npm from.
const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' as the prefix loads every var from .env files (not just VITE_*), so the
  // serve-time settings below can live in frontend/.env as well as the shell.
  const env = loadEnv(mode, rootDir, '')

  // nginx proxies requests through with Host: creditcardpayment.in — Vite
  // blocks unrecognized Host headers by default, so the public hostnames must
  // be allowlisted or every proxied request gets a 403.
  const allowedHosts = ['creditcardpayment.in', 'www.creditcardpayment.in']

  // Forward API and websocket traffic to the backend (Node/Express + Socket.io)
  // so the frontend can use same-origin relative URLs like fetch('/api/...')
  // and io(). The backend has no domain of its own — it is reached only from
  // this machine, which is why the target is a loopback address.
  //
  // The same table is reused for `vite preview` below: `server.proxy` is read
  // ONLY by the dev server, so without `preview.proxy` a built deployment 404s
  // every /api call.
  const backend = env.BACKEND_ORIGIN || 'http://localhost:4000'
  const proxy = {
    '/api': {
      target: backend,
      changeOrigin: true,
    },
    '/socket.io': {
      target: backend,
      ws: true,
      changeOrigin: true,
    },
  }

  // Only needed when `vite dev` is exposed through nginx/Cloudflare instead of
  // serving a real build. Vite's HMR client otherwise tries to reach the dev
  // server directly on 127.0.0.1:<port>; that socket dies and the client
  // responds by calling location.reload() — an endless reload loop for every
  // visitor. Setting HMR_CLIENT_PORT=443 points it at the public TLS port.
  // Leave unset for local development and for `vite preview`.
  const hmrClientPort = env.HMR_CLIENT_PORT ? Number(env.HMR_CLIENT_PORT) : undefined
  const hmr = hmrClientPort
    ? { protocol: env.HMR_PROTOCOL || 'wss', clientPort: hmrClientPort }
    : undefined

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],

    // `vite dev` — local development.
    server: {
      allowedHosts,
      proxy,
      ...(hmr ? { hmr } : {}),
    },

    // `vite preview` — serves the built dist/. No HMR client is included in a
    // build, so this can never reload-loop. Host/port are left at Vite's
    // defaults (localhost:4173) and can be overridden from the environment
    // rather than pinned here, so an existing nginx upstream keeps working.
    preview: {
      allowedHosts,
      proxy,
      ...(env.PREVIEW_HOST ? { host: env.PREVIEW_HOST } : {}),
      ...(env.PREVIEW_PORT ? { port: Number(env.PREVIEW_PORT) } : {}),
    },
  }
})
