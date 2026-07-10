import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import AppointmentsPage from './pages/AppointmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import VisitsPage from './pages/VisitsPage'
import BillingPage from './pages/BillingPage'
import ReportsPage from './pages/ReportsPage'
import PortalPage from './pages/PortalPage'

function Protected({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'patient' ? '/portal' : '/'} replace />
  }
  return children
}

const STAFF = ['admin', 'doctor', 'receptionist']

export default function App() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'patient' ? '/portal' : '/'} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route
            path="/"
            element={
              <Protected roles={STAFF}>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/patients"
            element={
              <Protected roles={STAFF}>
                <PatientsPage />
              </Protected>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <Protected roles={STAFF}>
                <PatientDetailPage />
              </Protected>
            }
          />
          <Route
            path="/appointments"
            element={
              <Protected roles={STAFF}>
                <AppointmentsPage />
              </Protected>
            }
          />
          <Route
            path="/doctors"
            element={
              <Protected roles={['admin', 'receptionist']}>
                <DoctorsPage />
              </Protected>
            }
          />
          <Route
            path="/visits"
            element={
              <Protected roles={['admin', 'doctor']}>
                <VisitsPage />
              </Protected>
            }
          />
          <Route
            path="/billing"
            element={
              <Protected roles={['admin', 'receptionist']}>
                <BillingPage />
              </Protected>
            }
          />
          <Route
            path="/reports"
            element={
              <Protected roles={['admin']}>
                <ReportsPage />
              </Protected>
            }
          />
          <Route
            path="/portal"
            element={
              <Protected roles={['patient']}>
                <PortalPage />
              </Protected>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
