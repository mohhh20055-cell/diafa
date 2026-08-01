import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import * as establishmentsApi from '../api/establishments'
import * as reviewsApi from '../api/reviews'
import * as reservationsApi from '../api/reservations'
import { useAuth } from '../context/AuthContext'
import DatePicker from '../components/DatePicker'

const TYPE_LABELS = { hotel: 'فندق', mraqed: 'مرقد', maison: 'بيت ضيافة' }

const StarRating = ({ rating, count, size = 'md' }) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  const stars = [1, 2, 3, 4, 5]
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((s) => (
          <svg
            key={s}
            className={`${starSize} ${s <= rounded ? 'text-[#F97316]' : 'text-neutral-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </div>
      {count != null && (
        <span className={`font-medium text-slate-500 ${size === 'lg' ? 'text-base ml-2' : 'text-xs ml-1'}`}>
          {rating.toFixed(1)} ({count} تقييم)
        </span>
      )}
    </div>
  )
}

const ReviewForm = ({ establishmentId, onSubmitted }) => {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setError('الرجاء اختيار تقييم.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    const res = await reviewsApi.addReview(establishmentId, { rating, comment })
    setSubmitting(false)
    if (res.success) {
      setSuccess('تم نشر التقييم بنجاح!')
      setRating(0)
      setComment('')
      onSubmitted?.()
    } else {
      setError(res.message || 'حدث خطأ أثناء إرسال التقييم.')
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">سجل الدخول لترك تقييم.</p>
        <Link
          to="/login"
          className="inline-block rounded-lg bg-[#1A2951] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F97316] transition-colors"
        >
          تسجيل الدخول
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6">
      <h4 className="text-sm font-bold uppercase tracking-wide text-[#1A2951] mb-4">
        اترك تقييم
      </h4>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
          {success}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 mb-2">تقييمك</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <svg
                className={`w-7 h-7 ${(hover || rating) >= s ? 'text-[#F97316]' : 'text-neutral-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          تعليق (اختياري)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="شارك تجربتك..."
          className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/30 transition"
          disabled={submitting}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[#1A2951] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#F97316] transition-colors disabled:opacity-50"
      >
        {submitting ? 'جاري الإرسال...' : 'نشر التقييم'}
      </button>
    </form>
  )
}

const BookingForm = ({ establishment, rooms, selectedRoomId, setSelectedRoomId, formRef }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nbPersonnes, setNbPersonnes] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const availableRooms = (rooms || []).filter((r) => r.nbDisponible > 0 && r.actif !== false)
  const today = new Date().toISOString().slice(0, 10)

  const nbNuits = dateDebut && dateFin
    ? Math.max(0, Math.ceil((new Date(dateFin) - new Date(dateDebut)) / 86400000))
    : 0
  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId)
  const prixTotal = selectedRoom && nbNuits > 0
    ? nbNuits * parseFloat(selectedRoom.prixNuit)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!user) {
      navigate('/login')
      return
    }
    if (!dateDebut || !dateFin) {
      setError('الرجاء اختيار تاريخي الوصول والمغادرة.')
      return
    }
    if (new Date(dateFin) <= new Date(dateDebut)) {
      setError('يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول.')
      return
    }
    if (!selectedRoomId) {
      setError('الرجاء اختيار غرفة.')
      return
    }

    setSubmitting(true)
    const res = await reservationsApi.createReservation({
      establishmentId: establishment.id,
      roomId: selectedRoomId,
      dateDebut,
      dateFin,
      nbPersonnes: parseInt(nbPersonnes, 10) || 1,
    })
    setSubmitting(false)

    if (res.success) {
      setSuccess('تم إرسال طلب الحجز! سيرد عليك صاحب المؤسسة قريباً.')
      setDateDebut('')
      setDateFin('')
      setSelectedRoomId('')
      setNbPersonnes(1)
    } else {
      setError(res.message || 'حدث خطأ أثناء الحجز.')
    }
  }

  if (availableRooms.length === 0) {
    return (
      <div ref={formRef} className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <p className="text-sm text-slate-500 text-center py-4">
          لا توجد غرف متاحة حالياً.
        </p>
      </div>
    )
  }

  return (
    <div ref={formRef} className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h3 className="text-lg font-bold text-[#1A2951] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
        حجز
      </h3>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ الوصول</label>
          <DatePicker
            value={dateDebut}
            onChange={setDateDebut}
            minDate={today}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">تاريخ المغادرة</label>
          <DatePicker
            value={dateFin}
            onChange={setDateFin}
            minDate={dateDebut || today}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">الغرفة</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="block w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] outline-none transition"
            required
          >
            <option value="">— اختر —</option>
            {availableRooms.map((room) => {
              const prix = parseFloat(room.prixNuit ?? room.prix_nuit)
              const displayPrix = !isNaN(prix) && isFinite(prix) ? Math.round(prix).toLocaleString('ar-DZ') : '0'
              return (
                <option key={room.id} value={room.id}>
                  {room.nomType || room.nom_type || 'غرفة'} — {displayPrix} دج/ليلة (سعة {room.capacite || 1})
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">عدد الأشخاص</label>
          <input
            type="number"
            min="1"
            max={selectedRoom?.capacite || 10}
            value={nbPersonnes}
            onChange={(e) => setNbPersonnes(e.target.value)}
            className="block w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] outline-none transition"
          />
        </div>

        {nbNuits > 0 && selectedRoom && (
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">
                {nbNuits} ليلة × {!isNaN(parseFloat(selectedRoom.prixNuit ?? selectedRoom.prix_nuit)) ? Math.round(parseFloat(selectedRoom.prixNuit ?? selectedRoom.prix_nuit)).toLocaleString('ar-DZ') : '0'} دج
              </span>
              <span className="font-bold text-[#1A2951]">
                {!isNaN(prixTotal) && isFinite(prixTotal) ? Math.round(prixTotal).toLocaleString('ar-DZ') : '0'} دج
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="block w-full text-center bg-[#1A2951] text-white py-3 rounded-lg font-semibold hover:bg-[#F97316] transition-colors disabled:opacity-50"
        >
          {submitting ? 'جاري الإرسال...' : user ? 'إرسال الطلب' : 'سجل الدخول للحجز'}
        </button>
      </form>
    </div>
  )
}

const EstablishmentDetail = () => {
  const { id } = useParams()
  const [establishment, setEstablishment] = useState(null)
  const [reviews, setReviews] = useState([])
  const [ratingSummary, setRatingSummary] = useState({ avgRating: 0, reviewCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [lightboxImage, setLightboxImage] = useState(null)
  const bookingFormRef = useRef(null)

  const handleReserveRoom = (roomId) => {
    setSelectedRoomId(roomId)
    bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const loadData = async () => {
    try {
      const [estRes, reviewsRes, ratingRes] = await Promise.all([
        establishmentsApi.getEstablishment(id),
        reviewsApi.getReviews(id),
        reviewsApi.getEstablishmentRating(id),
      ])
      if (estRes.success) setEstablishment(estRes.data)
      else setError(estRes.message)
      if (reviewsRes.success) setReviews(reviewsRes.data)
      if (ratingRes.success) setRatingSummary(ratingRes.data)
    } catch (err) {
      setError('حدث خطأ أثناء تحميل بيانات المؤسسة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2951]"></div>
      </div>
    )
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'المؤسسة غير موجودة.'}</p>
          <Link to="/etablissements" className="text-[#F97316] hover:underline">
            العودة إلى المؤسسات
          </Link>
        </div>
      </div>
    )
  }

  const cover = establishment.imageVedette || establishment.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  const typeLabel = TYPE_LABELS[establishment.type] || establishment.type || 'إقامة'
  const rooms = establishment.rooms || []
  const validPrices = rooms
    .map(r => parseFloat(r.prixNuit ?? r.prix_nuit))
    .filter(p => !isNaN(p) && isFinite(p) && p > 0)
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      {/* صورة البانر */}
      <div className="relative h-96 bg-gray-200">
        <img src={cover} alt={establishment.nom} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block bg-[#F97316] text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
              {typeLabel}
            </span>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
              {establishment.nom}
            </h1>
            <div className="flex items-center gap-4 text-gray-200">
              <p className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {establishment.ville}, {establishment.wilaya}
              </p>
              {ratingSummary.reviewCount > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                  <svg className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                  <span className="text-sm font-bold text-white">{ratingSummary.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-300">({ratingSummary.reviewCount} تقييم)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* المحتوى الرئيسي */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-[#1A2951] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316]/15 text-[#F97316]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                الوصف
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {establishment.description || 'لا يوجد وصف متاح لهذه المؤسسة.'}
              </p>

              {establishment.services && establishment.services.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1A2951] mb-3">
                    <svg className="w-4 h-4 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    الخدمات والتجهيزات
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {establishment.services.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-xs font-medium text-amber-900">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {establishment.images && establishment.images.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-[#1A2951] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316]/15 text-[#F97316]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  المعرض
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {establishment.images.map((img, index) => (
                    <div key={index} className="w-full aspect-square rounded-xl bg-neutral-100 overflow-hidden">
                      <img
                        src={img}
                        alt={`${establishment.nom} - ${index + 1}`}
                        className="w-full h-full object-contain hover:opacity-90 transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* قسم الغرف */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-[#1A2951] mb-6" style={{ fontFamily: 'Fraunces, serif' }}>
                الغرف والأسعار
              </h2>
              {rooms.length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد غرف متاحة حالياً.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {rooms.map((room) => {
                    const roomImg = room.images?.[0] || null
                    const roomPrice = parseFloat(room.prixNuit ?? room.prix_nuit)
                    const displayPrice = !isNaN(roomPrice) && isFinite(roomPrice) ? Math.round(roomPrice).toLocaleString('ar-DZ') : '0'
                    return (
                      <div key={room.id} className="group rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:border-[#F97316] hover:shadow-lg transition">
                        <div
                          className={`relative aspect-[4/3] w-full bg-neutral-100 ${roomImg ? 'cursor-zoom-in' : ''}`}
                          onClick={() => roomImg && setLightboxImage(roomImg)}
                        >
                          {roomImg ? (
                            <img
                              src={roomImg}
                              alt={room.nomType}
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7l9-4 9 4v11a1 1 0 01-1 1h-4v-6H8v6H4a1 1 0 01-1-1V7z" />
                              </svg>
                            </div>
                          )}
                          {roomImg && (
                            <span className="absolute right-2 top-2 flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow opacity-0 group-hover:opacity-100 transition">
                              <svg className="w-4 h-4 text-[#1A2951]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                              </svg>
                            </span>
                          )}
                          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#1A2951] shadow">
                            <svg className="w-3.5 h-3.5 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {room.capacite || 1}
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-[#1A2951] text-base mb-2 truncate">{room.nomType}</h4>
                          {room.services && room.services.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {room.services.map((s, idx) => (
                                <span key={idx} className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-medium border border-amber-200 truncate max-w-[110px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                            <p className="text-lg font-bold text-[#1A2951]" style={{ fontFamily: 'Fraunces, serif' }}>
                              {displayPrice}
                              <span className="ml-1 text-xs font-normal text-slate-400">دج/ليلة</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => handleReserveRoom(room.id)}
                              disabled={!(room.nbDisponible > 0 && room.actif !== false)}
                              className="rounded-lg bg-[#1A2951] px-4 py-2 text-xs font-semibold text-white hover:bg-[#F97316] transition-colors disabled:opacity-40 disabled:hover:bg-[#1A2951]"
                            >
                              حجز
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* قسم التقييمات */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1A2951]" style={{ fontFamily: 'Fraunces, serif' }}>
                  التقييمات والملاحظات
                </h2>
                {ratingSummary.reviewCount > 0 && (
                  <StarRating rating={ratingSummary.avgRating} count={ratingSummary.reviewCount} size="lg" />
                )}
              </div>

              {ratingSummary.reviewCount === 0 ? (
                <p className="text-sm text-slate-500 mb-6">لا توجد تقييمات حالياً. كن أول من يقيّم!</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-100 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-[#1A2951]">
                            {review.user ? `${review.user.prenom} ${review.user.nom}` : 'مستخدم مجهول'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <StarRating rating={review.rating} count={null} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <ReviewForm establishmentId={id} onSubmitted={loadData} />
            </div>
          </div>

          {/* الشريط الجانبي - الحجز */}
          <div className="lg:col-span-1">
            <BookingForm
              establishment={establishment}
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
              formRef={bookingFormRef}
            />

            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#1A2951] mb-4">معلومات</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <svg className="w-5 h-5 text-[#F97316] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{establishment.adresse || `${establishment.ville}, ${establishment.wilaya}`}</span>
                </div>
                {minPrice != null && !isNaN(minPrice) && isFinite(minPrice) && minPrice > 0 && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-[#F97316] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>تبدأ من <strong>{Math.round(minPrice).toLocaleString('ar-DZ')} دج</strong>/ليلة</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="إغلاق"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="صورة الغرفة"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default EstablishmentDetail
