import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  en_attente: 'pending',
  acceptee: 'accepted',
  refusee: 'rejected',
  annulee: 'cancelled',
  terminee: 'finished',
}

const Reservations = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [reservations, setReservations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'reservations')

  // حالة نموذج الاتصال
  const [contactForm, setContactForm] = useState({ sujet: '', message: '' })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const selectTab = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

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
      setError(t('errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (!confirm(t('cancelReservationConfirm'))) return
    const res = await reservationsApi.cancelReservation(id)
    if (res.success) {
      loadAllData()
    } else {
      alert(res.message || 'حدث خطأ أثناء الإلغاء.')
    }
  }

  const [selectedNotification, setSelectedNotification] = useState(null)

  const handleNotificationClick = async (notif) => {
    setSelectedNotification(notif)
    if (!notif.lu) {
      await notificationsApi.markNotificationAsRead(notif.id)
      loadAllData()
    }
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
      setContactSuccess(t('messageSentSupport'))
      setContactForm({ sujet: '', message: '' })
    } else {
      alert(res.message || t('errorOccurred'))
    }
  }

  const unreadNotifsCount = notifications.filter((n) => !n.lu).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2951]"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'reservations', label: t('myReservations'), count: reservations.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'notifications', label: t('notificationsAndResponses'), count: unreadNotifsCount > 0 ? unreadNotifsCount : null, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'profile', label: t('myProfile'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'contact', label: t('supportAndHelp'), icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* رأس الصفحة */}
        <div className="bg-[#1A2951] text-white rounded-2xl p-6 mb-6 border border-[#F97316]/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[#FB923C] text-xs font-bold uppercase tracking-wider block mb-1">
                {t('clientSpace')}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                {t('welcomeClient', { name: user?.prenom || t('client') })}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                {t('followReservations')}
              </p>
            </div>
            <Link
              to="/etablissements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#FB923C] text-[#1A2951] font-bold text-xs transition shadow-md self-start sm:self-auto"
            >
              <span>{t('bookNow')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* أشرطة التبويبات الأفقية */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#1A2951] text-white border-[#1A2951] shadow-md'
                    : 'bg-white text-slate-600 border-neutral-200 hover:border-[#F97316] hover:text-[#1A2951]'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F97316]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                    isActive
                      ? 'bg-white/15 text-[#FB923C]'
                      : tab.id === 'notifications' && unreadNotifsCount > 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-neutral-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
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
                <h3 className="text-lg font-bold text-[#1A2951] font-display">
                  {t('myReservations')}
                </h3>
                <span className="px-3 py-1 bg-neutral-100 text-[#1A2951] text-xs font-bold rounded-full">
                  {t('total')}: {reservations.length}
                </span>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">{t('noReservations')}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">{t('homeHeroSubtitle')}</p>
                  <Link
                    to="/etablissements"
                    className="inline-block px-5 py-2.5 bg-[#1A2951] hover:bg-[#F97316] hover:text-[#1A2951] text-white text-xs font-bold rounded-xl transition"
                  >
                    {t('browseEstablishments')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border border-neutral-200 rounded-2xl p-5 hover:border-[#F97316] transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-[#1A2951] text-base">
                            {reservation.etablissement?.nom || t('establishment')}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {t('roomType')}: <strong>{reservation.room?.nomType || t('details')}</strong>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t('period')}: <strong>{new Date(reservation.dateArrivee).toLocaleDateString()}</strong> {t('to')} <strong>{new Date(reservation.dateDepart).toLocaleDateString()}</strong>
                          </p>
                          <p className="text-xs font-bold text-[#F97316] mt-1.5">
                            {t('totalPrice')}: {parseFloat(reservation.prixTotal || 0).toLocaleString()} DZD
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[reservation.statut] || 'bg-neutral-100 text-neutral-800'}`}>
                            {t(STATUS_LABELS[reservation.statut] || reservation.statut)}
                          </span>

                          {(reservation.statut === 'en_attente' || reservation.statut === 'acceptee') && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                            >
                              {t('cancelReservation')}
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
                  <h3 className="text-lg font-bold text-[#1A2951] font-display">
                    {t('notificationsAndResponses')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('receiveNotifWhenReply')}
                  </p>
                </div>
                {unreadNotifsCount > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                    {unreadNotifsCount} {t('unread')}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">{t('noNotificationsYet')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('noNotificationsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 rounded-2xl border cursor-pointer transition hover:bg-neutral-100 ${
                        !notif.lu
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                            !notif.lu ? 'bg-[#1A2951] text-[#FB923C]' : 'bg-neutral-200 text-slate-600'
                          }`}>
                            💬
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : t('loading')}
                            </span>
                          </div>
                        </div>

                        {!notif.lu && (
                          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal تفاصيل الإشعار */}
              {selectedNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-[#1A2951] font-display">تفاصيل الإشعار</h3>
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-neutral-50 rounded-xl border border-gray-100">
                        <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                          {selectedNotification.message}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString('ar-DZ') : ''}
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="px-5 py-2 bg-[#1A2951] text-white text-sm font-bold rounded-xl hover:bg-[#F97316] hover:text-[#1A2951] transition cursor-pointer"
                      >
                        {t('close') || 'إغلاق'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-bold text-[#1A2951] mb-4 font-display">
                {t('profile')}
              </h3>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 space-y-4 max-w-lg">
                <div className="flex items-center gap-4 border-b border-neutral-200 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1A2951] text-[#FB923C] text-xl font-extrabold flex items-center justify-center shadow-sm">
                    {(user?.prenom || user?.nom || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A2951] text-base">{user?.prenom} {user?.nom}</h4>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase">
                      {t('accountType')}: {user?.role === 'owner' ? t('owner') : t('client')}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-slate-500">{t('emailAddress')}:</span>
                    <span className="font-bold text-[#1A2951]">{user?.email || t('noResults')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-slate-500">{t('phoneNumber')}:</span>
                    <span className="font-bold text-[#1A2951]">{user?.telephone || t('noResults')}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{t('registeredSince')}:</span>
                    <span className="font-bold text-[#1A2951]">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('loading')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 className="text-lg font-bold text-[#1A2951] mb-1 font-display">
                {t('supportMessage')}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {t('askHere')}
              </p>

              {contactSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  {contactSuccess}
                </div>
              )}

              <form onSubmit={handleSendSupportMessage} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('subject')} *</label>
                  <input
                    type="text"
                    value={contactForm.sujet}
                    onChange={(e) => setContactForm({ ...contactForm, sujet: e.target.value })}
                    required
                    placeholder={t('subject')}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#F97316] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('message')} *</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    placeholder={t('message')}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#F97316] outline-none transition"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-6 py-2.5 bg-[#1A2951] hover:bg-[#F97316] hover:text-[#1A2951] text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {contactSubmitting ? t('loading') : t('send')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reservations
