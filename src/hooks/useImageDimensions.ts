import { useEffect, useState } from 'react'
import type { SourceImage } from '../types'

export type ImageSource = { id: string; src: string; capturedAt?: string | null }

/**
 * Loads natural dimensions for each image URL. Returns null until all succeed.
 */
export function useImageDimensions(sources: ImageSource[]): {
  images: SourceImage[] | null
  error: string | null
} {
  const [images, setImages] = useState<SourceImage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fingerprint = sources.map((s) => `${s.id}:${s.src}:${s.capturedAt ?? ''}`).join('|')

  useEffect(() => {
    if (sources.length === 0) {
      setImages([])
      setError(null)
      return
    }

    let cancelled = false
    setImages(null)
    setError(null)

    const results = new Map<string, SourceImage>()

    const loadOne = (src: ImageSource) =>
      new Promise<void>((resolve, reject) => {
        const el = new Image()
        el.onload = () => {
          if (cancelled) return resolve()
          results.set(src.id, {
            id: src.id,
            src: src.src,
            width: el.naturalWidth,
            height: el.naturalHeight,
            capturedAt: src.capturedAt ?? null,
          })
          resolve()
        }
        el.onerror = () => reject(new Error(`Failed to load ${src.src}`))
        el.src = src.src
      })

    Promise.all(sources.map(loadOne))
      .then(() => {
        if (cancelled) return
        const ordered = sources.map((s) => results.get(s.id)!)
        setImages(ordered)
      })
      .catch((e: Error) => {
        if (cancelled) return
        setError(e.message)
        setImages(null)
      })

    return () => {
      cancelled = true
    }
  }, [fingerprint])

  return { images, error }
}
