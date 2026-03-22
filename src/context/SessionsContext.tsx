import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { normalizeSessionsIndex } from '../lib/normalizeSessionsIndex'
import type { SessionsIndex } from '../types'

type SessionsState = {
  data: SessionsIndex | null
  error: string | null
  reload: () => void
}

const SessionsContext = createContext<SessionsState | null>(null)

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionsIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setError(null)

    const url = `${import.meta.env.BASE_URL}sessions/index.json`

    fetch(url, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<SessionsIndex>
      })
      .then((json) => {
        if (!cancelled) setData(normalizeSessionsIndex(json))
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  return (
    <SessionsContext.Provider value={{ data, error, reload }}>{children}</SessionsContext.Provider>
  )
}

export function useSessions(): SessionsState {
  const ctx = useContext(SessionsContext)
  if (!ctx) throw new Error('useSessions must be used within SessionsProvider')
  return ctx
}
