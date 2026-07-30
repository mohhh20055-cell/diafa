import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { IconBell, IconEdit } from '../components/Icons'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import Logo from '../components/Logo'
import * as adminApi from '../api/admin'
import * as establishmentsApi from '../api/establishments'
import * as reservationsApi from '../api/reservations'
import * as contactApi from '../api/contact'
import * as reviewsApi from '../api/reviews'
import { WILAYAS } from '../constants/wilayas'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const CHART_COLORS = ['#CB9A56', '#0E1E3D', '#E4C48A', '#60a5fa', '#34d399', '#f87171']
const OVERVIEW_PIE_COLORS = ['#34d399', '#f97316', '#8b5cf6']

const VALID_TABS = ['overview', 'pending', 'create', 'reservations', 'messages', 'users', 'stats']

const RESERVATION_STATUS_LABELS = {
  en_attente: 'pending',
  acceptee: 'accepted',
  refusee: 'rejected',
  annulee: 'cancelled',
  terminee: 'finished',
}

const RESERVATION_STATUS_STYLES = {
  en_attente: 'bg-amber-100 text-amber-800',
  acceptee: 'bg-emerald-100 text-emerald-800',
  refusee: 'bg-rose-100 text-rose-800',
  annulee: 'bg-slate-200 text-slate-600',
  terminee: 'bg-sky-100 text-sky-800',
}

const AdminDashboard = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const { user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { tab: tabParam } = useParams()
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview'
  const goToTab = (id) => navigate(`/admin/dashboard/${id}`)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [pendingEstablishments, setPendingEstablishments] = useState([])
  const [validatedEstablishments, setValidatedEstablishments] = useState([])
  const [contactMessages, setContactMessages] = useState([])
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyStatus, setReplyStatus] = useState(null)

  const handleSendReply = async (msg) => {
    if (!replyText.trim()) return
    setReplySending(true)
    setReplyStatus(null)

    const res = await contactApi.replyToContactMessage({
      messageId: msg.id,
      recipientEmail: msg.email,
      recipientNom: msg.nom,
      sujet: msg.sujet,
      replyText: replyText.trim(),
    })

    setReplySending(false)
    if (res.success) {
      setReplyStatus({
        id: msg.id,
        message: res.message || 'تم إرسال الرد والإشعار بنجاح!',
        isSuccess: true,
      })
      setContactMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, repondu: true, reponse: replyText.trim() } : m
        )
      )
      setReplyText('')
      setActiveReplyId(null)
    } else {
      setReplyStatus({
        id: msg.id,
        message: res.message || 'حدث خطأ أثناء إرسال الرد',
        isSuccess: false,
      })
    }
  }
  const [allReservations, setAllReservations] = useState([])
  const [reservationFilter, setReservationFilter] = useState('tous')
  const [globalRating, setGlobalRating] = useState({ avgRating: 0, reviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedEst, setSelectedEst] = useState(null)
  const profileRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', email: '', telephone: '', motDePasse: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id)
        .eq('lu', false)
      if (!cancelled) setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel('admin-notifications-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` },
        () => fetchUnread()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` },
        () => fetchUnread()
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [user])

  const openEditProfile = () => {
    setEditForm({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      motDePasse: '',
    })
    setEditError(null)
    setEditSuccess(null)
    setProfileOpen(false)
    setEditProfileOpen(true)
  }

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(null)

    if (editForm.motDePasse && editForm.motDePasse.length < 8) {
      setEditError(t('passwordTooShort'))
      return
    }

    setEditSaving(true)
    const payload = {
      nom: editForm.nom,
      prenom: editForm.prenom,
      email: editForm.email,
      telephone: editForm.telephone,
    }
    if (editForm.motDePasse) payload.motDePasse = editForm.motDePasse

    const result = await updateProfile(payload)
    setEditSaving(false)

    if (result.success) {
      setEditSuccess('تم تحديث المعلومات بنجاح.')
      setEditForm((prev) => ({ ...prev, motDePasse: '' }))
    } else {
      setEditError(result.error || 'حدث خطأ أثناء التحديث.')
    }
  }

  const loadData = async () => {
    try {
      const [statsData, usersData, pendingData, allEstData, messagesData, ratingData, reservationsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        establishmentsApi.getPendingEstablishments(),
        establishmentsApi.getAllEstablishments(),
        contactApi.getContactMessages(),
        reviewsApi.getGlobalRatingStats(),
        reservationsApi.getAllReservations(),
      ])

      if (statsData.success) setStats(statsData.data)
      if (usersData.success) setUsers(usersData.data || [])
      if (pendingData.success) setPendingEstablishments(pendingData.data || [])
      if (allEstData.success) setValidatedEstablishments(allEstData.data || [])
      if (messagesData.success) setContactMessages(messagesData.data || [])
      if (ratingData.success) setGlobalRating(ratingData.data)
      if (reservationsData.success) setAllReservations(reservationsData.data || [])
    } catch (err) {
      console.error('خطأ في تحميل بيانات المدير:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateEstablishment = async (id, statut) => {
    try {
      const action = statut === 'valide' || statut === 'APPROVED'
        ? establishmentsApi.approveEstablishment
        : establishmentsApi.rejectEstablishment
      const res = await action(id)
      if (!res.success) {
        alert(res.message || "حدث خطأ أثناء المصادقة على المؤسسة.")
        return
      }
      setSelectedEst(null)
      loadData()
    } catch (err) {
      alert("حدث خطأ أثناء المصادقة على المؤسسة.")
    }
  }

  const handleSetFeaturedImage = async (id, imageUrl) => {
    try {
      const res = await establishmentsApi.setFeaturedImage(id, imageUrl)
      if (res.success) {
        setSelectedEst((prev) => (prev && prev.id === id ? { ...prev, imageVedette: imageUrl } : prev))
        loadData()
      } else {
        alert(res.message || "حدث خطأ أثناء تحديث الصورة.")
      }
    } catch (err) {
      alert("حدث خطأ أثناء تحديث الصورة.")
    }
  }


  const handleUpdateUserStatus = async (id, statut) => {
    try {
      await adminApi.updateUserStatus(id, { statut })
      loadData()
    } catch (err) {
      alert('حدث خطأ أثناء تحديث حالة المستخدم.')
    }
  }

  const handleDeleteUser = async (id, name) => {
    if (!confirm(
      `هل أنت متأكد من حذف المستخدم « ${name} » بشكل نهائي؟\n\n` +
      `سيتم حذف جميع بياناته (المؤسسات، الغرف، الحجوزات، التقييمات، الإشعارات).\n` +
      `يمكن إعادة استخدام بريده الإلكتروني للتسجيل مجدداً.\n\n` +
      `هذا الإجراء لا يمكن التراجع عنه.`
    )) return

    try {
      const res = await adminApi.deleteUser(id)
      if (res.success) {
        loadData()
      } else {
        alert(res.message || 'حدث خطأ أثناء الحذف.')
      }
    } catch (err) {
      alert('حدث خطأ أثناء حذف المستخدم.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F1]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E1E3D]"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: t('overview'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'pending', label: t('pendingValidation'), count: pendingEstablishments.length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'create', label: t('addEstablishment'), icon: 'M12 4v16m8-8H4' },
    { id: 'reservations', label: t('reservations'), count: allReservations.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'messages', label: t('contactMessages'), count: contactMessages.length, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'users', label: t('users'), count: users.length, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'stats', label: t('stats'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]

  return (
    <>
    <div className="min-h-screen bg-[#FAF7F1] flex flex-col lg:flex-row">
      {/* ---------- الشريط الجانبي ---------- */}
      <aside className="shrink-0 bg-[#0E1E3D] text-white border-b lg:border-b-0 lg:border-r border-[#CB9A56]/20 lg:w-64 lg:min-h-screen lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Logo className="h-8" withText={false} dark />
          <div className="min-w-0">
            <p className="font-display font-bold text-sm truncate leading-tight">{t('controlPanel')}</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible px-3 py-3 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                to={`/admin/dashboard/${tab.id}`}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 lg:shrink lg:w-full border ${
                  isActive
                    ? 'bg-[#CB9A56]/15 text-[#E4C48A] border-[#CB9A56]/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#CB9A56]' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="flex-1 text-left">{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ---------- العمود الرئيسي ---------- */}
      <div className="flex-1 min-w-0">
        {/* شريط علوي رفيع */}
        <div className="flex items-center justify-between lg:justify-end gap-3 px-4 sm:px-6 lg:px-8 py-3.5 border-b border-neutral-200 bg-white">
          <LanguageSwitcher />
          <Link
            to="/etablissements"
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CB9A56] hover:bg-[#E4C48A] text-[#0E1E3D] text-xs font-bold transition shadow-sm"
          >
            {t('viewPlatform')}
          </Link>

          <Link
            to="/notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-full border border-[#0E1E3D]/15 text-[#0E1E3D] hover:bg-[#0E1E3D]/5 hover:border-[#CB9A56] transition"
            title={t('notifications')}
          >
            <IconBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E1E3D]/5 hover:bg-[#0E1E3D]/10 border border-[#0E1E3D]/15 text-[#0E1E3D] text-xs font-bold transition"
            >
              <div className="w-7 h-7 rounded-full bg-[#CB9A56] text-[#0E1E3D] font-extrabold flex items-center justify-center text-xs">
                {user?.prenom?.[0] || 'A'}
              </div>
              <span className="hidden sm:inline">{t('adminProfile')}</span>
              <svg className={`w-3.5 h-3.5 text-[#0E1E3D]/60 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-neutral-200 py-2 text-slate-800 z-50">
                <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60 rounded-t-2xl">
                  <p className="text-xs font-bold text-[#0E1E3D]">{user?.prenom || t('adminProfile')} {user?.nom || ''}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || t('adminProfile')}</p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#0E1E3D] hover:bg-[#CB9A56]/15 transition flex items-center gap-2"
                  >
                    <IconEdit className="w-4 h-4 text-[#CB9A56]" />
                    <span>{t('editMyInfo')}</span>
                  </button>
                </div>
                <div className="pt-1 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                      navigate('/')
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats?._hasErrors && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 text-xs font-semibold">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{t('supabaseError')}</span>
          </div>
        )}
        {/* الإحصائيات */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('usersManagement')}</p>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0E1E3D] mt-1 font-display">
                {stats.totalUsers || users.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{t('clientsAndOwnersDesc')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0E1E3D]">{t('establishmentsManagement')}</p>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0E1E3D] mt-1 font-display">
                {stats.totalEstablishments || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{t('registredOnPlatform')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">{t('reservations')}</p>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 font-display">
                {stats.totalReservations || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{t('madeByClients')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">{t('pendingValidation')}</p>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-display">
                {pendingEstablishments.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{t('awaitingAdminApproval')}</p>
            </div>
          </div>
        )}

        {/* لوحات محتوى التبويبات */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 sm:p-8">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#CB9A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('pendingEstCount', { count: pendingEstablishments.length })}
                  </h4>
                  {pendingEstablishments.length === 0 ? (
                    <p className="text-xs text-slate-500">{t('noPendingEsts')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {pendingEstablishments.map((est) => (
                        <li key={est.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-neutral-200">
                          <div>
                            <p className="font-bold text-[#0E1E3D]">{est.nom}</p>
                            <p className="text-slate-400">{est.ville}, {est.wilaya} ({t(est.type)})</p>
                          </div>
                          <button
                            onClick={() => { setSelectedEst(est.id); goToTab('pending') }}
                            className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#CB9A56] text-[#0E1E3D]"
                          >
                            {t('review')} ←
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#CB9A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {t('lastUsersCount', { count: users.length })}
                  </h4>
                  {users.length === 0 ? (
                    <p className="text-xs text-slate-500">{t('noUsersRegistered')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {users.slice(0, 4).map((u) => (
                        <li key={u.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-neutral-200">
                          <div>
                            <p className="font-bold text-[#0E1E3D]">{u.prenom} {u.nom}</p>
                            <p className="text-slate-400">{u.email || u.telephone}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.role === 'owner' ? t('estOwnerAccount') : t('customerAccount')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="border border-neutral-200 rounded-2xl p-5 bg-white">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-4">{t('top5WilayasEst')}</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      layout="vertical"
                      data={Object.entries(
                        validatedEstablishments.reduce((acc, e) => {
                          if (!e.wilaya) return acc
                          acc[e.wilaya] = (acc[e.wilaya] || 0) + 1
                          return acc
                        }, {})
                      )
                        .map(([name, value]) => ({ name, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      <Bar dataKey="value" name={t('establishments')} fill="#0E1E3D" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-neutral-200 rounded-2xl p-5 bg-white">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-4">{t('estByTypePie')}</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('hotels'), value: validatedEstablishments.filter((e) => e.type === 'hotel').length },
                          { name: t('dortoirs'), value: validatedEstablishments.filter((e) => e.type === 'mraqed').length },
                          { name: t('maisons'), value: validatedEstablishments.filter((e) => e.type === 'maison').length },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {[0, 1, 2].map((i) => (
                          <Cell key={i} fill={OVERVIEW_PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                {t('pendingEstablishments')}
              </h3>
              {pendingEstablishments.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 mx-auto text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">{t('noPendingEsts')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('processedAllEsts')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEstablishments.map((est) => (
                    <div key={est.id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="flex flex-col md:flex-row">
                        {/* الصورة */}
                        <div className="md:w-64 h-48 md:h-auto bg-neutral-100 shrink-0">
                          {(est.imageVedette || (est.images && est.images.length > 0)) ? (
                            <img
                              src={est.imageVedette || est.images[0]}
                              alt={est.nom}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* التفاصيل */}
                        <div className="flex-1 p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div>
                              <h4 className="font-bold text-[#0E1E3D] text-lg">{est.nom}</h4>
                              <p className="text-xs text-slate-500 mt-1">
                                <span className="inline-block bg-[#CB9A56]/15 text-[#0E1E3D] px-2 py-0.5 rounded-full font-bold uppercase mr-2">
                                  {t(est.type)}
                                </span>
                                {est.ville}, {est.wilaya}
                              </p>
                              {est.adresse && (
                                <p className="text-xs text-slate-400 mt-1">{est.adresse}</p>
                              )}
                            </div>
                            <span className="self-start px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              {t('pending')}
                            </span>
                          </div>

                          {/* معلومات المالك */}
                          <div className="bg-neutral-50 rounded-xl p-3 mb-3 border border-neutral-100">
                            <p className="text-xs font-bold text-slate-600 mb-1">{t('ownerCol')}</p>
                            <p className="text-xs text-slate-700">
                              {est.owner?.prenom} {est.owner?.nom}
                              {est.owner?.email && <span className="text-slate-400"> — {est.owner.email}</span>}
                              {est.owner?.telephone && <span className="text-slate-400"> — {est.owner.telephone}</span>}
                            </p>
                          </div>

                          {/* الوصف */}
                          {est.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-3">{est.description}</p>
                          )}

                          {/* معرض الصور المصغرة */}
                          {est.images && est.images.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto">
                              {est.images.slice(0, 5).map((img, i) => (
                                <img key={i} src={img} alt={`${est.nom} ${i + 1}`} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-neutral-200" />
                              ))}
                            </div>
                          )}

                          {/* الإجراءات */}
                          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                            <button
                              onClick={() => handleValidateEstablishment(est.id, 'valide')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t('accept')}
                            </button>
                            <button
                              onClick={() => handleValidateEstablishment(est.id, 'refuse')}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {t('reject')}
                            </button>
                            <button
                              onClick={() => setSelectedEst(est)}
                              className="bg-white hover:bg-neutral-50 text-[#0E1E3D] border border-neutral-200 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {t('reviewEstImages', { count: est.images?.length ? `(${est.images.length})` : '' })}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEst && (
            <EstablishmentImagesModal
              establishment={selectedEst}
              onClose={() => setSelectedEst(null)}
              onSelectFeatured={(imageUrl) => handleSetFeaturedImage(selectedEst.id, imageUrl)}
            />
          )}

          {activeTab === 'create' && (
            <CreateEstablishmentForm
              owners={users.filter(u => u.role === 'owner')}
              onSuccess={loadData}
            />
          )}

          {activeTab === 'reservations' && (
            <AdminReservationsTab
              reservations={allReservations}
              filter={reservationFilter}
              setFilter={setReservationFilter}
            />
          )}

          {activeTab === 'messages' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0E1E3D] font-display">
                    {t('contactMessages')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('adminResponse')}
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full">
                  {t('allMessages', { count: contactMessages.length })}
                </span>
              </div>

              {contactMessages.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700">{t('noContactMessages')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('newMessagesAuto')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {contactMessages.map((msg) => (
                    <div key={msg.id} className="border border-neutral-200 rounded-2xl p-5 bg-white hover:border-[#CB9A56]/40 transition shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#0E1E3D] text-base">{msg.sujet || t('noSubject')}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {msg.type || t('contact')}
                            </span>
                            {msg.repondu && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                ✓ {t('replied')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t('from')} <strong className="text-slate-800">{msg.nom}</strong> &lt;{msg.email}&gt;
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString(isAr ? 'ar-DZ' : 'en-US') : t('recent')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (activeReplyId === msg.id) {
                                setActiveReplyId(null)
                              } else {
                                setActiveReplyId(msg.id)
                                setReplyText(msg.reponse || '')
                                setReplyStatus(null)
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>{activeReplyId === msg.id ? t('close') : t('replyWithNotif')}</span>
                          </button>
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.sujet || 'Diyafa Contact')}`}
                            title={t('sendDirectEmail')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{t('email')}</span>
                          </a>
                        </div>
                      </div>

                      <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {/* عرض الرد الموجود */}
                      {msg.reponse && activeReplyId !== msg.id && (
                        <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900">
                          <div className="font-bold mb-1 flex items-center gap-1 text-emerald-800">
                            <span>{t('adminReply')}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-emerald-900">{msg.reponse}</p>
                        </div>
                      )}

                      {/* نموذج الرد المضمن */}
                      {activeReplyId === msg.id && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                            {t('replyOnMessage')}
                          </label>
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t('replyPlaceholder')}
                            className="w-full p-3 text-xs bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                          />
                          <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
                            <span className="text-[11px] text-slate-500">
                              {t('to')} <strong className="text-slate-700">{msg.nom}</strong> ({msg.email})
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReplyId(null)
                                  setReplyText('')
                                }}
                                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                              >
                                {t('cancel')}
                              </button>
                              <button
                                type="button"
                                disabled={replySending || !replyText.trim()}
                                onClick={() => handleSendReply(msg)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#CB9A56] hover:bg-[#b08343] text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
                              >
                                {replySending ? (
                                  <span>{t('sending')}</span>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    <span>{t('sendReplyAndNotif')}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ملاحظات حالة الرد */}
                      {replyStatus?.id === msg.id && (
                        <div className={`mt-2 p-2.5 rounded-lg text-xs font-semibold ${
                          replyStatus.isSuccess
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {replyStatus.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                {t('usersManagement')}
              </h3>
              
              {/* --- الزبائن --- */}
              <h4 className="text-sm font-bold text-slate-700 mb-3 mt-6">{t('customers')}</h4>
              {users.filter(u => u.role === 'client').length === 0 ? (
                <p className="text-xs text-slate-500 mb-6">{t('noCustomers')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-200 mb-8">
                  <table className="min-w-full divide-y divide-neutral-200 text-left">
                    <thead className="bg-neutral-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">{t('nameCol')}</th>
                        <th className="px-4 py-3">{t('contactInfoCol')}</th>
                        <th className="px-4 py-3">{t('statusCol')}</th>
                        <th className="px-4 py-3 text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {users.filter(u => u.role === 'client').map((u) => (
                        <tr key={u.id} className="hover:bg-neutral-50/80">
                          <td className="px-4 py-3.5 font-bold text-[#0E1E3D]">{u.prenom} {u.nom}</td>
                          <td className="px-4 py-3.5 text-slate-500">{u.email || u.telephone}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${u.statut === 'actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {u.statut === 'actif' ? t('activeStatus') : t('blockedStatus')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, u.statut === 'actif' ? 'bloque' : 'actif')}
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${u.statut === 'actif' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                              >
                                {u.statut === 'actif' ? t('block') : t('activate')}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, `${u.prenom} ${u.nom}`)}
                                className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-600 text-white"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- أصحاب المؤسسات --- */}
              <h4 className="text-sm font-bold text-slate-700 mb-3 mt-6">{t('estOwners')}</h4>
              {users.filter(u => u.role === 'owner').length === 0 ? (
                <p className="text-xs text-slate-500 mb-6">{t('noOwners')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200 text-left">
                    <thead className="bg-neutral-50 text-xs font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">{t('nameCol')}</th>
                        <th className="px-4 py-3">{t('contactInfoCol')}</th>
                        <th className="px-4 py-3">{t('statusCol')}</th>
                        <th className="px-4 py-3 text-right">{t('actionsCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs">
                      {users.filter(u => u.role === 'owner').map((u) => (
                        <tr key={u.id} className="hover:bg-neutral-50/80">
                          <td className="px-4 py-3.5 font-bold text-[#0E1E3D]">{u.prenom} {u.nom}</td>
                          <td className="px-4 py-3.5 text-slate-500">{u.email || u.telephone}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${u.statut === 'actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {u.statut === 'actif' ? t('activeStatus') : t('blockedStatus')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, u.statut === 'actif' ? 'bloque' : 'actif')}
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${u.statut === 'actif' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                              >
                                {u.statut === 'actif' ? t('block') : t('activate')}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, `${u.prenom} ${u.nom}`)}
                                className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-600 text-white"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                {t('generalStats')}
              </h3>
              <p className="text-xs text-slate-600 mb-6">
                {t('platformUsageStats')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">{t('reservationsAcceptRate')}</p>
                  <p className="text-xl font-extrabold text-[#0E1E3D] mt-1">
                    {stats?.totalReservations
                      ? `${Math.round((stats.acceptedReservations / stats.totalReservations) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('acceptedFromTotal', { accepted: stats?.acceptedReservations || 0, total: stats?.totalReservations || 0 })}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">{t('newUsersLast7Days')}</p>
                  <p className="text-xl font-extrabold text-[#0E1E3D] mt-1">
                    {users.filter((u) => u.createdAt && (Date.now() - new Date(u.createdAt).getTime()) <= 7 * 24 * 60 * 60 * 1000).length}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t('fromTotalUsers', { count: users.length })}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">{t('coveredWilayas')}</p>
                  <p className="text-xl font-extrabold text-[#0E1E3D] mt-1">
                    {t('wilayasCount', { count: new Set(
                      validatedEstablishments
                        .filter((e) => e.statut_validation === 'valide')
                        .map((e) => e.wilaya)
                        .filter(Boolean)
                    ).size })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{t('amongValidatedEsts')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* الحجوزات حسب الحالة */}
                <div className="border border-neutral-200 rounded-2xl p-5 bg-white">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-4">{t('reservationsByStatus')}</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[
                        { name: t('pending'), value: stats?.pendingReservations || 0 },
                        { name: t('accepted'), value: stats?.acceptedReservations || 0 },
                        { name: t('rejected'), value: stats?.rejectedReservations || 0 },
                      ]}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }}
                      />
                      <Bar dataKey="value" name={t('reservations')} fill="#CB9A56" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* المؤسسات المصادق عليها مقابل في الانتظار */}
                <div className="border border-neutral-200 rounded-2xl p-5 bg-white">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-4">{t('estValidatedVsPending')}</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: t('validated'), value: stats?.totalEstablishments || 0 },
                          { name: t('pending'), value: pendingEstablishments.length },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {[0, 1].map((i) => (
                          <Cell key={i} fill={CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* توزيع المستخدمين */}
                <div className="border border-neutral-200 rounded-2xl p-5 bg-white lg:col-span-2">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-4">{t('usersDistribution')}</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: t('customers'), value: stats?.totalClients || 0 },
                        { name: t('estOwners'), value: stats?.totalOwners || 0 },
                      ]}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eee8" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      <Bar dataKey="value" name={t('users')} fill="#0E1E3D" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>

    {editProfileOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
            <h3 className="text-sm font-bold text-[#0E1E3D]">{t('editMyInfo')}</h3>
            <button
              type="button"
              onClick={() => setEditProfileOpen(false)}
              className="text-slate-400 hover:text-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleEditProfileSubmit} className="p-5 space-y-4">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs font-semibold">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2.5 rounded-xl text-xs font-semibold">
                {editSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('firstName')}</label>
                <input
                  type="text"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('lastName')}</label>
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('phone')}</label>
              <input
                type="text"
                value={editForm.telephone}
                onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {t('newPassword')} <span className="font-normal text-slate-400">({t('leaveEmptyForNoChange')})</span>
              </label>
              <input
                type="password"
                value={editForm.motDePasse}
                onChange={(e) => setEditForm({ ...editForm, motDePasse: e.target.value })}
                placeholder="••••••••"
                className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-slate-600 hover:bg-neutral-50 transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-sm font-bold transition disabled:opacity-50"
              >
                {editSaving ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}

// ============================================================
// تبويب حجوزات المدير — كل الحجوزات، كل الحالات، بما في ذلك اليوم
// ============================================================
const isToday = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

const AdminReservationsTab = ({ reservations, filter, setFilter }) => {
  const { t } = useTranslation()
  const filters = [
    { id: 'tous', label: t('allFilters') },
    { id: 'aujourdhui', label: t('today') },
    { id: 'en_attente', label: t('pending') },
    { id: 'acceptee', label: t('accepted') },
    { id: 'refusee', label: t('rejected') },
    { id: 'annulee', label: t('cancelled') },
    { id: 'terminee', label: t('finished') },
  ]

  const filtered = reservations.filter((r) => {
    if (filter === 'tous') return true
    if (filter === 'aujourdhui') return isToday(r.dateArrivee) || isToday(r.createdAt)
    return r.statut === filter
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#0E1E3D] font-display">
            {t('reservations')}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('allPlatformReservations')}
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-[#CB9A56]/15 text-[#0E1E3D] text-xs font-bold rounded-full">
          {t('totalReservationsCount', { count: reservations.length })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              filter === f.id
                ? 'bg-[#0E1E3D] text-white border-[#0E1E3D]'
                : 'bg-white text-slate-600 border-neutral-200 hover:border-[#CB9A56]/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">{t('noReservationsFilter')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('newReservationsAuto')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-2xl bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-left">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('customerCol')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('estCol')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('arrivalCol')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('departureCol')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('priceCol')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('statusCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50/60">
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {r.client ? `${r.client.prenom || ''} ${r.client.nom || ''}`.trim() || r.client.email : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{r.etablissement?.nom || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {r.dateArrivee ? new Date(r.dateArrivee).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'en-US') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {r.dateDepart ? new Date(r.dateDepart).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'en-US') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                    {r.prixTotal ? `${r.prixTotal} ${t('da')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${RESERVATION_STATUS_STYLES[r.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {t(r.statut)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================
// نافذة صور المؤسسة — يختار المدير الصورة "الأفضل" للبطاقة
// ============================================================
const EstablishmentImagesModal = ({ establishment, onClose, onSelectFeatured }) => {
  const { t } = useTranslation()
  const images = establishment.images && establishment.images.length > 0 ? establishment.images : []
  const defaultImage = images[0] || null
  const currentFeatured = establishment.imageVedette || defaultImage

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h4 className="font-bold text-[#0E1E3D] text-base">{establishment.nom}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('chooseFeaturedImgDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-neutral-100 hover:text-slate-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {images.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <p className="text-sm font-semibold text-slate-700">{t('noImagesForEst')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((img, i) => {
                const isFeatured = img === currentFeatured
                return (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`${establishment.nom} ${i + 1}`}
                      className={`w-full h-32 sm:h-36 object-cover rounded-xl border-2 transition ${
                        isFeatured ? 'border-[#CB9A56]' : 'border-transparent'
                      }`}
                    />
                    {isFeatured && (
                      <span className="absolute top-2 left-2 bg-[#CB9A56] text-[#0E1E3D] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                        {t('currentFeatured')}
                      </span>
                    )}
                    {img === defaultImage && (
                      <span className="absolute top-2 right-2 bg-white/90 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        {t('default')}
                      </span>
                    )}
                    {!isFeatured && (
                      <button
                        type="button"
                        onClick={() => onSelectFeatured(img)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 rounded-xl transition"
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition bg-white text-[#0E1E3D] text-[11px] font-bold px-3 py-1.5 rounded-lg shadow">
                          {t('chooseAsFeatured')}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// نموذج إضافة مؤسسة (المدير يضيفها، مصادقة تلقائية)
// ============================================================
const CreateEstablishmentForm = ({ owners, onSuccess }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    nom: '',
    type: 'hotel',
    wilaya: 'Alger',
    ville: 'Alger',
    adresse: '',
    description: '',
    imageVedette: '',
    services: '',
    ownerId: '',
  })
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState(null)
  const MAX_PHOTOS = 5
  const MAX_SIZE_MB = 5
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handlePhotoChange = async (e) => {
    setPhotoError(null)
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = MAX_PHOTOS - photos.length
    if (remainingSlots <= 0) {
      setPhotoError(`الحد الأقصى ${MAX_PHOTOS} صور مسموح بها.`)
      e.target.value = ''
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    const validFiles = []
    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE_BYTES) {
        setPhotoError(`واحدة أو أكثر من الصور تتجاوز ${MAX_SIZE_MB} ميغابايت.`)
        continue
      }
      validFiles.push(file)
    }

    const newPhotos = await Promise.all(
      validFiles.map(async (file) => ({
        file,
        preview: await readFileAsDataURL(file),
      }))
    )

    setPhotos((prev) => [...prev, ...newPhotos])
    e.target.value = ''
  }

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const images = photos.map((p) => p.preview)
    const imageVedette = images[0] || null
    const services = formData.services
      ? formData.services.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const res = await establishmentsApi.adminCreateEstablishment({
      nom: formData.nom,
      type: formData.type,
      wilaya: formData.wilaya,
      ville: formData.ville,
      adresse: formData.adresse,
      description: formData.description,
      imageVedette,
      images,
      services,
      ownerId: formData.ownerId || undefined,
    })

    setSubmitting(false)

    if (res.success) {
      setSuccess(t('estCreatedAndValidatedSuccessfully'))
      setFormData({
        nom: '', type: 'hotel', wilaya: 'Alger', ville: 'Alger',
        adresse: '', description: '', imageVedette: '', services: '', ownerId: '',
      })
      setPhotos([])
      onSuccess?.()
    } else {
      setError(res.message || t('errorDuringCreation'))
    }
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-[#0E1E3D] mb-2 font-display">
        {t('addEstablishment')}
      </h3>
      <p className="text-xs text-slate-500 mb-6">
        {t('addDirectEstDesc')}
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('estName')} *</label>
            <input
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
              placeholder={t('hotelNameEx')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('estType')}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            >
              <option value="hotel">{t('hotel')}</option>
              <option value="mraqed">{t('mraqed')}</option>
              <option value="maison">{t('maison')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('wilaya')}</label>
            <select
              name="wilaya"
              value={formData.wilaya}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            >
              {WILAYAS.map((w, i) => (
                <option key={w} value={w}>{i + 1} - {w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('city')}</label>
            <input
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
              placeholder={t('cityEx')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('address')}</label>
          <input
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            placeholder={t('addressEx')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            placeholder={t('estDescPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('estImagesFromFile')}</label>
          {photoError && (
            <div className="mb-2 text-xs text-rose-600 font-medium">
              {photoError}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-[#CB9A56] bg-neutral-50/70 hover:bg-neutral-50 transition text-center mb-3">
              <svg className="w-6 h-6 text-[#CB9A56] mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-[#0E1E3D]">
                {t('clickToImportImagesWithMax', { max: MAX_PHOTOS })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {t('allowedImgFormatsWithMaxSize', { size: MAX_SIZE_MB })}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {photos.map((p, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 group">
                  <img src={p.preview} alt={`${t('preview')} ${index + 1}`} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow transition opacity-0 group-hover:opacity-100"
                    aria-label={t('delete')}
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-[#CB9A56] text-white text-[9px] font-bold px-1 rounded">
                      {t('featured')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('servicesWithCommas')}</label>
          <input
            name="services"
            value={formData.services}
            onChange={handleChange}
            className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            placeholder={t('servicesPlaceholder')}
          />
        </div>

        {owners && owners.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('ownerOptional')}</label>
            <select
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            >
              <option value="">— {t('adminMe')} —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.prenom} {o.nom} ({o.email || o.telephone})</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white px-6 py-3 rounded-xl text-sm font-bold transition shadow-md disabled:opacity-50"
        >
          {submitting ? t('adding') : t('createAndValidateEstNow')}
        </button>
      </form>
    </div>
  )
}

export default AdminDashboard
