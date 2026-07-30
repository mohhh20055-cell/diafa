import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'
import {
  IconPin,
  IconCalendar,
  IconHome,
  IconSearch,
  IconOffer,
  IconSupport,
  IconBolt,
} from "../components/Icons";
import CustomSelect from "../components/CustomSelect";
import DatePicker from "../components/DatePicker";
import { WILAYAS } from "../constants/wilayas";
import {
  listEstablishments,
  getEstablishment,
  toAssetUrl,
} from "../api/establishments";
import { getRatingsBatch } from "../api/reviews";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
];

const DESTINATIONS_PHARES = [
  {
    nom: "مقام الشهيد",
    wilaya: "الجزائر",
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Martyrs_Memorial._Algiers,_Algeria.jpg?width=900",
  },
  {
    nom: "حصن سانتا كروز",
    wilaya: "وهران",
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Fort_Santa_Cruz,_Oran_2013-2.jpg?width=900",
  },
  {
    nom: "رأس كاربون",
    wilaya: "بجاية",
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Cap_Carbon_(Béjaïa).jpg?width=900",
  },
  {
    nom: "جسر سيدي مسيد",
    wilaya: "قسنطينة",
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Pont_de_Sidi_M'Cid_02.jpg?width=900",
  },
  {
    nom: "منصورة",
    wilaya: "تلمسان",
    img: "https://commons.wikimedia.org/wiki/Special:FilePath/Mansourah_Tlemcen_city,_Algeria.jpg?width=900",
  },
];

function cheapestPrice(establishment) {
  if (!establishment || !Array.isArray(establishment.rooms)) return null;
  const pricedRooms = establishment.rooms.filter(
    (r) => {
      const p = parseFloat(r?.prixNuit ?? r?.prix_nuit);
      return !isNaN(p) && isFinite(p) && p > 0;
    }
  );
  if (pricedRooms.length === 0) return null;
  const min = pricedRooms.reduce(
    (minVal, r) => {
      const p = parseFloat(r.prixNuit ?? r.prix_nuit);
      return p < minVal ? p : minVal;
    },
    Infinity
  );
  return isFinite(min) && min > 0 ? min : null;
}

function StarRating({ rating, count, size = "sm" }) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const stars = [1, 2, 3, 4, 5];
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((s) => (
          <svg
            key={s}
            className={`${starSize} ${s <= rounded ? "text-[#CB9A56]" : "text-neutral-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </div>
      {count > 0 && (
        <span className="text-[11px] font-medium text-slate-500">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}

function FeaturedCard({ establishment }) {
  const { t } = useTranslation();
  const cover =
    establishment.imageVedette ||
    (establishment.images || [])[0] ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
  const price = cheapestPrice(establishment);
  const typeKey = establishment.type === 'hotel' ? 'hotel' : establishment.type === 'mraqed' ? 'mraqed' : 'maison';
  const typeLabel = t(typeKey) || establishment.type;
  const rating = establishment.rating || { avgRating: 0, reviewCount: 0 };

  const estServices = Array.isArray(establishment.services)
    ? establishment.services
    : (typeof establishment.services === 'string' ? establishment.services.split(',').map(s => s.trim()).filter(Boolean) : []);
  const roomServices = (establishment.rooms || []).flatMap((r) =>
    Array.isArray(r.services) ? r.services : (typeof r.services === 'string' ? r.services.split(',').map(s => s.trim()).filter(Boolean) : [])
  );
  const allServices = Array.from(new Set([...estServices, ...roomServices]));

  return (
    <Link
      to={`/etablissements/${establishment.id}`}
      className="group block w-64 shrink-0 snap-start overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        <div className="relative h-40 bg-gradient-to-br from-[#152A54] to-[#0E1E3D]">
          {cover && (
            <img
              src={toAssetUrl(cover)}
              alt={establishment.nom}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0E1E3D] shadow">
            {typeLabel}
          </span>
          {rating.reviewCount > 0 && (
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#0E1E3D]/85 px-2 py-1 text-[10px] font-bold text-white shadow backdrop-blur-sm">
              <svg className="w-3 h-3 text-[#CB9A56]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
              </svg>
              {rating.avgRating.toFixed(1)}
            </span>
          )}
          {price != null && !isNaN(price) && isFinite(price) && price > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-[#0E1E3D]/80 px-3 py-1.5 text-white">
              <span className="text-[11px] font-medium text-white/80">{t('price')}</span>{" "}
              <span className="text-sm font-bold">{Math.round(price).toLocaleString("ar-DZ")} دج</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-bold uppercase text-[#0E1E3D]">
            {establishment.nom}
          </p>
          <p className="truncate text-xs text-slate-400 mb-2">
            {[establishment.ville, establishment.wilaya].filter(Boolean).join("، ")}
          </p>
          {allServices.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {allServices.map((srv, idx) => (
                <span key={idx} className="inline-block bg-amber-50 text-amber-900 border border-amber-200/80 rounded px-1.5 py-0.5 text-[10px] font-semibold truncate max-w-[110px]">
                  {srv}
                </span>
              ))}
            </div>
          )}
          {rating.reviewCount > 0 && (
            <div className="mt-1">
              <StarRating rating={rating.avgRating} count={rating.reviewCount} />
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-neutral-100 px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#CB9A56]">{t('details')}</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#CB9A56]/15 text-[#CB9A56]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function FeaturedEstablishments() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    listEstablishments({})
      .then(async (data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        if (list.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }
        const summary = list.slice(0, 10);
        const detailed = await Promise.all(
          summary.map((e) =>
            getEstablishment(e.id)
              .then((res) => (res.success ? res.data : e))
              .catch(() => e)
          )
        );
        const ids = detailed.map((e) => e.id);
        const ratingsRes = await getRatingsBatch(ids);
        const ratingsMap = ratingsRes.success ? ratingsRes.data : {};
        const withRatings = detailed.map((e) => ({
          ...e,
          rating: ratingsMap[e.id] || { avgRating: 0, reviewCount: 0 },
        }));
        if (!cancelled) setItems(withRatings);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function scrollBy(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  }

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[#0E1E3D] sm:text-3xl">
          {t('ourEstablishments')}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t('homeHeroSubtitle')}
        </p>
      </div>

      <div className="relative">
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-64 shrink-0 animate-pulse rounded-xl bg-neutral-200/60"
              />
            ))}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label={t('previous')}
              className="absolute -left-4 top-1/3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-slate-500 shadow-md hover:text-[#0E1E3D] sm:flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 5 8 12l7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              ref={scrollerRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((est) => (
                <FeaturedCard key={est.id} establishment={est} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label={t('next')}
              className="absolute -right-4 top-1/3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-slate-500 shadow-md hover:text-[#0E1E3D] sm:flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="m9 5 7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="mt-8 text-center">
        <Link
          to="/etablissements"
          className="inline-block rounded-xl bg-[#CB9A56] px-7 py-3 text-sm font-semibold text-[#0E1E3D] transition hover:bg-[#E4C48A]"
        >
          {t('exploreEstablishments')}
        </Link>
      </div>
    </section>
  );
}

function PourquoiSection() {
  const { t } = useTranslation();
  const POURQUOI_ITEMS = [
    {
      Icon: IconOffer,
      title: t('bestPriceGuarantee'),
      desc: t('freeCancellation'),
    },
    {
      Icon: IconSupport,
      title: t('support247'),
      desc: t('support247'),
    },
    {
      Icon: IconBolt,
      title: t('securePayment'),
      desc: t('securePayment'),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0E1E3D] via-[#152A54] to-[#0E1E3D] px-6 py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#CB9A56]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#CB9A56]/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {t('discoverTitle')}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[#E4C48A] font-medium">
          {t('discoverSub')}
        </p>
        <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {POURQUOI_ITEMS.map(({ Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#CB9A56] text-[#CB9A56]">
                <Icon />
              </div>
              <h3 className="mb-2 font-display text-base font-bold text-white">{title}</h3>
              <p className="text-sm text-white/70">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [type, setType] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("wilaya", destination);
    if (dateDebut) params.set("dateDebut", dateDebut);
    if (dateFin) params.set("dateFin", dateFin);
    if (type) params.set("type", type);
    navigate(`/etablissements?${params.toString()}`);
  }

  return (
    <div>
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden px-6 py-24">
        {HERO_IMAGES.map((url, i) => (
          <div
            key={url}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(14,30,61,0.6) 0%, rgba(14,30,61,0.8) 100%), url('${url}')`,
              opacity: i === heroIndex ? 1 : 0,
            }}
          />
        ))}
        <div className="relative w-full max-w-4xl text-center">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-[#E4C48A]">
            {t('hotels')} &amp; {t('dortoirs')} &amp; {t('maisons')}
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
            {t('homeHeroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80 text-lg">
            {t('homeHeroSubtitle')}
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex flex-col gap-4 rounded-2xl bg-white p-5 text-left shadow-2xl sm:p-6 md:flex-row md:items-center md:gap-5"
          >
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500">
                <IconPin className="h-4 w-4 text-[#0E1E3D]" /> {t('wilaya')}
              </label>
              <CustomSelect
                value={destination}
                onChange={setDestination}
                placeholder={t('allWilayas')}
                options={WILAYAS.map((w) => ({ value: w, label: w }))}
              />
            </div>
            <div className="h-px w-full bg-neutral-100 md:h-10 md:w-px" />
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500">
                <IconCalendar className="h-4 w-4 text-[#0E1E3D]" /> {t('arrival')}
              </label>
              <DatePicker
                value={dateDebut}
                onChange={setDateDebut}
                minDate={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="h-px w-full bg-neutral-100 md:h-10 md:w-px" />
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500">
                <IconCalendar className="h-4 w-4 text-[#0E1E3D]" /> {t('departure')}
              </label>
              <DatePicker
                value={dateFin}
                onChange={setDateFin}
                minDate={dateDebut || new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="h-px w-full bg-neutral-100 md:h-10 md:w-px" />
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500">
                <IconHome className="h-4 w-4 text-[#0E1E3D]" /> {t('type')}
              </label>
              <CustomSelect
                value={type}
                onChange={setType}
                placeholder={t('allTypes')}
                options={[
                  { value: "hotel", label: t('hotel') },
                  { value: "mraqed", label: t('mraqed') },
                  { value: "maison", label: t('maison') },
                ]}
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#CB9A56] px-8 py-4 text-base font-semibold text-[#0E1E3D] transition hover:bg-[#E4C48A]"
            >
              <IconSearch className="h-4 w-4" /> {t('search')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            {HERO_IMAGES.map((url, i) => (
              <button
                key={url}
                onClick={() => setHeroIndex(i)}
                aria-label={`شريحة ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === heroIndex ? "w-6 bg-[#CB9A56]" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <FeaturedEstablishments />
      <PourquoiSection />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-[#0E1E3D] sm:text-3xl">
            {t('wilaya')}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t('homeHeroSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:grid-rows-2">
          {DESTINATIONS_PHARES.map((d, i) => (
            <button
              key={d.nom}
              onClick={() => navigate(`/etablissements?wilaya=${encodeURIComponent(d.wilaya)}`)}
              className={`group relative overflow-hidden rounded-2xl text-left shadow-md transition hover:shadow-xl ${
                i === 0
                  ? "col-span-2 row-span-2 aspect-square sm:aspect-auto min-h-[260px]"
                  : "aspect-square"
              }`}
            >
              <img
                src={d.img}
                alt={d.nom}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1E3D]/85 via-[#0E1E3D]/20 to-transparent" />
              <span className="absolute bottom-4 left-5 font-display text-xl font-bold text-white tracking-wide">
                {d.wilaya}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
