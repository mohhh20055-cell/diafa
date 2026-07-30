import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, getTranslation } from '../utils/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('diafa_lang')
      return saved === 'en' ? 'en' : 'ar'
    } catch {
      return 'ar'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('diafa_lang', lang)
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    } catch (e) {
      console.error(e)
    }
  }, [lang])

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))
  }

  const t = (key) => getTranslation(lang, key)

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
