import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { updateUserPassword } from '../api/auth'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  
  const [emailInput, setEmailInput] = useState(emailFromUrl)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const targetEmail = emailInput.trim() || emailFromUrl.trim()

    if (!targetEmail) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمات المرور غير متطابقة.')
      return
    }

    setIsSubmitting(true)
    const result = await updateUserPassword(newPassword, targetEmail)

    if (result.success) {
      setSuccessMessage(result.message)
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } else {
      setErrorMessage(result.message)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A2951] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* تأثير الخلفية المتوهج */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[#F97316]/15 blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <Logo className="h-12 mx-auto" withText dark />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
            كلمة مرور جديدة
          </h1>
          <p className="text-[#FB923C] text-sm">
            قم بتعيين كلمة مرور جديدة لتأمين حسابك
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-100">
          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#1A2951]">
                تمت إعادة تعيين كلمة المرور!
              </h2>
              <p className="text-sm text-slate-600 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                {successMessage}
              </p>
              <p className="text-xs text-slate-400">
                جارٍ إعادة التوجيه إلى صفحة تسجيل الدخول...
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block w-full py-3 px-4 rounded-xl font-bold text-[#1A2951] bg-[#F97316] hover:bg-[#FB923C] transition text-sm"
                >
                  تسجيل الدخول الآن
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
                    <p className="text-xs font-bold uppercase tracking-wider">خطأ</p>
                  </div>
                  <p className="text-xs text-red-700 leading-normal">{errorMessage}</p>
                </div>
              )}

              <div>
                <label htmlFor="emailInput" className="block text-xs font-semibold uppercase tracking-wider text-[#1A2951] mb-2">
                  البريد الإلكتروني للحساب
                </label>
                <input
                  id="emailInput"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-sm transition-all outline-none"
                  placeholder="بريدك@مثال.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#1A2951] mb-2">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-sm transition-all outline-none"
                    placeholder="8 أحرف على الأقل"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#1A2951] mb-2">
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] text-sm transition-all outline-none"
                  placeholder="أعد كتابة كلمة المرور"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-[#1A2951] bg-[#F97316] hover:bg-[#FB923C] focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التحديث...
                  </span>
                ) : (
                  'تغيير كلمة المرور'
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs font-medium text-[#FB923C] hover:text-white transition-colors">
            ← تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
