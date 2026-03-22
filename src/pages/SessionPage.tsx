import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImageLightbox, PrintSpreads } from '../components/Sheet'
import type { PlannedImage } from '../types'
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

  const plannedImages: PlannedImage[] = useMemo(
    () =>
      sized
        ? sized.map((img) => ({
            id: img.id,
            src: img.src,
            capturedAt: img.capturedAt ?? null,
          }))
        : [],
    [sized],
  )

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const openLightboxForCell = useCallback((cell: PlannedImage) => {
    const i = plannedImages.findIndex((p) => p.id === cell.id)
    setLightboxIndex(i >= 0 ? i : null)
  }, [plannedImages])

  const goPrevLightbox = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null || i <= 0) return i
      return i - 1
    })
  }, [])

  const goNextLightbox = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null) return null
      const last = plannedImages.length - 1
      if (i >= last) return i
      return i + 1
    })
  }, [plannedImages.length])

  useEffect(() => {
    setLightboxIndex(null)
  }, [sessionId])

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

  const lightboxCell =
    lightboxIndex !== null &&
    lightboxIndex >= 0 &&
    lightboxIndex < plannedImages.length
      ? plannedImages[lightboxIndex]
      : null

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

      <PrintSpreads
        sheets={sheets}
        sessionTitle={session.label}
        onImageOpen={openLightboxForCell}
      />
      {lightboxCell && lightboxIndex !== null ? (
        <ImageLightbox
          cell={lightboxCell}
          onClose={closeLightbox}
          {...(plannedImages.length > 1
            ? {
                onPrev: goPrevLightbox,
                onNext: goNextLightbox,
                canPrev: lightboxIndex > 0,
                canNext: lightboxIndex < plannedImages.length - 1,
              }
            : {})}
        />
      ) : null}
    </div>
  )
}
