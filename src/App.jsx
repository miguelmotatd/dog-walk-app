import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StartWalkPage from './pages/StartWalkPage'
import PublicWalkPage from './pages/PublicWalkPage'
import MyWalksPage from './pages/MyWalksPage'
import ProtectedRoute from './components/ProtectedRoute'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/start-walk" element={<StartWalkPage />} />
        <Route path="/walk/:walkId" element={<PublicWalkPage />} />
        <Route path="/my-walks" element={<MyWalksPage />} />
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute session={session}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}