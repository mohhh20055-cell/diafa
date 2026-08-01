import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePwaInstall } from '../context/PwaInstallContext'

export function MobileInstallBanner() {
  const { t } = useTranslation()
  const { isInstalled, promptInstall, setShowModal } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)

  if (isInstalled || dismissed) return null

  const handleInstall = () => {
    promptInstall()
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 lg:hidden animate-slideUp">
      <div className="mx-auto max-w-md rounded-2xl bg-[#152A54] border border-[#CB9A56]/40 p-3 shadow-2xl backdrop-blur-md text-white flex items-center justify-between gap-3">
        {/* Close / Dismiss */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 text-xs transition"
          aria-label={t('close')}
        >
          ✕
        </button>

        {/* Logo & Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src="/brand/diafa-icon.png"
            alt="Diafa Icon"
            className="h-10 w-10 shrink-0 rounded-xl object-contain border border-[#CB9A56]/60 bg-white p-0.5 shadow"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xs font-bold text-white truncate">تطبيق ضيافة</span>
              <span className="shrink-0 rounded bg-[#CB9A56] px-1 py-0.2 text-[9px] font-bold text-[#152A54]">
                مجاني
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate">تجرِبة أسرع على الجوال</p>
          </div>
        </div>

        {/* Install Button */}
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-xl bg-[#CB9A56] px-3.5 py-2 text-xs font-bold text-[#152A54] hover:bg-[#E4C48A] active:scale-95 transition shadow-md"
        >
          {t('installApp')}
        </button>
      </div>
    </div>
  )
}

export default MobileInstallBanner
