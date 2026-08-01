import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePwaInstall } from '../context/PwaInstallContext'

export function InstallAppButton({ className = '', variant = 'navbar' }) {
  const { t } = useTranslation()
  const { isInstalled, setShowModal, promptInstall, isInstallable } = usePwaInstall()

  const handleClick = () => {
    if (isInstallable) {
      promptInstall()
    } else {
      setShowModal(true)
    }
  }

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-300">
        <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{t('appInstalled')}</span>
      </span>
    )
  }

  if (variant === 'utility') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-full bg-[#152A54] px-3.5 py-1.5 text-xs font-bold text-[#CB9A56] hover:bg-[#1a3366] hover:text-white transition shadow-sm ${className}`}
      >
        <svg className="w-3.5 h-3.5 text-[#CB9A56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{t('downloadApp')}</span>
      </button>
    )
  }

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center justify-center gap-2.5 rounded-full bg-[#CB9A56] px-6 py-3.5 text-sm font-bold text-[#152A54] hover:bg-[#E4C48A] transition shadow-lg hover:shadow-xl ${className}`}
      >
        <svg className="w-5 h-5 text-[#152A54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{t('installApp')}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-full bg-[#CB9A56]/20 border border-[#CB9A56]/40 px-3.5 py-1.5 text-xs font-bold text-[#152A54] hover:bg-[#CB9A56] transition ${className}`}
    >
      <svg className="w-4 h-4 text-[#CB9A56] group-hover:text-[#152A54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{t('downloadApp')}</span>
    </button>
  )
}

export default InstallAppButton
