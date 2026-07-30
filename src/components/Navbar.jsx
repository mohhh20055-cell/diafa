import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { supabase } from '../lib/supabase'
import Logo from './Logo'
import { IconUserCircle, IconCalendar, IconLogout, IconBell, IconHeadset } from './Icons'
import { LanguageSwitcher } from './LanguageSwitcher'

/* Texte de nav avec effet hover (soulignement animé + couleur or) */
function NavText({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`group relative px-1 py-2 text-[15px] font-semibold transition-colors ${
        active ? 'text-[#CB9A56]' : 'text-[#152A54] hover:text-[#CB9A56]'
      }`}
    >
      {children}
      <span
        className={`absolute left-0 -bottom-0.5 h-[2px] rounded-full bg-[#CB9A56] transition-all duration-300 ${
          active ? 'w-full' : 'w-0 group-hover:w-full'
        }`}
      />
    </Link>
  )
}

function RegisterDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { t } = useTranslation()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-[#CB9A56] px-5 py-2.5 text-sm font-bold text-[#152A54] hover:bg-[#E4C48A] transition shadow-sm"
      >
        <span>{t('register')}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-2xl z-50">
          <Link
            to="/register?type=client"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
          >
            <svg className="w-4 h-4 text-[#CB9A56]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M5 20c1.5-4 4.3-6 7-6s5.5 2 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{t('client')}</span>
          </Link>
          <Link
            to="/register?type=etablissement"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition border-t border-neutral-100"
          >
            <svg className="w-4 h-4 text-[#CB9A56]" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="4" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>{t('establishment')}</span>
          </Link>
        </div>
      )}
    </div>
  )
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin/dashboard'
    if (user.role === 'owner') return '/owner/dashboard'
    return '/mes-reservations'
  }

  const initial = (user?.prenom || user?.nom || 'U').charAt(0).toUpperCase()
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || t('myAccount')

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('myAccount')}
        className="flex items-center gap-2 rounded-full bg-[#CB9A56] p-1.5 pr-3 text-xs font-bold text-[#152A54] hover:bg-[#E4C48A] transition shadow-sm"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#152A54] text-xs font-bold text-[#CB9A56]">
          {initial}
        </span>
        <span className="hidden sm:inline-block max-w-[120px] truncate">{user?.prenom || t('myAccount')}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl z-50">
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-4 bg-neutral-50">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#152A54] text-base font-bold text-[#CB9A56]">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-[#152A54]">{fullName}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || user?.telephone}</p>
            </div>
          </div>

          <div className="py-1">
            {user?.role === 'owner' || user?.role === 'admin' ? (
              <Link
                to={dashboardLink()}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
              >
                <IconUserCircle className="h-4 w-4 text-[#CB9A56]" />
                <span>{t('mySpace')}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/mes-reservations?tab=reservations"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
                >
                  <IconCalendar className="h-4 w-4 text-[#CB9A56]" />
                  <span>{t('myReservations')}</span>
                </Link>
                <Link
                  to="/mes-reservations?tab=notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
                >
                  <IconBell className="h-4 w-4 text-[#CB9A56]" />
                  <span>{t('notificationsAndResponses')}</span>
                </Link>
                <Link
                  to="/mes-reservations?tab=profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
                >
                  <IconUserCircle className="h-4 w-4 text-[#CB9A56]" />
                  <span>{t('myProfile')}</span>
                </Link>
                <Link
                  to="/mes-reservations?tab=contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#152A54] hover:bg-[#CB9A56]/15 transition"
                >
                  <IconHeadset className="h-4 w-4 text-[#CB9A56]" />
                  <span>{t('supportAndHelp')}</span>
                </Link>
              </>
            )}
          </div>

          <div className="border-t border-neutral-100 py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
                navigate('/')
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
            >
              <IconLogout className="h-4 w-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { NotificationDropdown } from './NotificationDropdown'

export function NavbarUtilityBar() {
  const { isAuthenticated } = useAuth()
  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3 bg-[#FAF7F1] border-b border-[#CB9A56]/25 px-4 sm:px-6 py-2.5">
      <LanguageSwitcher />
      {isAuthenticated && <NotificationDropdown />}
      {isAuthenticated && <AccountMenu />}
    </div>
  )
}

export function Navbar() {
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  const mainLinks = [
    { id: 'hotels', label: t('hotels'), path: '/etablissements?type=hotel' },
    { id: 'dortoirs', label: t('dortoirs'), path: '/etablissements?type=mraqed' },
    { id: 'maisons', label: t('maisons'), path: '/etablissements?type=maison' },
  ]

  const afterDivider = [
    { id: 'ajouter', label: t('addEstablishment'), path: '/register?type=etablissement' },
    { id: 'contact', label: t('contact'), path: '/contact' },
  ]

  const roleLink = (() => {
    if (!isAuthenticated) return null
    if (user?.role === 'owner') return { id: 'owner-dash', label: t('partnerSpace'), path: '/owner/dashboard' }
    if (user?.role === 'admin') return { id: 'admin-dash', label: t('admin'), path: '/admin/dashboard' }
    return { id: 'reservations', label: t('myReservations'), path: '/mes-reservations' }
  })()

  const isCurrentTab = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname + location.search === path || (location.pathname === '/etablissements' && path.includes('/etablissements'))
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F1] text-[#152A54] shadow-sm border-b border-[#CB9A56]/25">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2 hover:opacity-90 transition">
          <Logo className="h-9" withText />
        </Link>

        {/* Liens centraux */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 min-w-0 justify-center">
          {mainLinks.map((tab) => (
            <NavText key={tab.id} to={tab.path} active={isCurrentTab(tab.path)}>
              {tab.label}
            </NavText>
          ))}

          <span className="h-5 w-px bg-[#152A54]/15" />

          {afterDivider.map((tab) => (
            <NavText key={tab.id} to={tab.path} active={isCurrentTab(tab.path)}>
              {tab.label}
            </NavText>
          ))}

          {roleLink && (
            <NavText to={roleLink.path} active={isCurrentTab(roleLink.path)}>
              {roleLink.label}
            </NavText>
          )}
        </nav>

        {/* Section droite */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          {isAuthenticated && <NotificationDropdown />}

          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full border border-[#152A54]/25 px-4 py-2 text-sm font-bold text-[#152A54] hover:bg-[#152A54]/5 hover:border-[#152A54] transition"
              >
                {t('login')}
              </Link>
              <RegisterDropdown />
            </div>
          )}
        </div>
      </div>

      {/* Liens mobiles (repli sous le header sur petit écran) */}
      <div className="lg:hidden border-t border-[#152A54]/10 bg-[#FAF7F1]">
        <nav className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2 scrollbar-none sm:px-6">
          {[...mainLinks, ...afterDivider, ...(roleLink ? [roleLink] : [])].map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              className={`whitespace-nowrap text-sm font-semibold transition ${
                isCurrentTab(tab.path) ? 'text-[#CB9A56]' : 'text-[#152A54] hover:text-[#CB9A56]'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
