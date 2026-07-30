import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('diyafa_user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const saved = localStorage.getItem('diyafa_user')
        if (saved && mounted) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed && parsed.id) setUser(parsed)
          } catch (e) {}
        }

        const data = await authApi.getMe()
        if (data.success && mounted) {
          setUser(data.data)
          localStorage.setItem('diyafa_user', JSON.stringify(data.data))
        }
      } catch (err) {
        // ignore — keep cached state if logged in
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('diyafa_user')
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const data = await authApi.getMe()
        if (data.success) {
          setUser(data.data)
          localStorage.setItem('diyafa_user', JSON.stringify(data.data))
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (identifiant, motDePasse, captchaToken) => {
    setError(null)
    try {
      const data = await authApi.login(identifiant, motDePasse)
      if (data.success) {
        setUser(data.data.user)
        try {
          localStorage.setItem('diyafa_user', JSON.stringify(data.data.user))
        } catch (e) {}
        return { success: true, user: data.data.user }
      }
      const msg = data.message || 'Erreur de connexion.'
      console.error('[Login Error]', msg)
      setError(msg)
      return { success: false, error: msg }
    } catch (err) {
      let message = err.message || 'Erreur de connexion.'
      if (message.includes('Failed to fetch') || message.includes('fetch')) {
        message = 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.'
      }
      console.error('[Login Exception]', err)
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    setError(null)
    try {
      const data = await authApi.registerUser(userData)
      if (data.success) {
        return { success: true, message: data.message }
      }
      const msg = data.message || "Erreur lors de l'inscription."
      console.error('[Register Error]', msg)
      setError(msg)
      return { success: false, error: msg }
    } catch (err) {
      let message = err.message || "Erreur lors de l'inscription."
      if (message.includes('Failed to fetch') || message.includes('fetch')) {
        message = 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.'
      }
      console.error('[Register Exception]', err)
      setError(message)
      return { success: false, error: message }
    }
  }

  const updateProfile = async (data) => {
    setError(null)
    try {
      const result = await authApi.updateProfile(data)
      if (result.success) {
        setUser((prev) => {
          const updated = { ...prev, ...result.data }
          try {
            localStorage.setItem('diyafa_user', JSON.stringify(updated))
          } catch (e) {}
          return updated
        })
        return { success: true, message: result.message }
      }
      const msg = result.message || 'Erreur lors de la mise à jour.'
      setError(msg)
      return { success: false, error: msg }
    } catch (err) {
      const message = err.message || 'Erreur lors de la mise à jour.'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('diyafa_user')
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Logout error:', e)
    }
    setUser(null)
    setError(null)
  }

  const clearError = () => setError(null)

  const value = {
    user,
    loading,
    error,
    login,
    register,
    updateProfile,
    logout,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isClient: user?.role === 'client',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
