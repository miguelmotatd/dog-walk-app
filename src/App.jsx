import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'

import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import StartWalkPage from './pages/StartWalkPage'
import PublicWalkPage from './pages/PublicWalkPage'
import MyWalksPage from './pages/MyWalksPage'
import CreateDogPage from './pages/CreateDogPage'
import EditDogPage from './pages/EditDogPage'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
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
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginPage />}
        />

        <Route
          path="/dogs/new"
          element={
            <ProtectedRoute session={session}>
              <CreateDogPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dogs/:dogId/edit"
          element={
            <ProtectedRoute session={session}>
              <EditDogPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute session={session}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to={session ? '/' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}