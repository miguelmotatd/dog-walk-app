import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'


import InstallPwaBanner from './components/InstallPwaBanner'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import StartWalkPage from './pages/StartWalkPage'
import PublicWalkPage from './pages/PublicWalkPage'
import MyWalksPage from './pages/MyWalksPage'
import CreateDogPage from './pages/CreateDogPage'
import EditDogPage from './pages/EditDogPage'
import EditWalkPage from './pages/EditWalkPage'
import VolunteerStartWalkPage from './pages/VolunteerStartWalkPage'
import ReportsPage from './pages/ReportsPage'
import CaminhadaRegisterPage from './pages/CaminhadaRegisterPage'
import CaminhadasListPage from './pages/CaminhadasListPage'
import CaminhadaManagePage from './pages/CaminhadaManagePage'
import CaminhadaChecklistPage from './pages/CaminhadaChecklistPage'
import VolunteerSignupPage from './pages/VolunteerSignupPage'
import AuxiliaryWorksListPage from './pages/AuxiliaryWorksListPage'
import AuxiliaryWorkDetailPage from './pages/AuxiliaryWorkDetailPage'

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
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/start-walk" element={<StartWalkPage />} />
          <Route path="/walk/:walkId" element={<PublicWalkPage />} />
          <Route path="/my-walks" element={<MyWalksPage />} />
          <Route path="/caminhada" element={<CaminhadaRegisterPage />} />
          <Route path="/volunteer-signup" element={<VolunteerSignupPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/login"
            element={session ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute session={session}>
                <RegisterPage />
              </ProtectedRoute>
            }
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
            path="/walks/new"
            element={
              <ProtectedRoute session={session}>
                <VolunteerStartWalkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/walks/:walkId/edit"
            element={
              <ProtectedRoute session={session}>
                <EditWalkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute session={session}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caminhadas"
            element={
              <ProtectedRoute session={session}>
                <CaminhadasListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caminhadas/:caminhadaId"
            element={
              <ProtectedRoute session={session}>
                <CaminhadaManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caminhadas/:caminhadaId/checklist"
            element={
              <ProtectedRoute session={session}>
                <CaminhadaChecklistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auxiliary-works"
            element={
              <ProtectedRoute session={session}>
                <AuxiliaryWorksListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auxiliary-works/:auxiliaryWorkId"
            element={
              <ProtectedRoute session={session}>
                <AuxiliaryWorkDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={session ? '/' : '/login'} replace />}
          />
        </Routes>
      </BrowserRouter>
 
      <InstallPwaBanner />
    </>
  )
}