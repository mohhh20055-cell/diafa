import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const currentLang = (i18n.language || 'ar').slice(0, 2)
  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0]

  const applyLang = (nextLang) => {
    const langDef = LANGUAGES.find((l) => l.code === nextLang) || LANGUAGES[0]
    i18n.changeLanguage(nextLang)
    localStorage.setItem('i18nextLng', nextLang)
    document.documentElement.dir = langDef.dir
    document.documentElement.lang = nextLang
    setOpen(false)
  }

  useEffect(() => {
    document.documentElement.dir = current.dir
    document.documentElement.lang = current.code
  }, [current.code, current.dir])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        type="button"
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#F97316] hover:bg-[#1A2951]/5 transition border border-[#F97316]/30 cursor-pointer"
      >
        <svg className="w-4 h-4 text-[#F97316]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
        <span>{current.label}</span>
        <svg className={`w-3 h-3 text-[#F97316] transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-2 min-w-[140px] rounded-xl border border-[#F97316]/20 bg-white shadow-lg overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => applyLang(lang.code)}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
                lang.code === current.code
                  ? 'bg-[#F97316]/10 text-[#1A2951] font-bold'
                  : 'text-slate-600 hover:bg-[#1A2951]/5'
              }`}
            >
              <span>{lang.label}</span>
              {lang.code === current.code && (
                <svg className="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

