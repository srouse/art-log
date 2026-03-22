import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SessionsProvider } from './context/SessionsContext'
import { AppLayout } from './components/AppLayout'
import { HomeRedirect } from './pages/HomeRedirect'
import { SessionPage } from './pages/SessionPage'

export default function App() {
  return (
    <BrowserRouter>
      <SessionsProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="session/:sessionId" element={<SessionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SessionsProvider>
    </BrowserRouter>
  )
}
