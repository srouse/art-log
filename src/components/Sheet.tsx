import {
  PRINT_SPREAD_GAP_IN,
  SHEET_HEIGHT_IN,
  SHEET_PREVIEW_MAX_WIDTH_PX,
  SHEET_WIDTH_IN,
} from '../constants'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { PlannedImage, SheetModel } from '../types'
import './Sheet.css'

const printRootCssVars = {
  '--sheet-preview-max-px': `${SHEET_PREVIEW_MAX_WIDTH_PX}px`,
  '--sheet-print-w': `${SHEET_WIDTH_IN}in`,
  '--sheet-print-h': `${SHEET_HEIGHT_IN}in`,
  '--sheet-ar-w': SHEET_WIDTH_IN,
  '--sheet-ar-h': SHEET_HEIGHT_IN,
  '--print-spread-gap': `${PRINT_SPREAD_GAP_IN}in`,
} as CSSProperties

function formatCapturedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ImageLightbox({
  cell,
  onClose,
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
}: {
  cell: PlannedImage
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const showNav = onPrev != null && onNext != null

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (!showNav) return
      if (e.key === 'ArrowLeft') {
        if (!canPrev) return
        e.preventDefault()
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        if (!canNext) return
        e.preventDefault()
        onNext?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canNext, canPrev, onClose, onNext, onPrev, showNav])

  return createPortal(
    <div
      className="image-lightbox no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged image"
    >
      <div className="image-lightbox-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="image-lightbox-panel">
        <button
          ref={closeRef}
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="image-lightbox-main">
          {showNav ? (
            <button
              type="button"
              className="image-lightbox-nav image-lightbox-nav--prev"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label="Previous image"
            >
              ‹
            </button>
          ) : null}
          <div className="image-lightbox-img-wrap">
            <img src={cell.src} alt="" className="image-lightbox-img" draggable={false} />
          </div>
          {showNav ? (
            <button
              type="button"
              className="image-lightbox-nav image-lightbox-nav--next"
              onClick={onNext}
              disabled={!canNext}
              aria-label="Next image"
            >
              ›
            </button>
          ) : null}
        </div>
        {cell.capturedAt ? (
          <div className="image-lightbox-caption">{formatCapturedAt(cell.capturedAt)}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

type Props = {
  sheet: SheetModel
  sessionTitle: string
  onImageOpen?: (cell: PlannedImage) => void
}

export function Sheet({ sheet, sessionTitle, onImageOpen }: Props) {
  const { cells } = sheet

  return (
    <article className="sheet" aria-label="Log sheet (four images)">
      <div className="sheet-body">
        {cells.map((cell, idx) => (
          <div
            key={cell?.id ?? `empty-${idx}`}
            className={`sheet-cell${cell ? '' : ' sheet-cell--empty'}`}
            aria-hidden={cell ? undefined : true}
          >
            {cell ? (
              <>
                <img src={cell.src} alt="" className="sheet-img" draggable={false} />
                <button
                  type="button"
                  className="sheet-img-hit no-print"
                  aria-label="View image larger"
                  onClick={() => onImageOpen?.(cell)}
                />
                {cell.capturedAt ? (
                  <div className="sheet-cell-date">{formatCapturedAt(cell.capturedAt)}</div>
                ) : null}
              </>
            ) : null}
          </div>
        ))}
      </div>
      <footer className="sheet-footer">
        <span>{sessionTitle}</span>
      </footer>
    </article>
  )
}

function chunkPairs<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += 2) {
    out.push(items.slice(i, i + 2))
  }
  return out
}

export function PrintSpreads({
  sheets,
  sessionTitle,
  onImageOpen,
}: {
  sheets: SheetModel[]
  sessionTitle: string
  onImageOpen?: (cell: PlannedImage) => void
}) {
  const pairs = chunkPairs(sheets)
  return (
    <div className="print-root" style={printRootCssVars}>
      {pairs.map((pair, spreadIndex) => (
        <div
          key={spreadIndex}
          className={`print-spread ${pair.length < 2 ? 'print-spread--single' : ''}`}
        >
          {pair.map((sheetItem, j) => (
            <Sheet
              key={`${spreadIndex}-${j}`}
              sheet={sheetItem}
              sessionTitle={sessionTitle}
              onImageOpen={onImageOpen}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
