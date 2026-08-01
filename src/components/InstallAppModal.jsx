import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePwaInstall } from '../context/PwaInstallContext'

export function InstallAppModal() {
  const { t } = useTranslation()
  const { showModal, setShowModal, promptInstall, isInstallable, isInstalled, isIos } = usePwaInstall()

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#FAF7F1] border border-[#CB9A56]/30 shadow-2xl">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#152A54] via-[#1c376c] to-[#152A54] p-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            aria-label={t('close')}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            ✕
          </button>
          
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg border-2 border-[#CB9A56]">
            <img src="/brand/diafa-icon.png" alt="Diafa App Icon" className="h-full w-full object-contain rounded-xl" />
          </div>

          <h3 className="font-display text-xl font-bold text-white">{t('installAppTitle')}</h3>
          <p className="mt-1 text-xs text-white/80 max-w-sm mx-auto">{t('installAppSubtitle')}</p>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5 text-[#152A54]">
          {/* Features list */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#CB9A56]/20 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CB9A56]/15 text-[#CB9A56] mb-2">
                ⚡
              </div>
              <span className="text-xs font-bold text-[#152A54]">{t('fastAndOffline')}</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#CB9A56]/20 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CB9A56]/15 text-[#CB9A56] mb-2">
                🔔
              </div>
              <span className="text-xs font-bold text-[#152A54]">{t('instantNotifications')}</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-[#CB9A56]/20 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CB9A56]/15 text-[#CB9A56] mb-2">
                📱
              </div>
              <span className="text-xs font-bold text-[#152A54]">{t('easyBooking')}</span>
            </div>
          </div>

          {/* Action button */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 font-bold text-sm">
              ✅ {t('appInstalled')}
            </div>
          ) : (
            <button
              type="button"
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#CB9A56] py-3.5 px-6 font-bold text-[#152A54] hover:bg-[#E4C48A] transition shadow-lg hover:shadow-xl text-base"
            >
              <svg className="w-5 h-5 text-[#152A54]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('installNow')}</span>
            </button>
          )}

          {/* Device specific instructions */}
          {isIos ? (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs space-y-2 text-slate-800">
              <p className="font-bold text-[#152A54] flex items-center gap-1.5">
                <span>🍎</span> {t('iosInstructionTitle')}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                <li>{t('iosStep1')}</li>
                <li>{t('iosStep2')}</li>
                <li>{t('iosStep3')}</li>
              </ol>
            </div>
          ) : (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs space-y-2 text-slate-800">
              <p className="font-bold text-[#152A54] flex items-center gap-1.5">
                <span>💡</span> {t('androidInstructionTitle')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                <li>{t('androidStep1')}</li>
                <li>{t('androidStep2')}</li>
              </ul>
            </div>
          )}

          <div className="text-center pt-2 border-t border-neutral-200/60">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-[#152A54] transition"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallAppModal
