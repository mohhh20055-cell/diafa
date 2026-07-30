import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { resetPasswordRequest } from '../api/auth'

const ForgotPassword = () => {
  const [identifiant, setIdentifiant] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [foundEmail, setFoundEmail] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setErrorMessage(null)
    setFoundEmail(null)

    const result = await resetPasswordRequest(identifiant)

    if (result.success) {
      setMessage(result.message)
      if (result.data?.email) {
        setFoundEmail(result.data.email)
      }
    } else {
      setErrorMessage(result.message)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1E3D] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[#CB9A56]/15 blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <Logo className="h-12 mx-auto" withText dark />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
            Mot de passe oublié ?
          </h1>
          <p className="text-[#E4C48A] text-sm">
            Entrez votre e-mail ou téléphone pour réinitialiser votre mot de passe
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-100">
          {message ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#0E1E3D]">
                Compte trouvé ! / تم العثور على الحساب
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                {message}
              </p>
              {foundEmail && (
                <div className="pt-2 space-y-2">
                  <Link
                    to={`/reset-password?email=${encodeURIComponent(foundEmail)}`}
                    className="inline-block w-full py-3.5 px-4 rounded-xl font-bold text-[#0E1E3D] bg-[#CB9A56] hover:bg-[#E4C48A] transition text-sm shadow-md"
                  >
                    Réinitialiser le mot de passe maintenant / إعادة تعيين كلمة المرور الآن
                  </Link>
                </div>
              )}
              <div className="pt-1">
                <Link
                  to="/login"
                  className="inline-block w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0E1E3D] transition"
                >
                  Retour à la connexion / العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-4 rounded-xl">
                  <div className="flex items-start gap-3 mb-1">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-bold uppercase tracking-wider">Erreur</p>
                  </div>
                  <p className="text-xs text-red-700 leading-normal">{errorMessage}</p>
                </div>
              )}

              <div>
                <label htmlFor="identifiant" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  Email ou Numéro de téléphone
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="identifiant"
                    type="text"
                    required
                    value={identifiant}
                    onChange={(e) => setIdentifiant(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                    placeholder="exemple@email.com ou 06XXXXXXXX"
                    disabled={isSubmitting}
                  />
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
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#0E1E3D] hover:text-[#CB9A56] transition-colors"
            >
              ← Vous vous souvenez de votre mot de passe ? Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-[#E4C48A] hover:text-white transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
