import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { WILAYAS } from '../constants/wilayas'

const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const MAX_PHOTOS = 8

const Register = () => {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'etablissement' || searchParams.get('role') === 'owner' ? 'owner' : 'client'

  const [accountRole, setAccountRole] = useState(initialType) // 'client' or 'owner'

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    nomEtablissement: '',
    typeEtablissement: 'hotel',
    wilaya: 'Alger',
    ville: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Multi-image state for establishment photos
  // Each item: { file: File, preview: base64 data URL for display only }
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState(null)

  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const type = searchParams.get('type')
    const role = searchParams.get('role')
    if (type === 'etablissement' || role === 'owner') {
      setAccountRole('owner')
    } else if (type === 'client' || role === 'client') {
      setAccountRole('client')
    }
  }, [searchParams])

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
      setPhotoError(`Vous avez déjà atteint le maximum de ${MAX_PHOTOS} photos.`)
      e.target.value = ''
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    if (files.length > remainingSlots) {
      setPhotoError(`Seules ${remainingSlots} photo(s) supplémentaire(s) ont été ajoutées (maximum ${MAX_PHOTOS}).`)
    }

    const validFiles = []
    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE_BYTES) {
        setPhotoError(`Une ou plusieurs photos dépassent la limite autorisée de ${MAX_SIZE_MB} Mo.`)
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
    setError(null)
    setSuccess(null)

    // Client-side validation with clear messages
    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    if (!formData.prenom.trim()) {
      setError('Le prénom est obligatoire.')
      return
    }
    if (accountRole === 'owner' && !formData.nomEtablissement.trim()) {
      setError("Le nom de l'établissement est obligatoire.")
      return
    }
    if (accountRole === 'owner' && !formData.ville.trim()) {
      setError('La ville est obligatoire.')
      return
    }
    if (!formData.email.trim()) {
      setError("L'email est obligatoire.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setError("Format d'email invalide.")
      return
    }
    if (!formData.telephone.trim()) {
      setError('Le téléphone est obligatoire.')
      return
    }
    const phoneRegex = /^[0-9+\s-]{8,}$/
    if (!phoneRegex.test(formData.telephone.trim())) {
      setError('Numéro de téléphone invalide.')
      return
    }
    if (!formData.motDePasse) {
      setError('Le mot de passe est obligatoire.')
      return
    }
    if (formData.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)

    console.log('Registering with data:', {
      nom: formData.nom,
      prenom: formData.prenom,
      nomEtablissement: accountRole === 'owner' ? formData.nomEtablissement : '',
      role: accountRole,
    });

    const result = await register({
      nom: formData.nom,
      prenom: formData.prenom,
      nomEtablissement: accountRole === 'owner' ? formData.nomEtablissement : '',
      typeEtablissement: accountRole === 'owner' ? formData.typeEtablissement : 'hotel',
      wilaya: accountRole === 'owner' ? formData.wilaya : '',
      ville: accountRole === 'owner' ? formData.ville : '',
      photoEtablissement: accountRole === 'owner' ? photos.map((p) => p.preview) : [],
      email: formData.email,
      telephone: formData.telephone,
      motDePasse: formData.motDePasse,
      role: accountRole,
    })

    if (result.success) {
      setSuccess(
        accountRole === 'owner'
          ? "Votre demande a été soumise avec succès! Elle sera examinée par l'administration. Vous recevrez une notification dès qu'elle sera approuvée ou refusée."
          : 'Inscription client réussie! Vous pouvez maintenant vous connecter.'
      )
      setFormData({
        nom: '',
        prenom: '',
        nomEtablissement: '',
        typeEtablissement: 'hotel',
        wilaya: 'Alger',
        ville: '',
        email: '',
        telephone: '',
        motDePasse: '',
        confirmMotDePasse: '',
      })
      setPhotos([])
      setPhotoError(null)
    } else {
      setError(result.error || result.message || "Erreur lors de l'inscription.")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1E3D] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[#CB9A56]/15 blur-3xl" />

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <Logo className="h-12 mx-auto" withText dark />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            Inscription
          </h1>
          <p className="text-[#E4C48A] text-sm">
            Rejoignez Diyafa et découvrez les meilleurs hébergements en Algérie
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-100">
          {/* Badge du type de compte choisi depuis le menu "Inscription" de la navbar */}
          <div className="mb-8 flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  accountRole === 'owner' ? 'bg-[#CB9A56]/20 text-[#CB9A56]' : 'bg-[#0E1E3D]/10 text-[#0E1E3D]'
                }`}
              >
                {accountRole === 'owner' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
                    <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" strokeWidth="2" />
                    <path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Type de compte
                </p>
                <p className="text-sm font-bold text-[#0E1E3D]">
                  {accountRole === 'owner' ? 'Établissement (مؤسسة)' : 'Client (زبون)'}
                </p>
              </div>
            </div>

            <Link
              to={accountRole === 'owner' ? '/register?type=client' : '/register?type=etablissement'}
              className="shrink-0 text-xs font-bold text-[#CB9A56] hover:text-[#0E1E3D] transition-colors whitespace-nowrap"
            >
              Changer
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-4 rounded-xl">
                <div className="flex items-start gap-3 mb-1">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider">Erreur</p>
                </div>
                <p className="text-sm font-medium leading-relaxed pr-8">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-semibold">{success}</p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 inline-block text-center rounded-xl bg-[#0E1E3D] text-white py-2.5 px-4 text-xs font-bold hover:bg-[#CB9A56] hover:text-[#0E1E3D] transition"
                >
                  Se connecter maintenant →
                </Link>
              </div>
            )}

            {accountRole === 'owner' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nomEtablissement" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                    Nom de l'établissement
                  </label>
                  <input
                    id="nomEtablissement"
                    name="nomEtablissement"
                    type="text"
                    required={accountRole === 'owner'}
                    value={formData.nomEtablissement}
                    onChange={handleChange}
                    placeholder="Ex: Hôtel El Aurassi, Résidence Saoura..."
                    className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="typeEtablissement" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      Type d'établissement
                    </label>
                    <select
                      id="typeEtablissement"
                      name="typeEtablissement"
                      value={formData.typeEtablissement}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                      disabled={isSubmitting}
                    >
                      <option value="hotel">Hôtel</option>
                      <option value="dortoir">Dortoir</option>
                      <option value="maison">Maison</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="wilaya" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      Wilaya
                    </label>
                    <select
                      id="wilaya"
                      name="wilaya"
                      value={formData.wilaya}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                      disabled={isSubmitting}
                    >
                      {WILAYAS.map((w, i) => (
                        <option key={w} value={w}>{i + 1} - {w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ville" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                    Ville
                  </label>
                  <input
                    id="ville"
                    name="ville"
                    type="text"
                    required={accountRole === 'owner'}
                    value={formData.ville}
                    onChange={handleChange}
                    placeholder="Ex: Alger, Oran, Constantine..."
                    className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                    Photos de l'établissement (max {MAX_PHOTOS}, {MAX_SIZE_MB} Mo chacune)
                  </label>

                  {photoError && (
                    <div className="mb-2 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{photoError}</span>
                    </div>
                  )}

                  {photos.length < MAX_PHOTOS && (
                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-neutral-300 rounded-2xl cursor-pointer hover:border-[#CB9A56] bg-neutral-50/70 hover:bg-neutral-50 transition-all text-center group mb-3">
                      <svg className="w-8 h-8 text-[#CB9A56] mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-[#0E1E3D]">
                        Cliquez pour choisir ou glissez vos photos ici
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Formats supportés: PNG, JPG, WEBP (Max {MAX_SIZE_MB} Mo par photo)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>
                  )}

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {photos.map((p, index) => (
                        <div
                          key={index}
                          className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-900 group"
                        >
                          <img
                            src={p.preview}
                            alt={`Photo établissement ${index + 1}`}
                            className="w-full h-28 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-md transition opacity-0 group-hover:opacity-100"
                            aria-label="Supprimer"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                            {(p.file.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  Nom
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  placeholder="votre@email.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="telephone" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  placeholder="06XXXXXXXX"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="motDePasse" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.motDePasse}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l-3.293-3.293m0 0a3 3 0 104.243-4.243l3.293 3.293m-3.293-3.293l3.293 3.293M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Au moins 8 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmMotDePasse" className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmMotDePasse"
                name="confirmMotDePasse"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmMotDePasse}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm transition-all outline-none"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-[#0E1E3D] bg-[#CB9A56] hover:bg-[#E4C48A] focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                `S'inscrire comme ${accountRole === 'owner' ? 'Établissement' : 'Client'}`
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-slate-500">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-bold text-[#CB9A56] hover:text-[#0E1E3D] transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-[#E4C48A] hover:text-white transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
