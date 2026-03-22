import type { PlannedImage, SheetModel, SourceImage } from '../types'

function toPlanned(img: SourceImage): PlannedImage {
  return { id: img.id, src: img.src, capturedAt: img.capturedAt ?? null }
}

/**
 * One sheet = four images in a 2×2 grid. Partial last page uses `null` for empty quadrants.
 */
export function planSheets(images: SourceImage[]): SheetModel[] {
  const sheets: SheetModel[] = []

  for (let i = 0; i < images.length; i += 4) {
    const chunk = images.slice(i, i + 4).map(toPlanned)
    const cells: (PlannedImage | null)[] = [...chunk]
    while (cells.length < 4) cells.push(null)
    sheets.push({
      cells: cells as SheetModel['cells'],
    })
  }

  return sheets
}
