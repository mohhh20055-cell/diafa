import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Logo from '../components/Logo'
import { WILAYAS } from '../constants/wilayas'

const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const MAX_PHOTOS = 8

const Register = () => {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'etablissement' || searchParams.get('role') === 'owner' ? 'owner' : 'client'

  const [accountRole, setAccountRole] = useState(initialType)

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
      setPhotoError(`Maximum ${MAX_PHOTOS} photos reached.`)
      e.target.value = ''
      return
    }

    const filesToProcess = files.slice(0, remainingSlots)
    const validFiles = []
    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE_BYTES) {
        setPhotoError(`Photo size exceeds ${MAX_SIZE_MB} MB limit.`)
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
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.nom.trim()) {
      setError(t('error'))
      return
    }
    if (!formData.prenom.trim()) {
      setError(t('error'))
      return
    }
    if (accountRole === 'owner') {
      if (!formData.nomEtablissement.trim()) {
        setError(t('error'))
        return
      }
      if (!formData.wilaya.trim()) {
        setError(t('error'))
        return
      }
      if (!formData.ville.trim()) {
        setError(t('error'))
        return
      }
    }
    if (!formData.email.trim()) {
      setError(t('error'))
      return
    }
    if (!formData.telephone.trim()) {
      setError(t('error'))
      return
    }
    if (!formData.motDePasse || formData.motDePasse.length < 8) {
      setError(t('error'))
      return
    }
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError(t('error'))
      return
    }

    setIsSubmitting(true)

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
          ? 'Registration submitted successfully! It will be reviewed by administration.'
          : 'Client registration successful! You can now log in.'
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
      setError(result.error || result.message || t('error'))
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E1E3D] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[#CB9A56]/15 blur-3xl" />

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform">
            <Logo className="h-12 mx-auto" withText dark />
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            {t('registerTitle')}
          </h1>
          <p className="text-[#E4C48A] text-sm">
            {t('registerSubtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-neutral-100">
          <div className="mb-8">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-3">
              {t('accountType')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountRole('client')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  accountRole === 'client'
                    ? 'border-[#CB9A56] bg-[#CB9A56]/10 ring-2 ring-[#CB9A56]'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="font-bold text-[#0E1E3D] mb-1">{t('client')}</div>
                <div className="text-xs text-slate-500">{t('clientAccount')}</div>
              </button>
              <button
                type="button"
                onClick={() => setAccountRole('owner')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  accountRole === 'owner'
                    ? 'border-[#CB9A56] bg-[#CB9A56]/10 ring-2 ring-[#CB9A56]'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="font-bold text-[#0E1E3D] mb-1">{t('partnerSpace')}</div>
                <div className="text-xs text-slate-500">{t('ownerAccount')}</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-4 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">{t('error')}</p>
                <p className="text-xs">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-300 text-green-800 px-4 py-4 rounded-xl">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">{t('success')}</p>
                <p className="text-xs">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  {t('lastName')}
                </label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  {t('firstName')}
                </label>
                <input
                  type="text"
                  name="prenom"
                  required
                  value={formData.prenom}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {accountRole === 'owner' && (
              <div className="space-y-6 pt-4 border-t border-neutral-100">
                <h3 className="text-sm font-bold text-[#0E1E3D] uppercase tracking-wider">
                  {t('establishmentInfo')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      {t('establishmentName')}
                    </label>
                    <input
                      type="text"
                      name="nomEtablissement"
                      required={accountRole === 'owner'}
                      value={formData.nomEtablissement}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      {t('establishmentType')}
                    </label>
                    <select
                      name="typeEtablissement"
                      value={formData.typeEtablissement}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="hotel">{t('hotel')}</option>
                      <option value="mraqed">{t('mraqed')}</option>
                      <option value="maison">{t('maison')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      {t('wilaya')}
                    </label>
                    <select
                      name="wilaya"
                      value={formData.wilaya}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                      disabled={isSubmitting}
                    >
                      {WILAYAS.map((w, i) => (
                        <option key={w} value={w}>{i + 1} - {w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                      {t('city')}
                    </label>
                    <input
                      type="text"
                      name="ville"
                      required={accountRole === 'owner'}
                      value={formData.ville}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                    {t('establishmentPhotos')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#CB9A56]/10 file:text-[#0E1E3D] hover:file:bg-[#CB9A56]/20"
                    disabled={isSubmitting}
                  />
                  {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {photos.map((p, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border">
                          <img src={p.preview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-80 hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                  placeholder="exemple@email.com"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                  {t('phone')}
                </label>
                <input
                  type="text"
                  name="telephone"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                  placeholder="06XXXXXXXX"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                name="motDePasse"
                required
                value={formData.motDePasse}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <p className="text-[11px] text-slate-400 mt-1">{t('minChars')}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#0E1E3D] mb-2">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                name="confirmMotDePasse"
                required
                value={formData.confirmMotDePasse}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#CB9A56] focus:border-[#CB9A56] text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-[#0E1E3D] bg-[#CB9A56] hover:bg-[#E4C48A] focus:outline-none transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? t('loading') : t('register')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-slate-500">
              {t('haveAccount')}{' '}
              <Link to="/login" className="font-bold text-[#CB9A56] hover:text-[#0E1E3D] transition-colors">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-[#E4C48A] hover:text-white transition-colors">
            ← {t('exploreEstablishments')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
