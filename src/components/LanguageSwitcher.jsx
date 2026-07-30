import React from 'react'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const toggleLang = () => i18n.changeLanguage(lang === 'ar' ? 'en' : 'ar')

  return (
    <button
      onClick={toggleLang}
      type="button"
      title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[#CB9A56] hover:bg-[#152A54]/5 transition border border-[#CB9A56]/30"
    >
      <svg className="w-4 h-4 text-[#CB9A56]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  )
}
