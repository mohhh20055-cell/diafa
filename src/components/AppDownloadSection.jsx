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
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0E1E3D] via-[#152A54] to-[#0E1E3D] py-16 text-white my-12 rounded-3xl mx-4 sm:mx-8 shadow-2xl border border-[#CB9A56]/30">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-[#CB9A56]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#CB9A56]/20 border border-[#CB9A56]/40 px-4 py-1.5 text-xs font-bold text-[#CB9A56]">
              <span>📱</span>
              <span>{t('installAppTitle')}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight text-white">
              حجز الفنادق والمراقد أسرع بمرتين مع <span className="text-[#CB9A56]">تطبيق ضيافة</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {t('installAppSubtitle')}
            </p>

            {/* App Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-right">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{t('fastAndOffline')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold">
                  🔔
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{t('instantNotifications')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CB9A56] text-[#152A54] font-bold">
                  👆
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{t('easyBooking')}</p>
                </div>
              </div>
            </div>

            {/* Install Call To Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-[#CB9A56] px-8 py-4 font-bold text-[#152A54] hover:bg-[#E4C48A] transition shadow-xl text-base group"
              >
                <svg className="w-6 h-6 text-[#152A54] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{isInstalled ? t('appInstalled') : t('installNow')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 px-6 py-4 font-bold text-white hover:bg-white/20 transition text-sm"
              >
                <span>ℹ️ تعليمات التثبيت</span>
              </button>
            </div>
          </div>

          {/* Smartphone Phone Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 sm:w-72 rounded-[40px] border-8 border-[#1f386d] bg-slate-900 p-2.5 shadow-2xl transition-transform hover:scale-105 duration-300">
              {/* Phone notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-28 bg-[#1f386d] rounded-full z-20" />
              
              {/* Phone Screen Mockup */}
              <div className="overflow-hidden rounded-[30px] bg-[#FAF7F1] text-[#152A54] pt-7 pb-4 px-3 space-y-3 min-h-[460px]">
                {/* App Screen Header */}
                <div className="flex items-center justify-between border-b border-[#CB9A56]/20 pb-2.5 px-1">
                  <div className="flex items-center gap-2">
                    <img src="/brand/diafa-icon.png" alt="Diafa App" className="h-7 w-7 rounded-lg object-contain border border-[#CB9A56]" />
                    <span className="font-display font-bold text-xs text-[#152A54]">ضيافة | Diafa</span>
                  </div>
                  <span className="text-[10px] bg-[#CB9A56] text-[#152A54] px-2 py-0.5 rounded-full font-bold">التطبيق الرسمى</span>
                </div>

                {/* Simulated Screen Body */}
                <div className="rounded-xl bg-white p-3 border border-neutral-200 shadow-sm space-y-2">
                  <div className="h-24 rounded-lg bg-gradient-to-r from-[#152A54] to-[#1e3b75] p-2.5 text-white flex flex-col justify-end">
                    <p className="text-[11px] font-bold">فندق الجزائر العاصمة</p>
                    <p className="text-[9px] text-amber-300">ابتداءً من 4500 دج / ليلة</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[#152A54]">غرفة ثنائية متاحة</span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">مؤكد</span>
                  </div>
                </div>

                {/* Push Notification Mockup */}
                <div className="rounded-xl bg-[#152A54] text-white p-2.5 shadow-md border border-[#CB9A56] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#CB9A56] font-bold">
                    <span>🔔 إشعار الحجز</span>
                    <span>الآن</span>
                  </div>
                  <p className="text-[10px] text-slate-200">تم تأكيد حجزك في مرقد الوفاء بنجاح!</p>
                </div>

                {/* Quick install button on screen */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full rounded-xl bg-[#CB9A56] py-2 text-xs font-bold text-[#152A54] shadow transition hover:bg-[#E4C48A]"
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
