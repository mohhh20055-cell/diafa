import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Establishments from './pages/Establishments'
import EstablishmentDetail from './pages/EstablishmentDetail'
import Reservations from './pages/Reservations'
import OwnerDashboard from './pages/OwnerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Contact from './pages/Contact'
import Notifications from './pages/Notifications'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Admin dashboard has its own sidebar/topbar, so we hide the public Navbar/Footer there
function AppLayout() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/etablissements" element={<Establishments />} />
              <Route path="/etablissements/:id" element={<EstablishmentDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/mes-reservations"
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <Reservations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard/:tab?"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              {/* Redirect legacy/alternate URLs from index.html */}
              <Route path="/connexion" element={<Navigate to="/login" replace />} />
              <Route path="/inscription" element={<Navigate to="/register" replace />} />
              <Route path="/inscription/etablissement" element={<Navigate to="/register" replace />} />
              <Route path="/recherche" element={<Establishments />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  )
}

export default App
