import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Logo from '../components/Logo'

const Login = () => {
  const { t } = useTranslation()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, error, clearError, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin/dashboard')
      else if (user?.role === 'owner') navigate('/owner/dashboard')
      else navigate('/')
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const result = await login(identifiant, motDePasse)

    if (result.success) {
      const role = result.user?.role
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'owner') navigate('/owner/dashboard')
      else navigate('/')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1E3D] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* تأثير الخلفية المتوهج */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[#CB9A56]/15 blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <Logo className="h-12 mx-auto" withText dark />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            {t('login')}
          </h1>
          <p className="text-[#E4C48A] text-sm">
            {t('loginSubtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-4 rounded-xl">
                <div className="flex items-start gap-3 mb-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider">{t('error')}</p>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white/60 rounded-lg p-3 border border-red-200 select-all">{error}</pre>
              </div>
            )}

            <div>
              <label htmlFor="identifiant" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                {t('email')} / {t('phone')}
              </label>
              <input
                id="identifiant"
                type="text"
                required
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                placeholder="مثال@بريد.com / 06XXXXXXXX"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="motDePasse" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D]">
                  {t('password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#CB9A56] hover:text-[#0E1E3D] hover:underline transition-colors"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="block w-full px-4 py-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l-3.293-3.293m0 0a3 3 0 104.243-4.243l3.293 3.293m-3.293-3.293l3.293 3.293M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-[#0E1E3D] bg-[#CB9A56] hover:bg-[#E4C48A] focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('loading')}
                </span>
              ) : (
                t('login')
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-sm text-slate-500">
              {t('noAccount')}{' '}
              <Link
                to="/register"
                className="font-semibold text-[#CB9A56] hover:text-[#0E1E3D] hover:underline transition-colors"
              >
                {t('register')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-[#E4C48A] hover:text-white transition-colors">
            ← {t('exploreEstablishments')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
