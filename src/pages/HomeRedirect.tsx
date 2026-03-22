import { Navigate } from 'react-router-dom'
import { useSessions } from '../context/SessionsContext'

export function HomeRedirect() {
  const { data, error } = useSessions()

  if (error) {
    return (
      <div className="session-page">
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="session-page">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  const id = data.sessions[0]?.id
  if (!id) {
    return (
      <div className="session-page">
        <h1 className="session-title">ArtLog</h1>
        <p>No sessions yet. Add a folder under <code>public/sessions/</code> with images, then run:</p>
        <pre className="code-block">npm run scan-sessions</pre>
      </div>
    )
  }

  return <Navigate to={`/session/${id}`} replace />
}
