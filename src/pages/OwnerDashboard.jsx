import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import * as establishmentsApi from '../api/establishments'
import * as reservationsApi from '../api/reservations'
import * as authApi from '../api/auth'
import { WILAYAS } from '../constants/wilayas'

const STATUT_LABELS = {
  en_attente: { text: 'En attente', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
  acceptee: { text: 'Acceptée', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  refusee: { text: 'Refusée', cls: 'bg-rose-100 text-rose-900 border-rose-300' },
  annulee: { text: 'Annulée', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  terminee: { text: 'Terminée', cls: 'bg-sky-100 text-sky-900 border-sky-300' },
}

const STATUT_ICON = {
  en_attente: '⏳',
  acceptee: '✅',
  refusee: '❌',
  annulee: '⊘',
  terminee: '✔',
}

const OwnerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [establishments, setEstablishments] = useState([])
  const [reservations, setReservations] = useState([])
  const [stats, setStats] = useState({ total: 0, enAttente: 0, acceptees: 0, refusees: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [editingEstablishment, setEditingEstablishment] = useState(null)
  const [showEstModal, setShowEstModal] = useState(false)

  const openEditEstablishment = (est) => {
    setEditingEstablishment(est)
    setShowEstModal(true)
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const profileData = await authApi.getMe()
      const prof = profileData.success ? profileData.data : user
      const ownerId = prof?.id || user?.id

      if (!ownerId) {
        setLoading(false)
        return
      }

      const [estData, resData] = await Promise.all([
        establishmentsApi.getEstablishments({ ownerId, includeUnvalidated: true }),
        reservationsApi.getOwnerReservations(),
      ])

      let ests = estData.success ? (estData.data || []) : []

      // If ests is still empty but user is an owner, build fallback establishment object
      if (ests.length === 0 && prof && (prof.role === 'owner' || prof.role === 'admin')) {
        const estNom = prof.nomEtablissement || prof.nometablissement || `Établissement ${prof.nom || ''} ${prof.prenom || ''}`.trim()
        ests = [{
          id: prof.id,
          owner_id: prof.id,
          nom: estNom,
          type: prof.typeEtablissement || prof.type_etablissement || 'hotel',
          wilaya: prof.wilaya || 'Alger',
          ville: prof.ville || 'Alger',
          adresse: prof.adresse || prof.ville || 'Alger',
          description: prof.description || `Établissement ${estNom}`,
          services: [],
          images: [],
          image_vedette: null,
          statut_validation: prof.statut_validation || prof.statutValidation || 'en_attente',
          actif: false,
          created_at: prof.created_at || new Date().toISOString(),
          rooms: []
        }]
      }

      const ress = resData.success ? (resData.data || []) : []

      setEstablishments(ests)
      setReservations(ress)
      setOwnerProfile(prof)

      setStats({
        total: ress.length,
        enAttente: ress.filter((r) => r.statut === 'en_attente').length,
        acceptees: ress.filter((r) => r.statut === 'acceptee').length,
        refusees: ress.filter((r) => r.statut === 'refusee').length,
      })
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptReservation = async (id) => {
    const res = await reservationsApi.acceptReservation(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.message || 'Erreur lors de l\'acceptation.')
    }
  }

  const handleRejectReservation = async (id) => {
    const res = await reservationsApi.rejectReservation(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.message || 'Erreur lors du refus.')
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
    { id: 'overview', label: 'Aperçu', labelAr: 'نظرة عامة', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'reservations', label: 'Réservations', labelAr: 'الحجوزات', count: stats.enAttente > 0 ? stats.enAttente : null, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'establishments', label: 'Établissements', labelAr: 'المؤسسات', count: establishments.length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5' },
    { id: 'chambres', label: 'Chambres & Offres', labelAr: 'الغرف والعروض', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  ]

  const activeTabObj = tabs.find((t) => t.id === activeTab)

  return (
    <div className="min-h-screen bg-[#FAF7F1] flex flex-col md:flex-row">
      {/* Mobile Top Navigation Bar */}
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
            <span className="text-[10px] uppercase tracking-wider text-[#CB9A56] font-bold">Espace Partenaire</span>
            <h2 className="text-sm font-bold text-white leading-tight">{activeTabObj?.label} ({activeTabObj?.labelAr})</h2>
          </div>
        </div>

        <Link
          to="/etablissements"
          className="px-3 py-1.5 rounded-lg bg-[#CB9A56] text-[#0E1E3D] text-xs font-bold"
        >
          Voir site
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-auto w-72 bg-[#0E1E3D] text-white flex flex-col justify-between border-r border-[#CB9A56]/20 transition-transform duration-300 ease-in-out shrink-0 h-screen ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#CB9A56] text-[#0E1E3D] font-black flex items-center justify-center text-lg shadow-md">
                D
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white leading-tight">Diyafa Partner</h2>
                <span className="text-[11px] text-[#E4C48A] font-medium">لوحة صاحب المؤسسة</span>
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

          {/* Owner Profile Brief */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#CB9A56] text-[#0E1E3D] font-extrabold flex items-center justify-center text-xs shrink-0">
              {(user?.prenom || user?.nom || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-[10px] text-[#E4C48A] truncate">{establishments[0]?.nom || user?.email || user?.telephone}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Tabs Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto thin-scrollbar">
          <p className="px-3 text-[10px] font-bold text-[#E4C48A] uppercase tracking-wider mb-2">
            القائمة / Tab Navigation
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
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
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
                    <span className={`block text-[10px] font-normal leading-tight ${isActive ? 'text-[#0E1E3D]/80' : 'text-slate-400'}`}>
                      {tab.labelAr}
                    </span>
                  </div>
                </div>

                {tab.count !== undefined && tab.count !== null && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                    isActive
                      ? 'bg-[#0E1E3D] text-white'
                      : tab.id === 'reservations' && stats.enAttente > 0
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/etablissements"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
          >
            <svg className="w-4 h-4 text-[#E4C48A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Voir le site / زيارة الموقع</span>
          </Link>

          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition border border-rose-500/30"
          >
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Déconnexion / تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Main Content Header Banner */}
        <div className="bg-[#0E1E3D] text-white rounded-2xl p-6 mb-8 border border-[#CB9A56]/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#E4C48A] text-xs font-semibold uppercase tracking-wider mb-1">
                <span>Espace Propriétaire / لوحة التحكم</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                Bonjour, {user?.prenom || 'Partenaire'} !
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Gérez vos établissements, suivez vos réservations et vos offres
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-right">
              <span className="text-[10px] text-slate-300 block">Réservations en attente</span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 justify-end">
                {stats.enAttente} demandes
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Réservations</p>
            <div className="text-2xl font-extrabold text-[#0E1E3D] mt-1 font-display">
              {stats.total}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Reçues à ce jour</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">En Attente</p>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 font-display">
              {stats.enAttente}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Nécessitent réponse</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Acceptées</p>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-display">
              {stats.acceptees}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Confirmées</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-neutral-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Refusées</p>
            <div className="text-2xl font-extrabold text-rose-600 mt-1 font-display">
              {stats.refusees}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Non disponibles</p>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-2 font-display">Aperçu général / نظرة عامة</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">
                Bienvenue dans votre espace propriétaire. Retrouvez vos informations clés ci-dessous.
              </p>
              
              {establishments.length > 0 ? (
                <div className={`mb-6 p-5 rounded-2xl border shadow-xs transition-all ${
                  (establishments[0].statut_validation === 'valide' || establishments[0].statut_validation === 'APPROVED')
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                    : (establishments[0].statut_validation === 'refuse' || establishments[0].statut_validation === 'refusee' || establishments[0].statut_validation === 'REJECTED')
                    ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}>
                  <div className="flex items-start gap-3.5">
                    <span className="text-3xl mt-0.5 shrink-0">
                      {(establishments[0].statut_validation === 'valide' || establishments[0].statut_validation === 'APPROVED') ? '✅' : (establishments[0].statut_validation === 'refuse' || establishments[0].statut_validation === 'refusee' || establishments[0].statut_validation === 'REJECTED') ? '❌' : '⏳'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-base sm:text-lg">
                          حالة المؤسسة: {
                            (establishments[0].statut_validation === 'valide' || establishments[0].statut_validation === 'APPROVED')
                              ? 'مقبولة وتعمل بنجاح (Validé)'
                              : (establishments[0].statut_validation === 'refuse' || establishments[0].statut_validation === 'refusee' || establishments[0].statut_validation === 'REJECTED')
                              ? 'مرفوضة (Refusé)'
                              : 'قيد الانتظار والمراجعة (En attente d\'approbation)'
                          }
                        </h4>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          (establishments[0].statut_validation === 'valide' || establishments[0].statut_validation === 'APPROVED')
                            ? 'bg-emerald-200/80 text-emerald-900 border-emerald-400'
                            : (establishments[0].statut_validation === 'refuse' || establishments[0].statut_validation === 'refusee' || establishments[0].statut_validation === 'REJECTED')
                            ? 'bg-rose-200/80 text-rose-900 border-rose-400'
                            : 'bg-amber-200/80 text-amber-900 border-amber-400'
                        }`}>
                          {establishments[0].nom}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed mt-1">
                        {(establishments[0].statut_validation === 'valide' || establishments[0].statut_validation === 'APPROVED') 
                          ? 'مؤسستك معتمدة ومقبولة من الإدارة. يمكنك الآن إضافة الغرف والعروض واستقبال الحجوزات.'
                          : (establishments[0].statut_validation === 'refuse' || establishments[0].statut_validation === 'refusee' || establishments[0].statut_validation === 'REJECTED')
                          ? 'تم رفض طلب اعتماد هذه المؤسسة من قِبل الإدارة. يرجى التواصل مع الدعم لمزيد من التفاصيل.'
                          : 'طلبك قيد المراجعة والتدقيق حالياً من فريق إدارة منصة ضيافة. سيتم تفعيل حسابك فور الموافقة عليه.'}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => openEditEstablishment(establishments[0])}
                          className="px-4 py-2 rounded-xl bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          تعديل معلومات المؤسسة والصور والخدمات / Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5 shrink-0">⏳</span>
                    <div>
                      <h4 className="font-bold text-base">جاري تحميل بيانات المؤسسة / En cours de chargement</h4>
                      <p className="text-xs mt-1 text-amber-800">
                        إذا لم تظهر مؤسستك، يرجى تحديث الصفحة أو التأكد من إكمال التسجيل.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/50">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#CB9A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
                    </svg>
                    Mes Établissements ({establishments.length})
                  </h4>
                  {establishments.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Vous n'avez pas encore enregistré d'établissement validé.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {establishments.map((e) => (
                        <li key={e.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-neutral-200">
                          <div>
                            <p className="font-bold text-[#0E1E3D]">{e.nom}</p>
                            <p className="text-slate-400">{e.ville}, {e.wilaya}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            (e.statut_validation === 'APPROVED' || e.statut_validation === 'valide') && e.actif
                              ? 'bg-emerald-100 text-emerald-800'
                              : e.statut_validation === 'refuse'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(e.statut_validation === 'APPROVED' || e.statut_validation === 'valide') && e.actif
                              ? 'Validé'
                              : e.statut_validation === 'refuse'
                              ? 'Refusé'
                              : 'En attente'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50/50">
                  <h4 className="text-sm font-bold text-[#0E1E3D] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#CB9A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Dernières demandes ({reservations.length})
                  </h4>
                  {reservations.length === 0 ? (
                    <p className="text-xs text-slate-500">Aucune réservation récente.</p>
                  ) : (
                    <ul className="space-y-3">
                      {reservations.slice(0, 3).map((r) => (
                        <li key={r.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-neutral-200">
                          <div>
                            <p className="font-bold text-[#0E1E3D]">{r.client?.prenom} {r.client?.nom}</p>
                            <p className="text-slate-400">Du {r.dateArrivee} au {r.dateDepart}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.statut === 'acceptee' ? 'bg-emerald-100 text-emerald-800' :
                            r.statut === 'en_attente' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.statut === 'acceptee' ? 'Acceptée' : r.statut === 'en_attente' ? 'En attente' : 'Refusée'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                Gestion des Réservations / إدارة الحجوزات
              </h3>
              {reservations.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">Aucune réservation enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">Les réservations effectuées par vos clients s'afficheront ici.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border border-neutral-200 rounded-2xl p-5 hover:border-[#CB9A56] transition bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#0E1E3D] text-base">
                              {reservation.etablissement?.nom || 'Votre établissement'}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Client: <strong className="text-slate-800">{reservation.client?.prenom} {reservation.client?.nom}</strong> ({reservation.client?.telephone || reservation.client?.email})
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Période: <strong>{new Date(reservation.dateArrivee).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(reservation.dateDepart).toLocaleDateString('fr-FR')}</strong>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${
                              reservation.statut === 'en_attente'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : reservation.statut === 'acceptee'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : reservation.statut === 'refusee'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {STATUT_ICON[reservation.statut] || ''} {STATUT_LABELS[reservation.statut]?.text || reservation.statut}
                          </span>
                          {reservation.statut === 'en_attente' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAcceptReservation(reservation.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accepter
                              </button>
                              <button
                                onClick={() => handleRejectReservation(reservation.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'establishments' && (
            <div>
              <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
                Mes Établissements / مؤسساتي
              </h3>
              {establishments.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <p className="text-sm font-semibold text-slate-600">Vous n'avez aucun établissement répertorié.</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Inscrivez votre hôtel, dortoir ou résidence pour recevoir des réservations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {establishments.map((est) => {
                    const estCover = est.image_vedette || est.imageVedette || (Array.isArray(est.images) ? est.images[0] : null)
                    const estServices = Array.isArray(est.services) ? est.services : []

                    return (
                      <div key={est.id} className="border border-neutral-200 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between">
                        <div>
                          {estCover && (
                            <div className="h-36 w-full rounded-xl overflow-hidden mb-3.5 bg-neutral-100 relative">
                              <img src={estCover} alt={est.nom} className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 bg-[#0E1E3D]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {est.type || 'Établissement'}
                              </span>
                              {Array.isArray(est.images) && est.images.length > 0 && (
                                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  📷 {est.images.length} photo(s)
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-[#0E1E3D] text-base">{est.nom}</h4>
                              <p className="text-xs text-slate-500">{est.ville}, {est.wilaya}</p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                                (est.statut_validation === 'APPROVED' || est.statut_validation === 'valide') && est.actif
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (est.statut_validation === 'en_attente' || !est.statut_validation)
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {(est.statut_validation === 'APPROVED' || est.statut_validation === 'valide') && est.actif
                                ? 'Validé'
                                : (est.statut_validation === 'en_attente' || !est.statut_validation)
                                ? 'En attente'
                                : 'Refusé'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 mb-3">{est.description || 'Établissement certifié Diyafa'}</p>

                          {/* Services badges */}
                          {estServices.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[11px] font-bold text-slate-400 mb-1">Services & Équipements:</p>
                              <div className="flex flex-wrap gap-1">
                                {estServices.map((srv, idx) => (
                                  <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                    {srv}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 mt-2">
                          <button
                            onClick={() => openEditEstablishment(est)}
                            className="flex-1 px-3 py-2.5 rounded-xl bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifier / تعديل
                          </button>
                          <Link
                            to={`/etablissements/${est.id}`}
                            className="px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#0E1E3D] text-xs font-bold transition"
                          >
                            Voir →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chambres' && (
            <RoomManagement establishments={establishments} />
          )}
        </div>
      </main>

      {showEstModal && editingEstablishment && (
        <EditEstablishmentModal
          establishment={editingEstablishment}
          onClose={() => {
            setShowEstModal(false)
            setEditingEstablishment(null)
          }}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  )
}

export default OwnerDashboard

// ============================================================
// Room Management Component
// ============================================================
const RoomManagement = ({ establishments }) => {
  const [selectedEstId, setSelectedEstId] = useState('')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [formData, setFormData] = useState({
    nomType: '',
    prixNuit: '',
    capacite: 1,
    nbDisponible: 1,
    description: '',
    images: [],
    services: [],
  })
  const [newServiceInput, setNewServiceInput] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const validatedEsts = establishments.filter(e => (e.statut_validation === 'APPROVED' || e.statut_validation === 'valide') && e.actif === true)

  useEffect(() => {
    if (validatedEsts.length > 0 && !selectedEstId) {
      setSelectedEstId(validatedEsts[0].id)
    }
  }, [establishments])

  useEffect(() => {
    if (selectedEstId) loadRooms()
  }, [selectedEstId])

  const loadRooms = async () => {
    setLoading(true)
    const res = await establishmentsApi.getRooms(selectedEstId)
    if (res.success) setRooms(res.data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      nomType: '',
      prixNuit: '',
      capacite: 1,
      nbDisponible: 1,
      description: '',
      images: [],
      services: [],
    })
    setEditingRoomId(null)
    setNewServiceInput('')
    setError(null)
    setSuccess(null)
  }

  const openEditRoom = (room) => {
    setEditingRoomId(room.id)
    setFormData({
      nomType: room.nomType || room.nom_type || '',
      prixNuit: room.prixNuit || room.prix_nuit || '',
      capacite: room.capacite || 1,
      nbDisponible: room.nbDisponible || room.nb_disponible || 1,
      description: room.description || '',
      images: Array.isArray(room.images) ? [...room.images] : [],
      services: Array.isArray(room.services) ? [...room.services] : [],
    })
    setError(null)
    setSuccess(null)
    setShowForm(true)
    window.scrollTo({ top: 200, behavior: 'smooth' })
  }

  const handleRoomImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const readFile = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    try {
      const previews = await Promise.all(files.map(f => readFile(f)))
      setFormData(prev => ({ ...prev, images: [...prev.images, ...previews] }))
    } catch (err) {
      console.error(err)
    }
    e.target.value = ''
  }

  const handleRemoveRoomImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleAddService = () => {
    if (!newServiceInput.trim()) return
    if (formData.services.includes(newServiceInput.trim())) return
    setFormData(prev => ({ ...prev, services: [...prev.services, newServiceInput.trim()] }))
    setNewServiceInput('')
  }

  const handleRemoveService = (index) => {
    setFormData(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }))
  }

  const handleSaveRoom = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload = {
      nomType: formData.nomType,
      prixNuit: parseFloat(formData.prixNuit) || 0,
      capacite: parseInt(formData.capacite, 10) || 1,
      nbDisponible: parseInt(formData.nbDisponible, 10) || 1,
      description: formData.description,
      images: formData.images,
      services: formData.services,
    }

    let res
    if (editingRoomId) {
      res = await establishmentsApi.updateRoom(editingRoomId, payload)
    } else {
      res = await establishmentsApi.createRoom(selectedEstId, payload)
    }

    if (res.success) {
      setSuccess(editingRoomId ? 'Chambre mise à jour avec succès!' : 'Chambre ajoutée avec succès!')
      resetForm()
      setShowForm(false)
      loadRooms()
    } else {
      setError(res.message || 'Erreur lors de l\'enregistrement de la chambre.')
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette chambre?')) return
    const res = await establishmentsApi.deleteRoom(roomId)
    if (res.success) {
      loadRooms()
    } else {
      alert(res.message || 'Erreur lors de la suppression.')
    }
  }

  if (validatedEsts.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-[#0E1E3D] mb-4 font-display">
          Chambres & Offres / الغرف والعروض
        </h3>
        <div className="text-center py-12 bg-amber-50 rounded-2xl border border-amber-200">
          <svg className="w-12 h-12 mx-auto text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-amber-800">
            Votre établissement est en cours d'examen / مؤسستك قيد المراجعة
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Vous pourrez ajouter des chambres une fois que l'administrateur aura approuvé votre établissement.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#0E1E3D] font-display">
            Chambres & Offres / الغرف والعروض
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Gérez les chambres de votre établissement, ajoutez ou modifiez des photos, des descriptions et des services.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm()
              setShowForm(false)
            } else {
              resetForm()
              setShowForm(true)
            }
          }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Annuler' : 'Ajouter une chambre'}
        </button>
      </div>

      {validatedEsts.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Établissement</label>
          <select
            value={selectedEstId}
            onChange={(e) => setSelectedEstId(e.target.value)}
            className="block w-full sm:w-80 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
          >
            {validatedEsts.map((e) => (
              <option key={e.id} value={e.id}>{e.nom}</option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSaveRoom} className="mb-6 p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
            <h4 className="font-bold text-[#0E1E3D] text-sm">
              {editingRoomId ? 'Modifier la chambre / تعديل الغرفة' : 'Ajouter une chambre / إضافة غرفة'}
            </h4>
            {editingRoomId && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Mode modification
              </span>
            )}
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">{success}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type de chambre *</label>
              <input
                value={formData.nomType}
                onChange={(e) => setFormData({ ...formData, nomType: e.target.value })}
                required
                placeholder="Ex: Suite Deluxe, Chambre Double..."
                className="block w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prix par nuit (DA) *</label>
              <input
                type="number"
                value={formData.prixNuit}
                onChange={(e) => setFormData({ ...formData, prixNuit: e.target.value })}
                required
                min="0"
                placeholder="Ex: 12000"
                className="block w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Capacité (personnes)</label>
              <input
                type="number"
                value={formData.capacite}
                onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                min="1"
                className="block w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre disponible</label>
              <input
                type="number"
                value={formData.nbDisponible}
                onChange={(e) => setFormData({ ...formData, nbDisponible: e.target.value })}
                min="0"
                className="block w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description de la chambre / وصف الغرفة</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Décrivez les équipements, le confort, la vue, le balcon..."
              className="block w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Services & équipements de la chambre / خدمات الغرفة</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                placeholder="Ex: Climatisation, Wi-Fi, TV 4K, Mini-bar, Vue sur mer..."
                className="block flex-1 px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
              />
              <button
                type="button"
                onClick={handleAddService}
                className="px-4 py-2 bg-[#0E1E3D] text-white rounded-xl text-xs font-bold hover:bg-[#CB9A56] hover:text-[#0E1E3D] transition cursor-pointer"
              >
                Ajouter
              </button>
            </div>
            {formData.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.services.map((srv, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium">
                    {srv}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="text-amber-700 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Photos de la chambre / صور الغرفة</label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-[#CB9A56] bg-white transition text-center mb-2">
              <svg className="w-6 h-6 text-[#CB9A56] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-[#0E1E3D]">Cliquez pour ajouter des photos</span>
              <input type="file" accept="image/*" multiple onChange={handleRoomImageChange} className="hidden" />
            </label>
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-neutral-200 h-20 group bg-black">
                    <img src={img} alt={`Chambre ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveRoomImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Supprimer la photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {editingRoomId ? 'Mettre à jour la chambre / تحديث الغرفة' : 'Enregistrer et ajouter la chambre / حفظ الغرفة'}
            </button>
            {editingRoomId && (
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="px-4 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E1E3D] mx-auto"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">Aucune chambre pour le moment</p>
          <p className="text-xs text-slate-400 mt-1">Cliquez sur "Ajouter une chambre" pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const roomImg = room.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
            return (
              <div key={room.id} className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition flex flex-col">
                <div className="relative h-40 bg-neutral-100">
                  <img src={roomImg} alt={room.nomType} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditRoom(room)}
                      className="w-7 h-7 flex items-center justify-center bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white rounded-full text-xs font-bold shadow-md transition cursor-pointer"
                      title="Modifier la chambre"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="w-7 h-7 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md transition cursor-pointer"
                      title="Supprimer la chambre"
                    >
                      ×
                    </button>
                  </div>
                  {room.images && room.images.length > 1 && (
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      📷 {room.images.length} photos
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-[#0E1E3D] text-sm">{room.nomType}</h4>
                      <button
                        onClick={() => openEditRoom(room)}
                        className="text-[11px] font-bold text-[#CB9A56] hover:underline shrink-0 cursor-pointer"
                      >
                        Modifier
                      </button>
                    </div>
                    {room.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{room.description}</p>
                    )}
                    {room.services && room.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {room.services.map((s, idx) => (
                          <span key={idx} className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-medium border border-amber-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs pt-2 border-t border-neutral-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prix/nuit:</span>
                      <span className="font-bold text-[#0E1E3D]">{(room.prixNuit || 0).toLocaleString('fr-FR')} DA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capacité:</span>
                      <span className="font-bold text-[#0E1E3D]">{room.capacite} pers.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disponibles:</span>
                      <span className={`font-bold ${room.nbDisponible > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {room.nbDisponible}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Edit Establishment Modal Component
// ============================================================
const EditEstablishmentModal = ({ establishment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: establishment.nom || '',
    type: establishment.type || 'hotel',
    wilaya: establishment.wilaya || 'Alger',
    ville: establishment.ville || '',
    adresse: establishment.adresse || '',
    description: establishment.description || '',
    services: Array.isArray(establishment.services) ? [...establishment.services] : [],
    images: Array.isArray(establishment.images) ? [...establishment.images] : [],
    image_vedette: establishment.image_vedette || establishment.imageVedette || (Array.isArray(establishment.images) && establishment.images[0]) || '',
  })

  const [newServiceInput, setNewServiceInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const PRESET_SERVICES = [
    'Wi-Fi', 'Parking', 'Climatisation', 'Restaurant', 'Piscine',
    'Petit-déjeuner', 'Ascenseur', 'TV', 'Réception 24h/24',
    'Vue sur mer', 'Room Service', 'Chauffage', 'Espace enfants', 'Coffre-fort'
  ]

  const handleToggleService = (srv) => {
    if (formData.services.includes(srv)) {
      setFormData(prev => ({ ...prev, services: prev.services.filter(s => s !== srv) }))
    } else {
      setFormData(prev => ({ ...prev, services: [...prev.services, srv] }))
    }
  }

  const handleAddCustomService = () => {
    const trimmed = newServiceInput.trim()
    if (!trimmed) return
    if (formData.services.includes(trimmed)) {
      setNewServiceInput('')
      return
    }
    setFormData(prev => ({ ...prev, services: [...prev.services, trimmed] }))
    setNewServiceInput('')
  }

  const handleRemoveService = (index) => {
    setFormData(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newImgs = []
    for (const file of files) {
      const reader = new FileReader()
      const base64 = await new Promise((resolve) => {
        reader.onload = (ev) => resolve(ev.target.result)
        reader.readAsDataURL(file)
      })
      newImgs.push(base64)
    }
    setFormData(prev => {
      const updatedImages = [...prev.images, ...newImgs]
      const updatedVedette = prev.image_vedette || updatedImages[0] || ''
      return { ...prev, images: updatedImages, image_vedette: updatedVedette }
    })
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const imgToRemove = prev.images[index]
      const updatedImages = prev.images.filter((_, i) => i !== index)
      let updatedVedette = prev.image_vedette
      if (imgToRemove === updatedVedette) {
        updatedVedette = updatedImages[0] || ''
      }
      return { ...prev, images: updatedImages, image_vedette: updatedVedette }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const res = await establishmentsApi.updateEstablishment(establishment.id, {
      nom: formData.nom,
      type: formData.type,
      wilaya: formData.wilaya,
      ville: formData.ville,
      adresse: formData.adresse,
      description: formData.description,
      services: formData.services,
      images: formData.images,
      image_vedette: formData.image_vedette,
      imageVedette: formData.image_vedette,
    })

    setLoading(false)

    if (res.success) {
      setSuccess('Informations de l\'établissement mises à jour avec succès! / تم تحديث بيانات المؤسسة بنجاح')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } else {
      setError(res.message || 'Erreur lors de la mise à jour de l\'établissement.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative border border-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-slate-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-6">
          <span className="text-[11px] font-bold text-[#CB9A56] uppercase tracking-wider">Éditer l'établissement</span>
          <h3 className="text-xl font-extrabold text-[#0E1E3D] font-display">
            تعديل معلومات المؤسسة والصور والخدمات
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Modifiez le nom, la description, les services disponibles et gérez la galerie photos.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                Nom de l'établissement / اسم المؤسسة *
              </label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                placeholder="Ex: Hôtel El Aurassi"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                Type / نوع المؤسسة *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              >
                <option value="hotel">Hôtel / فندق</option>
                <option value="dortoir">Dortoir / مرقد</option>
                <option value="residence">Résidence / إقامة</option>
                <option value="villa">Villa / فيلا</option>
                <option value="auberge">Auberge / مأوى</option>
              </select>
            </div>
          </div>

          {/* Wilaya, Ville & Adresse */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                Wilaya / الولاية *
              </label>
              <select
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              >
                {WILAYAS.map((w, idx) => (
                  <option key={idx} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                Ville / المدينة *
              </label>
              <input
                type="text"
                required
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                placeholder="Ex: Bab El Oued"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
                Adresse / العنوان
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                placeholder="Rue, quartier..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
              Description de l'établissement / وصف المؤسسة
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
              placeholder="Décrivez les atouts, le cadre, la proximité avec la ville ou la plage..."
            />
          </div>

          {/* Services & Équipements */}
          <div>
            <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
              Services & Équipements / خدمات ومرافق المؤسسة
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Sélectionnez les services proposés par votre établissement pour les afficher sur la carte d'accueil:
            </p>
            
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESET_SERVICES.map((srv) => {
                const selected = formData.services.includes(srv)
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => handleToggleService(srv)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selected
                        ? 'bg-[#0E1E3D] text-white shadow-xs'
                        : 'bg-neutral-100 text-slate-700 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{srv}
                  </button>
                )
              })}
            </div>

            {/* Custom service input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newServiceInput}
                onChange={(e) => setNewServiceInput(e.target.value)}
                placeholder="Ajouter un autre service (ex: Hammam, Navette aéroport...)"
                className="flex-1 px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#CB9A56] outline-none transition"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomService(); } }}
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                className="px-4 py-2 bg-[#CB9A56] text-[#0E1E3D] rounded-xl text-xs font-bold hover:bg-[#E4C48A] transition cursor-pointer"
              >
                Ajouter
              </button>
            </div>

            {/* Active services list */}
            {formData.services.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                {formData.services.map((srv, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-lg px-2.5 py-1 text-xs font-bold"
                  >
                    {srv}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="text-amber-800 hover:text-red-700 font-black ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Photos & Main Photo */}
          <div>
            <label className="block text-xs font-bold text-[#0E1E3D] mb-1.5">
              Photos & Galerie de l'établissement / صور المؤسسة
            </label>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-[#CB9A56] bg-neutral-50 hover:bg-white transition text-center mb-3">
              <svg className="w-7 h-7 text-[#CB9A56] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-bold text-[#0E1E3D]">Cliquez pour importer des photos</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Formats acceptés: JPG, PNG, WEBP</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {formData.images.map((img, idx) => {
                  const isVedette = formData.image_vedette === img
                  return (
                    <div key={idx} className={`relative h-24 rounded-xl overflow-hidden border-2 group ${isVedette ? 'border-[#CB9A56] ring-2 ring-[#CB9A56]/30' : 'border-neutral-200'}`}>
                      <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {isVedette && (
                        <span className="absolute top-1 left-1 bg-[#CB9A56] text-[#0E1E3D] text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                          Principale
                        </span>
                      )}

                      {!isVedette && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_vedette: img })}
                          className="absolute bottom-1 left-1 bg-black/70 hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          Définir comme photo principale
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Supprimer la photo"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-neutral-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#0E1E3D] hover:bg-[#CB9A56] hover:text-[#0E1E3D] text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                'Enregistrer les modifications / حفظ التعديلات'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
