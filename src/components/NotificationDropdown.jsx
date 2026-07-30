import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export function NotificationDropdown() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(10)
    
    if (!error && data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const fetchUnreadCount = async () => {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .eq('lu', false)
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()

    const channel = supabase
      .channel('notifications-navbar')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` },
        () => fetchUnreadCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (notif) => {
    if (notif.lu) return
    const { error } = await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', notif.id)
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n))
      fetchUnreadCount()
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full border border-[#152A54]/15 text-[#152A54] hover:bg-[#152A54]/5 hover:border-[#CB9A56] transition cursor-pointer"
        title={t('notifications')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50">
            <h3 className="text-sm font-bold text-[#152A54]">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-[#CB9A56]/20 text-[#CB9A56] px-2 py-0.5 rounded-full font-bold">
                {unreadCount} {t('unread')}
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto thin-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CB9A56] mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-xs">{t('noNotifications')}</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n)}
                    className={`px-4 py-3 hover:bg-neutral-50 transition cursor-pointer ${!n.lu ? 'bg-[#CB9A56]/5' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.lu ? 'bg-[#CB9A56]' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className={`text-xs leading-relaxed ${!n.lu ? 'font-bold text-[#152A54]' : 'text-slate-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-[11px] font-bold text-[#CB9A56] hover:bg-[#CB9A56]/10 border-t border-neutral-100 transition"
          >
            {t('viewAll')}
          </Link>
        </div>
      )}
    </div>
  )
}
