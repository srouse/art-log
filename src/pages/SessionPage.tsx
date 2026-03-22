import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PrintSpreads } from '../components/Sheet'
import { useImageDimensions } from '../hooks/useImageDimensions'
import { planSheets } from '../lib/layoutPlanner'
import { useSessions } from '../context/SessionsContext'

export function SessionPage() {
  const { sessionId } = useParams()
  const { data } = useSessions()

  const session = data?.sessions.find((s) => s.id === sessionId)

  const sources = useMemo(
    () =>
      session
        ? [...session.images].reverse().map((img, i) => ({
            id: `${session.id}-${i}`,
            src: img.path,
            capturedAt: img.capturedAt,
          }))
        : [],
    [session],
  )

  const { images: sized, error: loadError } = useImageDimensions(sources)

  const sheets = useMemo(() => (sized && sized.length > 0 ? planSheets(sized) : []), [sized])

  if (!data) {
    return (
      <div className="session-page">
        <p className="muted">Loading sessions…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="session-page">
        <p>Session not found.</p>
        <Link to="/">Back</Link>
      </div>
    )
  }

  if (session.images.length === 0) {
    return (
      <div className="session-page">
        <p>This session has no images.</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="session-page">
        <p className="error">{loadError}</p>
      </div>
    )
  }

  if (!sized) {
    return (
      <div className="session-page">
        <p className="muted">Measuring images for layout…</p>
      </div>
    )
  }

  return (
    <div className="session-page">
      <header className="session-toolbar no-print">
        <div>
          <h1 className="session-title">{session.label}</h1>
          <p className="session-meta muted">
            {sheets.length} sheet{sheets.length === 1 ? '' : 's'} · {session.images.length}{' '}
            image{session.images.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="session-toolbar-actions">
          <button type="button" className="btn primary" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </header>

      <PrintSpreads sheets={sheets} sessionTitle={session.label} />
    </div>
  )
}
