import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useTranslation } from 'react-i18next'
import {
  IconPhone,
  IconMail,
  IconUsers,
  IconHeadset,
  IconPinFooter,
  IconBuilding,
  IconFacebook,
  IconInstagram,
  IconYoutube,
} from "./Icons";

export function Footer() {
  const { t } = useTranslation();
  const DESTINATIONS_POPULAIRES = ["Alger", "Oran", "Annaba", "Constantine"];

  const A_PROPOS_LINKS = [
    { label: t("contact"), to: "/contact", icon: IconUsers },
    { label: t("contact"), to: "/contact", icon: IconHeadset },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0E1E3D] pb-8 pt-14 text-sm text-white/60">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#CB9A56]/10 blur-3xl" />
      <style>{`
        @keyframes footerLogoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .footer-logo-float { animation: footerLogoFloat 4s ease-in-out infinite; }
        .footer-logo-float:hover { animation-play-state: paused; }
        .footer-link { position: relative; }
        .footer-link::before {
          content: ""; position: absolute; left: 0; bottom: -0.3rem; height: 1.5px; width: 0; background-color: #CB9A56; transition: width 0.25s ease;
        }
        .footer-link:hover::before { width: 100%; }

        @keyframes suitcaseTravel {
          0%   { transform: translateX(-10%) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          10%  { transform: translateX(0%) rotate(-3deg); }
          15%  { transform: translateX(5%) rotate(3deg); }
          20%  { transform: translateX(10%) rotate(-3deg); }
          25%  { transform: translateX(15%) rotate(3deg); }
          30%  { transform: translateX(20%) rotate(-3deg); }
          35%  { transform: translateX(25%) rotate(3deg); }
          40%  { transform: translateX(30%) rotate(-3deg); }
          45%  { transform: translateX(35%) rotate(3deg); }
          50%  { transform: translateX(40%) rotate(-3deg); }
          55%  { transform: translateX(45%) rotate(3deg); }
          60%  { transform: translateX(50%) rotate(-3deg); }
          65%  { transform: translateX(55%) rotate(3deg); }
          70%  { transform: translateX(60%) rotate(-3deg); }
          75%  { transform: translateX(65%) rotate(3deg); }
          80%  { transform: translateX(70%) rotate(-3deg); }
          85%  { transform: translateX(75%) rotate(3deg); }
          90%  { transform: translateX(80%) rotate(0deg); opacity: 1; }
          100% { transform: translateX(110%) rotate(0deg); opacity: 0; }
        }
        .suitcase-travel-track {
          position: relative;
          overflow: hidden;
          height: 1.75rem;
        }
        .suitcase-travel-icon {
          position: absolute;
          top: 0;
          transform-origin: center bottom;
          animation: suitcaseTravel 5s linear infinite;
        }
      `}</style>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col items-center gap-3 border-b border-white/10 pb-10 text-center">
          <div className="footer-logo-float transition-transform duration-300 hover:scale-105">
            <Logo className="h-9" withText dark />
          </div>
          <p className="max-w-sm text-xs text-white/40">
            {t('footerDesc')}
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-display text-base font-semibold text-white">{t('support247')}</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:+213798355735" className="group flex items-center gap-2.5 transition">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#CB9A56] transition group-hover:border-[#CB9A56] group-hover:bg-[#CB9A56] group-hover:text-[#0E1E3D]">
                    <IconPhone className="h-3.5 w-3.5" />
                  </span>
                  <span className="transition group-hover:text-[#CB9A56] group-hover:underline">
                    +213 798 355 735
                  </span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@diyafa.dz" className="group flex items-center gap-2.5 transition">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#CB9A56] transition group-hover:border-[#CB9A56] group-hover:bg-[#CB9A56] group-hover:text-[#0E1E3D]">
                    <IconMail className="h-3.5 w-3.5" />
                  </span>
                  <span className="transition group-hover:text-[#CB9A56] group-hover:underline">
                    contact@diyafa.dz
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-base font-semibold text-white">{t('quickLinks')}</h3>
            <ul className="space-y-2.5">
              {A_PROPOS_LINKS.map(({ label, to, icon: Icon }, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#CB9A56]" />
                  <Link to={to} className="footer-link hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-base font-semibold text-white">
              {t('wilaya')}
            </h3>
            <ul className="space-y-2.5">
              {DESTINATIONS_POPULAIRES.map((ville) => (
                <li key={ville} className="flex items-center gap-2">
                  <IconPinFooter className="h-4 w-4 text-[#CB9A56]" />
                  <Link to={`/etablissements?ville=${encodeURIComponent(ville)}`} className="footer-link hover:text-white">
                    {ville}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-base font-semibold text-white">
              {t('addEstablishment')}
            </h3>
            <Link
              to="/register?type=etablissement"
              className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-[#CB9A56] px-4 py-2.5 text-sm font-bold text-[#0E1E3D] transition hover:opacity-90"
            >
              <IconBuilding className="h-4 w-4" />
              {t('addEstablishment')}
            </Link>
            <Link to="/login" className="footer-link block hover:text-white">
              {t('login')}
            </Link>
            <div className="mt-5 flex gap-2">
              <a href="#" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 hover:border-[#CB9A56] hover:text-[#CB9A56]">
                <IconFacebook />
              </a>
              <a href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 hover:border-[#CB9A56] hover:text-[#CB9A56]">
                <IconInstagram />
              </a>
              <a href="#" aria-label="YouTube" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 hover:border-[#CB9A56] hover:text-[#CB9A56]">
                <IconYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="suitcase-travel-track mb-3">
          <svg
            className="suitcase-travel-icon h-6 w-6 text-[#CB9A56]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* poignée */}
            <path d="M9 8V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V8" />
            <path d="M10.5 5.5h3v2.2h-3z" />
            {/* corps */}
            <rect x="4.5" y="8" width="15" height="14.5" rx="2.2" />
            {/* roues */}
            <circle cx="8.5" cy="22.5" r="1.3" />
            <circle cx="15.5" cy="22.5" r="1.3" />
          </svg>
        </div>

        <p className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
          {t('allRightsReserved')}
        </p>
      </div>
    </footer>
  );
}

export default Footer;
