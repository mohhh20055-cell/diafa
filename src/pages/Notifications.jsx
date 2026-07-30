import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import * as notificationsApi from '../api/notifications'

const Notifications = () => {
  const { user } = useAuth()
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
      setError('حدث خطأ أثناء تحميل التنبيهات.')
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
    const iconClass = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
    const svgClass = "w-5 h-5"
    if (type?.startsWith('reservation')) {
      return (
        <div className={`${iconClass} bg-blue-100`}>
          <svg className={`${svgClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    }
    if (type?.startsWith('validation') || type === 'establishment_validated') {
      return (
        <div className={`${iconClass} bg-green-100`}>
          <svg className={`${svgClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
    return (
      <div className={`${iconClass} bg-gray-100`}>
        <svg className={`${svgClass} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 7) return `منذ ${days} يوم`
    return date.toLocaleDateString('ar-DZ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#152A54]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#152A54] mb-8" style={{ fontFamily: 'Fraunces, serif' }}>
          التنبيهات
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-gray-500 text-lg">لا توجد تنبيهات حالياً.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 flex gap-4 cursor-pointer transition hover:bg-neutral-50 ${notification.lu ? 'bg-white' : 'bg-blue-50/70'}`}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{notification.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                  </div>
                  {!notification.lu && (
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal تفاصيل الإشعار */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#152A54]">تفاصيل الإشعار</h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-gray-100">
                  <p className="text-gray-900 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString('ar-DZ') : ''}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-5 py-2 bg-[#152A54] text-white text-sm font-bold rounded-xl hover:bg-[#CB9A56] hover:text-[#152A54] transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
