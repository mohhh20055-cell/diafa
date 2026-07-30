import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import * as reservationsApi from '../api/reservations'
import * as notificationsApi from '../api/notifications'
import * as contactApi from '../api/contact'

const STATUS_STYLES = {
  en_attente: 'bg-amber-100 text-amber-900 border-amber-300',
  acceptee: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  refusee: 'bg-rose-100 text-rose-900 border-rose-300',
  annulee: 'bg-slate-100 text-slate-700 border-slate-300',
  terminee: 'bg-sky-100 text-sky-900 border-sky-300',
}

const STATUS_LABELS = {
  en_attente: 'في الانتظار',
  acceptee: 'مقبولة',
  refusee: 'مرفوضة',
  annulee: 'ملغية',
  terminee: 'منتهية',
}

const Reservations = () => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('reservations')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // حالة نموذج الاتصال
  const [contactForm, setContactForm] = useState({ sujet: '', message: '' })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setError(null)
      const [resData, notifData] = await Promise.all([
        reservationsApi.getMyReservations(),
        notificationsApi.getMyNotifications(),
      ])

      if (resData.success) {
        setReservations(resData.data || [])
      } else {
        setError(resData.message)
      }

      if (notifData.success) {
        setNotifications(notifData.data || [])
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return
    const res = await reservationsApi.cancelReservation(id)
    if (res.success) {
      loadAllData()
    } else {
      alert(res.message || 'حدث خطأ أثناء الإلغاء.')
    }
  }

  const handleMarkNotificationRead = async (id) => {
    await notificationsApi.markNotificationAsRead(id)
    loadAllData()
  }

  const handleSendSupportMessage = async (e) => {
    e.preventDefault()
    if (!contactForm.sujet || !contactForm.message) return

    setContactSubmitting(true)
    setContactSuccess(null)

    const res = await contactApi.sendContactMessage({
      nom: `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'زبون ضيافة',
      email: user?.email || '',
      sujet: contactForm.sujet,
      message: contactForm.message,
      type: 'support',
    })

    setContactSubmitting(false)

    if (res.success) {
      setContactSuccess('تم إرسال رسالتك إلى فريق الدعم! ستتلقى الرد هنا.')
      setContactForm({ sujet: '', message: '' })
    } else {
      alert(res.message || 'حدث خطأ أثناء إرسال الرسالة.')
    }
  }

  const unreadNotifsCount = notifications.filter((n) => !n.lu).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E1E3D]"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'reservations', label: t('myReservations'), count: reservations.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'notifications', label: t('notificationsAndResponses'), count: unreadNotifsCount > 0 ? unreadNotifsCount : null, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'profile', label: t('myProfile'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'contact', label: t('supportAndHelp'), icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ]

  const activeTabObj = tabs.find((t) => t.id === activeTab)

  return (
    <div className="min-h-screen bg-[#FAF7F1] flex flex-col md:flex-row">
      {/* شريط التنقل العلوي للجوال */}
      <div className="md:hidden bg-[#0E1E3D] text-white px-4 py-3 border-b border-[#CB9A56]/30 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#E4C48A]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#CB9A56] font-bold">مساحة الزبون</span>
            <h2 className="text-sm font-bold text-white leading-tight">{activeTabObj?.label}</h2>
          </div>
        </div>

        <Link
          to="/etablissements"
          className="px-3 py-1.5 rounded-lg bg-[#CB9A56] text-[#0E1E3D] text-xs font-bold"
        >
          {t('browseEstablishments')}
        </Link>
        <LanguageSwitcher />
      </div>

      {/* طبقة التعتيم للجوال */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* حاوية الشريط الجانبي */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-auto w-72 bg-[#0E1E3D] text-white flex flex-col justify-between border-r border-[#CB9A56]/20 transition-transform duration-300 ease-in-out shrink-0 h-screen ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* رأس الشريط الجانبي والعلامة التجارية */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#CB9A56] text-[#0E1E3D] font-black flex items-center justify-center text-lg shadow-md">
                ض
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white leading-tight">زبون ضيافة</h2>
                <span className="text-[11px] text-[#E4C48A] font-medium">حساب الزبون</span>
              </div>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* بطاقة الملف الشخصي */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#CB9A56] text-[#0E1E3D] font-extrabold flex items-center justify-center text-xs shrink-0">
              {(user?.prenom || user?.nom || 'ز').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.prenom || 'زبون'} {user?.nom || ''}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || user?.telephone}</p>
            </div>
          </div>
        </div>

        {/* عناصر التنقل في الشريط الجانبي */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto thin-scrollbar">
          <p className="px-3 text-[10px] font-bold text-[#E4C48A] uppercase tracking-wider mb-2">
            القائمة الرئيسية
          </p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMobileSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#CB9A56] text-[#0E1E3D] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <svg className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0E1E3D]' : 'text-[#E4C48A]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <div className="text-left truncate">
                    <span className="block leading-tight">{tab.label}</span>
                  </div>
                </div>

                {tab.count !== undefined && tab.count !== null && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                    isActive
                      ? 'bg-[#0E1E3D] text-white'
                      : tab.id === 'notifications' && unreadNotifsCount > 0
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-white/10 text-[#E4C48A]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* تذييل الشريط الجانبي */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/etablissements"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <svg className="w-4 h-4 text-[#E4C48A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>البحث عن إقامة</span>
          </Link>

          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition border border-rose-500/30 cursor-pointer"
          >
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
        {/* رأس الصفحة */}
        <div className="bg-[#0E1E3D] text-white rounded-2xl p-6 mb-8 border border-[#CB9A56]/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[#E4C48A] text-xs font-bold uppercase tracking-wider block mb-1">
                المساحة الشخصية للزبون
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                مرحباً، {user?.prenom || 'زبون'} !
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                تابع حجوزاتك، اطلع على ردود الإدارة وأدر حسابك.
              </p>
            </div>
            <Link
              to="/etablissements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#CB9A56] hover:bg-[#E4C48A] text-[#0E1E3D] font-bold text-xs transition shadow-md self-start sm:self-auto"
            >
              <span>حجز جديد</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs mb-6">
            {error}
          </div>
        )}

        {/* بطاقات محتوى التبويبات */}
        <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-6 sm:p-8">
          {activeTab === 'reservations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#0E1E3D] font-display">
                  حجوزاتي
                </h3>
                <span className="px-3 py-1 bg-neutral-100 text-[#0E1E3D] text-xs font-bold rounded-full">
                  المجموع: {reservations.length}
                </span>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">لا توجد حجوزات حالياً</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">استكشف الفنادق والمراقد المتاحة في الجزائر.</p>
                  <Link
                    to="/etablissements"
                    className="inline-block px-5 py-2.5 bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-xs font-bold rounded-xl transition"
                  >
                    استعراض المؤسسات
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border border-neutral-200 rounded-2xl p-5 hover:border-[#CB9A56] transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-[#0E1E3D] text-base">
                            {reservation.etablissement?.nom || 'مؤسسة ضيافة'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            النوع / الغرفة: <strong>{reservation.room?.nomType || 'إقامة عادية'}</strong>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            فترة الإقامة: <strong>{new Date(reservation.dateArrivee).toLocaleDateString('ar-DZ')}</strong> إلى <strong>{new Date(reservation.dateDepart).toLocaleDateString('ar-DZ')}</strong>
                          </p>
                          <p className="text-xs font-bold text-[#CB9A56] mt-1.5">
                            السعر الإجمالي: {parseFloat(reservation.prixTotal || 0).toLocaleString('ar-DZ')} دج
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[reservation.statut] || 'bg-neutral-100 text-neutral-800'}`}>
                            {STATUS_LABELS[reservation.statut] || reservation.statut}
                          </span>

                          {(reservation.statut === 'en_attente' || reservation.statut === 'acceptee') && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                            >
                              إلغاء الحجز
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0E1E3D] font-display">
                    الإشعارات والردود الإدارية
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    جميع الردود على رسائل الدعم وتحديثات الحجوزات تظهر هنا.
                  </p>
                </div>
                {unreadNotifsCount > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                    {unreadNotifsCount} غير مقروءة
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">لا توجد إشعارات مسجلة</p>
                  <p className="text-xs text-slate-400 mt-1">ستتلقى إشعاراً فور رد الإدارة أو صاحب المؤسسة.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition ${
                        !notif.lu
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                            !notif.lu ? 'bg-[#0E1E3D] text-[#E4C48A]' : 'bg-neutral-200 text-slate-600'
                          }`}>
                            💬
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleString('ar-DZ') : 'تاريخ غير معروف'}
                            </span>
                          </div>
                        </div>

                        {!notif.lu && (
                          <button
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className="px-3 py-1 bg-[#0E1E3D] text-white hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-[10px] font-bold rounded-lg transition shrink-0 cursor-pointer"
                          >
                            وضع كـ مقروء
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                الملف الشخصي
              </h3>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 space-y-4 max-w-lg">
                <div className="flex items-center gap-4 border-b border-neutral-200 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0E1E3D] text-[#E4C48A] text-xl font-extrabold flex items-center justify-center shadow-sm">
                    {(user?.prenom || user?.nom || 'ز').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0E1E3D] text-base">{user?.prenom} {user?.nom}</h4>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase">
                      حساب {user?.role === 'owner' ? 'صاحب مؤسسة' : 'زبون'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-slate-500">البريد الإلكتروني:</span>
                    <span className="font-bold text-[#0E1E3D]">{user?.email || 'غير مسجل'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="font-bold text-[#0E1E3D]">{user?.telephone || 'غير مسجل'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">مسجل منذ:</span>
                    <span className="font-bold text-[#0E1E3D]">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-DZ') : 'تاريخ غير معروف'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-1 font-display">
                إرسال رسالة دعم
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                بحاجة إلى مساعدة؟ اطرح سؤالك هنا. سيرد عليك فريق إدارة ضيافة مباشرة في هذه المساحة.
              </p>

              {contactSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  {contactSuccess}
                </div>
              )}

              <form onSubmit={handleSendSupportMessage} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">موضوع طلبك *</label>
                  <input
                    type="text"
                    value={contactForm.sujet}
                    onChange={(e) => setContactForm({ ...contactForm, sujet: e.target.value })}
                    required
                    placeholder="مثال: استفسار حول حجزي، مشكلة في الحساب..."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">رسالتك *</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    placeholder="صف طلبك بالتفصيل..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-6 py-2.5 bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {contactSubmitting ? 'جاري الإرسال...' : 'إرسال رسالتي'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Reservations
