export interface SessionImageEntry {
  path: string
  /**
   * ISO 8601: EXIF capture time when readable; otherwise file mtime from scan (see scan-sessions).
   */
  capturedAt: string | null
}

export interface SessionRecord {
  id: string
  label: string
  /** ISO date YYYY-MM-DD from folder mtime at scan time */
  date: string
  images: SessionImageEntry[]
}

export interface SessionsIndex {
  sessions: SessionRecord[]
}

export interface PlannedImage {
  id: string
  src: string
  /** ISO 8601 for on-image label */
  capturedAt?: string | null
  objectPosition?: string
}

/** One physical sheet: always four slots in a 2×2 grid (row-major); `null` = empty cell. */
export interface SheetModel {
  cells: [PlannedImage | null, PlannedImage | null, PlannedImage | null, PlannedImage | null]
}

export interface SourceImage {
  id: string
  src: string
  width: number
  height: number
  capturedAt?: string | null
}
