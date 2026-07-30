import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import * as establishmentsApi from '../api/establishments'
import * as reviewsApi from '../api/reviews'
import * as reservationsApi from '../api/reservations'
import { useAuth } from '../context/AuthContext'
import DatePicker from '../components/DatePicker'

const TYPE_LABELS = { hotel: 'Hôtel', mraqed: 'Dortoir', maison: 'Maison' }

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
            className={`${starSize} ${s <= rounded ? 'text-[#CB9A56]' : 'text-neutral-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
          </svg>
        ))}
      </div>
      {count != null && (
        <span className={`font-medium text-slate-500 ${size === 'lg' ? 'text-base ml-2' : 'text-xs ml-1'}`}>
          {rating.toFixed(1)} ({count} avis)
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
      setError('Veuillez sélectionner une note.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    const res = await reviewsApi.addReview(establishmentId, { rating, comment })
    setSubmitting(false)
    if (res.success) {
      setSuccess('Avis publié avec succès!')
      setRating(0)
      setComment('')
      onSubmitted?.()
    } else {
      setError(res.message || "Erreur lors de l'envoi de l'avis.")
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">Connectez-vous pour laisser un avis.</p>
        <Link
          to="/login"
          className="inline-block rounded-lg bg-[#152A54] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#CB9A56] transition-colors"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6">
      <h4 className="text-sm font-bold uppercase tracking-wide text-[#152A54] mb-4">
        Laisser un avis
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
        <label className="block text-xs font-semibold text-slate-600 mb-2">Votre note</label>
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
                className={`w-7 h-7 ${(hover || rating) >= s ? 'text-[#CB9A56]' : 'text-neutral-300'}`}
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
          Commentaire (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Partagez votre expérience..."
          className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[#CB9A56] focus:ring-2 focus:ring-[#CB9A56]/30 transition"
          disabled={submitting}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[#152A54] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#CB9A56] transition-colors disabled:opacity-50"
      >
        {submitting ? 'Envoi...' : 'Publier mon avis'}
      </button>
    </form>
  )
}

const BookingForm = ({ establishment, rooms }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nbPersonnes, setNbPersonnes] = useState(1)
  const [selectedRoomId, setSelectedRoomId] = useState('')
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
      setError('Veuillez sélectionner les dates d\'arrivée et de départ.')
      return
    }
    if (new Date(dateFin) <= new Date(dateDebut)) {
      setError('La date de départ doit être après la date d\'arrivée.')
      return
    }
    if (!selectedRoomId) {
      setError('Veuillez sélectionner une chambre.')
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
      setSuccess('Demande de réservation envoyée! L\'établissement vous répondra bientôt.')
      setDateDebut('')
      setDateFin('')
      setSelectedRoomId('')
      setNbPersonnes(1)
    } else {
      setError(res.message || 'Erreur lors de la réservation.')
    }
  }

  if (availableRooms.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
        <p className="text-sm text-slate-500 text-center py-4">
          Aucune chambre disponible pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h3 className="text-lg font-bold text-[#152A54] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
        Réserver
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
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date d'arrivée</label>
          <DatePicker
            value={dateDebut}
            onChange={setDateDebut}
            minDate={today}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date de départ</label>
          <DatePicker
            value={dateFin}
            onChange={setDateFin}
            minDate={dateDebut || today}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chambre</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="block w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
            required
          >
            <option value="">— Choisir —</option>
            {availableRooms.map((room) => {
              const prix = parseFloat(room.prixNuit ?? room.prix_nuit)
              const displayPrix = !isNaN(prix) && isFinite(prix) ? Math.round(prix).toLocaleString('fr-FR') : '0'
              return (
                <option key={room.id} value={room.id}>
                  {room.nomType || room.nom_type || 'Chambre'} — {displayPrix} DA/nuit (cap. {room.capacite || 1})
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Personnes</label>
          <input
            type="number"
            min="1"
            max={selectedRoom?.capacite || 10}
            value={nbPersonnes}
            onChange={(e) => setNbPersonnes(e.target.value)}
            className="block w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] outline-none transition"
          />
        </div>

        {nbNuits > 0 && selectedRoom && (
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">
                {nbNuits} nuit(s) × {!isNaN(parseFloat(selectedRoom.prixNuit ?? selectedRoom.prix_nuit)) ? Math.round(parseFloat(selectedRoom.prixNuit ?? selectedRoom.prix_nuit)).toLocaleString('fr-FR') : '0'} DA
              </span>
              <span className="font-bold text-[#152A54]">
                {!isNaN(prixTotal) && isFinite(prixTotal) ? Math.round(prixTotal).toLocaleString('fr-FR') : '0'} DA
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="block w-full text-center bg-[#152A54] text-white py-3 rounded-lg font-semibold hover:bg-[#CB9A56] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Envoi...' : user ? 'Envoyer la demande' : 'Se connecter pour réserver'}
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
      setError("Erreur lors du chargement de l'établissement.")
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#152A54]"></div>
      </div>
    )
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Établissement introuvable.'}</p>
          <Link to="/etablissements" className="text-[#CB9A56] hover:underline">
            Retour aux établissements
          </Link>
        </div>
      </div>
    )
  }

  const cover = establishment.imageVedette || establishment.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  const typeLabel = TYPE_LABELS[establishment.type] || establishment.type || 'Hébergement'
  const rooms = establishment.rooms || []
  const validPrices = rooms
    .map(r => parseFloat(r.prixNuit ?? r.prix_nuit))
    .filter(p => !isNaN(p) && isFinite(p) && p > 0)
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      {/* Hero Image */}
      <div className="relative h-96 bg-gray-200">
        <img src={cover} alt={establishment.nom} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block bg-[#CB9A56] text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
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
                  <svg className="w-4 h-4 text-[#CB9A56]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                  <span className="text-sm font-bold text-white">{ratingSummary.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-300">({ratingSummary.reviewCount} avis)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-[#152A54] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
                Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {establishment.description || 'Aucune description disponible pour cet établissement.'}
              </p>

              {establishment.services && establishment.services.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#152A54] mb-3">Services & équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {establishment.services.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rooms Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-[#152A54] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
                Chambres & Tarifs
              </h2>
              {rooms.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune chambre disponible pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => {
                    const roomImg = room.images?.[0] || null
                    return (
                      <div key={room.id} className="border border-neutral-200 rounded-xl overflow-hidden hover:border-[#CB9A56] transition bg-white flex flex-col sm:flex-row">
                        {roomImg && (
                          <div className="sm:w-48 h-40 sm:h-auto shrink-0 bg-neutral-100 relative">
                            <img src={roomImg} alt={room.nomType} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-[#152A54] text-base mb-1">{room.nomType}</h4>
                              {room.description && (
                                <p className="text-xs text-slate-600 mb-3">{room.description}</p>
                              )}
                              {room.services && room.services.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {room.services.map((s, idx) => (
                                    <span key={idx} className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-medium border border-amber-200">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4 text-[#CB9A56]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {room.capacite} personne(s)
                                </span>
                                <span className={`flex items-center gap-1 ${room.nbDisponible > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {room.nbDisponible > 0 ? `${room.nbDisponible} disponible(s)` : 'Complet'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-bold text-[#152A54]" style={{ fontFamily: 'Fraunces, serif' }}>
                                {!isNaN(parseFloat(room.prixNuit ?? room.prix_nuit)) && isFinite(parseFloat(room.prixNuit ?? room.prix_nuit))
                                  ? Math.round(parseFloat(room.prixNuit ?? room.prix_nuit)).toLocaleString('fr-FR')
                                  : '0'}
                              </p>
                              <p className="text-xs text-slate-400">DA / nuit</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {establishment.images && establishment.images.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-[#152A54] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
                  Galerie
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {establishment.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${establishment.nom} - ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#152A54]" style={{ fontFamily: 'Fraunces, serif' }}>
                  Avis & Notes
                </h2>
                {ratingSummary.reviewCount > 0 && (
                  <StarRating rating={ratingSummary.avgRating} count={ratingSummary.reviewCount} size="lg" />
                )}
              </div>

              {ratingSummary.reviewCount === 0 ? (
                <p className="text-sm text-slate-500 mb-6">Aucun avis pour le moment. Soyez le premier à donner votre avis!</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-100 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-[#152A54]">
                            {review.user ? `${review.user.prenom} ${review.user.nom}` : 'Utilisateur anonyme'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
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

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <BookingForm establishment={establishment} rooms={rooms} />

            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#152A54] mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <svg className="w-5 h-5 text-[#CB9A56] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{establishment.adresse || `${establishment.ville}, ${establishment.wilaya}`}</span>
                </div>
                {minPrice != null && !isNaN(minPrice) && isFinite(minPrice) && minPrice > 0 && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-[#CB9A56] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>À partir de <strong>{Math.round(minPrice).toLocaleString('fr-FR')} DA</strong>/nuit</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EstablishmentDetail
