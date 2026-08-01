import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import * as notificationsApi from '../api/notifications'

const Notifications = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getMyNotifications()
      if (data.success) {
        setNotifications(data.data || [])
      }
    } catch (err) {
      setError(t('errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification)
    if (!notification.lu) {
      await notificationsApi.markNotificationAsRead(notification.id)
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, lu: true } : n))
    }
  }

  const getNotificationIcon = (type) => {
    const iconClass = "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
    const svgClass = "w-5 h-5"
    if (type?.startsWith('reservation')) {
      return (
        <div className={`${iconClass} bg-blue-50 text-blue-500`}>
          <svg className={svgClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }
    if (type?.startsWith('validation') || type === 'establishment_validated') {
      return (
        <div className={`${iconClass} bg-green-50 text-green-500`}>
          <svg className={svgClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
    return (
      <div className={`${iconClass} bg-amber-50 text-amber-500`}>
        <svg className={svgClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A2951]">{t('notifications')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('manageNotificationsDesc')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('noNotifications')}</h3>
            <p className="text-slate-500 max-w-xs mx-auto">{t('noNotificationsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative overflow-hidden bg-white rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
                  !notification.lu ? 'border-[#F97316]/30 bg-[#F97316]/5' : 'border-slate-100'
                }`}
              >
                {!notification.lu && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F97316]" />
                )}
                
                <div className="p-5 flex items-start gap-4">
                  {getNotificationIcon(notification.type)}

                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed mb-2 ${!notification.lu ? 'text-[#1A2951] font-bold' : 'text-slate-600'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(notification.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'en-US')}
                      </span>
                      {!notification.lu && (
                        <span className="text-[10px] bg-[#F97316] text-white px-2 py-0.5 rounded-full font-bold">
                          {t('new')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={i18n.language === 'ar' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal تفاصيل الإشعار */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-[#1A2951]">{t('notificationDetails')}</h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition"
                >
                  ✕
                </button>
              </div>
              <div className="p-8">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                  <p className="text-[#1A2951] leading-relaxed font-medium whitespace-pre-wrap text-sm">
                    {selectedNotification.message}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'en-US') : ''}
                  </span>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 py-2.5 bg-[#1A2951] text-white text-xs font-bold rounded-xl hover:bg-[#F97316] hover:text-[#1A2951] transition shadow-lg shadow-[#1A2951]/10"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
