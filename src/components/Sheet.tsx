import {
  PRINT_SPREAD_GAP_IN,
  SHEET_HEIGHT_IN,
  SHEET_PREVIEW_MAX_WIDTH_PX,
  SHEET_WIDTH_IN,
} from '../constants'
import type { CSSProperties } from 'react'
import type { SheetModel } from '../types'
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

type Props = {
  sheet: SheetModel
  sessionTitle: string
}

export function Sheet({ sheet, sessionTitle }: Props) {
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
}: {
  sheets: SheetModel[]
  sessionTitle: string
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
            <Sheet key={`${spreadIndex}-${j}`} sheet={sheetItem} sessionTitle={sessionTitle} />
          ))}
        </div>
      ))}
    </div>
  )
}
