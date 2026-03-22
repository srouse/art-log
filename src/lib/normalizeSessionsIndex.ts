import type { SessionImageEntry, SessionRecord, SessionsIndex } from '../types'

/** Accepts legacy `imagePaths: string[]` from older index.json files. */
export function normalizeSessionsIndex(raw: unknown): SessionsIndex {
  const obj = raw as { sessions?: unknown[] }
  const rawSessions = obj.sessions ?? []

  const sessions: SessionRecord[] = rawSessions.map((s: unknown) => {
    const row = s as SessionRecord & { imagePaths?: string[] }

    let images: SessionImageEntry[]

    if (Array.isArray(row.images)) {
      images = row.images.map((img) =>
        typeof img === 'string'
          ? { path: img, capturedAt: null }
          : {
              path: img.path,
              capturedAt: img.capturedAt ?? null,
            },
      )
    } else if (Array.isArray(row.imagePaths)) {
      images = row.imagePaths.map((p) => ({ path: p, capturedAt: null }))
    } else {
      images = []
    }

    return {
      id: row.id,
      label: row.label,
      date: row.date,
      images,
    }
  })

  return { sessions }
}
