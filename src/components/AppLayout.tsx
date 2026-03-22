import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSessions } from '../context/SessionsContext'
import './AppLayout.css'

export function AppLayout() {
  const { data, error, reload } = useSessions()
  const [scanning, setScanning] = useState(false)

  async function runScan() {
    setScanning(true)
    try {
      const res = await fetch('/api/scan-sessions', { method: 'POST' })
      let body: { ok?: boolean; output?: string; error?: string; code?: number }
      try {
        body = (await res.json()) as typeof body
      } catch {
        throw new Error(
          'Scan API unavailable. Use “npm run dev” for the in-app scan, or run “npm run scan-sessions” in a terminal.',
        )
      }
      if (!res.ok || !body.ok) {
        const msg = body.error ?? body.output ?? res.statusText
        throw new Error(typeof msg === 'string' ? msg : 'Scan failed')
      }
      reload()
    } catch (e) {
      const message =
        e instanceof TypeError && e.message === 'Failed to fetch'
          ? 'Scan API unavailable. Use “npm run dev” for the in-app scan, or run “npm run scan-sessions” in a terminal.'
          : e instanceof Error
            ? e.message
            : String(e)
      window.alert(message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar no-print" aria-label="Sessions">
        <div className="sidebar-header">
          <span className="logo">ArtLog</span>
          <div className="sidebar-header-actions">
            {import.meta.env.DEV && (
              <button
                type="button"
                className="btn ghost small"
                disabled={scanning}
                onClick={() => void runScan()}
                title="Run folder scan (writes public/sessions/index.json)"
              >
                {scanning ? 'Scanning…' : 'Scan'}
              </button>
            )}
            <button type="button" className="btn ghost small" onClick={() => reload()} title="Reload manifest">
              Refresh
            </button>
          </div>
        </div>

        {error && <p className="sidebar-error">{error}</p>}

        <nav className="sidebar-nav">
          {data?.sessions.map((s) => (
            <NavLink
              key={s.id}
              to={`/session/${s.id}`}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <span className="sidebar-link-label">{s.label}</span>
              <span className="sidebar-link-meta">{s.images.length}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
