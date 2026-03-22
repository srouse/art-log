import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Dev only: POST /api/scan-sessions runs `node scripts/scan-sessions.mjs`. */
function scanSessionsPlugin(): Plugin {
  return {
    name: 'artlog-scan-sessions',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url !== '/api/scan-sessions' || req.method !== 'POST') {
          next()
          return
        }

        const script = path.join(__dirname, 'scripts', 'scan-sessions.mjs')
        const child = spawn('node', [script], {
          cwd: __dirname,
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (d: Buffer) => {
          stdout += d.toString()
        })
        child.stderr?.on('data', (d: Buffer) => {
          stderr += d.toString()
        })

        child.on('error', (err) => {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: String(err.message) }))
        })

        child.on('close', (code) => {
          res.setHeader('Content-Type', 'application/json')
          const output = stdout + (stderr ? `\n${stderr}` : '')
          if (code === 0) {
            res.end(JSON.stringify({ ok: true, output }))
          } else {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, output, code }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), scanSessionsPlugin()],
})
