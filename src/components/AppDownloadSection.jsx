import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePwaInstall } from '../context/PwaInstallContext'

export function AppDownloadSection() {
  const { t } = useTranslation()
  const { promptInstall, setShowModal, isInstalled } = usePwaInstall()

  const handleInstallClick = () => {
    promptInstall()
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0E1E3D] via-[#152A54] to-[#0E1E3D] py-8 sm:py-16 text-white my-8 sm:my-12 rounded-2xl sm:rounded-3xl mx-3 sm:mx-8 shadow-2xl border border-[#CB9A56]/30">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-[#CB9A56]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#CB9A56]/20 border border-[#CB9A56]/40 px-3 sm:px-4 py-1 text-[11px] sm:text-xs font-bold text-[#CB9A56]">
              <span>📱</span>
              <span>{t('installAppTitle')}</span>
            </div>

            <h2 className="font-display text-xl sm:text-4xl font-bold leading-tight text-white">
              حجز الفنادق والمراقد أسرع بمرتين مع <span className="text-[#CB9A56]">تطبيق ضيافة</span>
            </h2>

            <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('installAppSubtitle')}
            </p>

            {/* App Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 text-right">
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold text-sm sm:text-base">
                  ⚡
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-white">{t('fastAndOffline')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold text-sm sm:text-base">
                  🔔
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-white">{t('instantNotifications')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold text-sm sm:text-base">
                  👆
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-white">{t('easyBooking')}</p>
                </div>
              </div>
            </div>

            {/* Install Call To Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl sm:rounded-2xl bg-[#CB9A56] px-6 sm:px-8 py-3.5 sm:py-4 font-bold text-[#152A54] hover:bg-[#E4C48A] active:scale-95 transition shadow-xl text-sm sm:text-base group"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#152A54] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{isInstalled ? t('appInstalled') : t('installNow')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 px-5 sm:px-6 py-3.5 sm:py-4 font-bold text-white hover:bg-white/20 transition text-xs sm:text-sm"
              >
                <span>ℹ️ تعليمات التثبيت</span>
              </button>
            </div>
          </div>

          {/* Smartphone Phone Visual */}
          <div className="lg:col-span-5 flex justify-center pt-2 lg:pt-0">
            <div className="relative w-56 sm:w-64 sm:w-72 rounded-[32px] sm:rounded-[40px] border-4 sm:border-8 border-[#1f386d] bg-slate-900 p-2 sm:p-2.5 shadow-2xl transition-transform hover:scale-102 duration-300">
              {/* Phone notch */}
              <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 h-3.5 sm:h-4 w-20 sm:w-28 bg-[#1f386d] rounded-full z-20" />
              
              {/* Phone Screen Mockup */}
              <div className="overflow-hidden rounded-[24px] sm:rounded-[30px] bg-[#FAF7F1] text-[#152A54] pt-6 sm:pt-7 pb-3 sm:pb-4 px-2.5 sm:px-3 space-y-2.5 sm:space-y-3 min-h-[380px] sm:min-h-[440px]">
                {/* App Screen Header */}
                <div className="flex items-center justify-between border-b border-[#CB9A56]/20 pb-2 px-1">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <img src="/brand/diafa-icon.png" alt="Diafa App" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg object-contain border border-[#CB9A56]" />
                    <span className="font-display font-bold text-[11px] sm:text-xs text-[#152A54]">ضيافة | Diafa</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] bg-[#CB9A56] text-[#152A54] px-1.5 sm:px-2 py-0.5 rounded-full font-bold">التطبيق الرسمى</span>
                </div>

                {/* Simulated Screen Body */}
                <div className="rounded-xl bg-white p-2.5 sm:p-3 border border-neutral-200 shadow-sm space-y-2">
                  <div className="h-20 sm:h-24 rounded-lg bg-gradient-to-r from-[#152A54] to-[#1e3b75] p-2 sm:p-2.5 text-white flex flex-col justify-end">
                    <p className="text-[10px] sm:text-[11px] font-bold">فندق الجزائر العاصمة</p>
                    <p className="text-[8px] sm:text-[9px] text-amber-300">ابتداءً من 4500 دج / ليلة</p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                    <span className="font-bold text-[#152A54]">غرفة ثنائية متاحة</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">مؤكد</span>
                  </div>
                </div>

                {/* Push Notification Mockup */}
                <div className="rounded-xl bg-[#152A54] text-white p-2 sm:p-2.5 shadow-md border border-[#CB9A56] space-y-1">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#CB9A56] font-bold">
                    <span>🔔 إشعار الحجز</span>
                    <span>الآن</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-200">تم تأكيد حجزك في مرقد الوفاء بنجاح!</p>
                </div>

                {/* Quick install button on screen */}
                <div className="pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full rounded-xl bg-[#CB9A56] py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-[#152A54] shadow transition hover:bg-[#E4C48A]"
                  >
                    تثبيت التطبيق بلمسة
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default AppDownloadSection
