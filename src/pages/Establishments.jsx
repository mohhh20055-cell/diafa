import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import HoverRevealCard from '../components/HoverRevealCard'
import * as establishmentsApi from '../api/establishments'
import { getRatingsBatch } from '../api/reviews'
import { WILAYAS } from '../constants/wilayas'
import { getVillesByWilaya } from '../constants/villes'

const Establishments = () => {
  const [searchParams] = useSearchParams()
  const [establishments, setEstablishments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wilaya, setWilaya] = useState(searchParams.get('wilaya') || '')
  const [ville, setVille] = useState(searchParams.get('ville') || '')
  const typeFilter = searchParams.get('type') || ''
  const villesDisponibles = wilaya ? getVillesByWilaya(wilaya) : []

  useEffect(() => {
    const vil = searchParams.get('ville')
    const wil = searchParams.get('wilaya')
    const type = searchParams.get('type')
    if (vil) setVille(vil)
    if (wil) setWilaya(wil)
    loadEstablishments({ ville: vil, wilaya: wil, type })
  }, [searchParams])

  const loadEstablishments = async (params = {}) => {
    try {
      setLoading(true)
      setError(null)
      const query = {}
      if (params.ville) query.ville = params.ville
      if (params.wilaya) query.wilaya = params.wilaya
      if (params.type || typeFilter) query.type = params.type || typeFilter
      const data = await establishmentsApi.getEstablishments(query)
      if (data.success) {
        const list = data.data || []
        if (list.length > 0) {
          const ratingsRes = await getRatingsBatch(list.map((e) => e.id))
          const ratingsMap = ratingsRes.success ? ratingsRes.data : {}
          const withRatings = list.map((e) => ({
            ...e,
            rating: ratingsMap[e.id] || { avgRating: 0, reviewCount: 0 },
          }))
          setEstablishments(withRatings)
        } else {
          setEstablishments([])
        }
      } else {
        setError(data.message || 'حدث خطأ أثناء التحميل.')
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل المؤسسات.')
    } finally {
      setLoading(false)
    }
  }

  const handleWilayaChange = (newWilaya) => {
    setWilaya(newWilaya)
    setVille('') // إعادة تعيين المدينة عند تغيير الولاية
    loadEstablishments({ ville: '', wilaya: newWilaya, type: typeFilter })
  }

  const handleVilleChange = (newVille) => {
    setVille(newVille)
    loadEstablishments({ ville: newVille, wilaya, type: typeFilter })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1A2951] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            مؤسساتنا
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اكتشف مجموعتنا من الفنادق والمراقد وبيوت الضيافة في جميع أنحاء الجزائر
          </p>
        </div>

        {/* عوامل التصفية - فقط الولاية والمدينة، تطبق تلقائياً، بدون زر */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 mb-8">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-[#1A2951] mb-2">الولاية</label>
            <select
              value={wilaya}
              onChange={(e) => handleWilayaChange(e.target.value)}
              className="block w-full px-4 py-2 border border-[#1A2951]/30 rounded-lg text-[#1A2951] focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316]"
            >
              <option value="">جميع الولايات</option>
              {WILAYAS.map((w, i) => (
                <option key={w} value={w}>{i + 1} - {w}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-[#1A2951] mb-2">المدينة</label>
            <select
              value={ville}
              onChange={(e) => handleVilleChange(e.target.value)}
              disabled={!wilaya}
              className="block w-full px-4 py-2 border border-[#1A2951]/30 rounded-lg text-[#1A2951] focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {wilaya ? 'جميع المدن' : 'اختر ولاية أولاً'}
              </option>
              {villesDisponibles.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2951]"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => loadEstablishments()} className="text-[#F97316] hover:underline">
              إعادة المحاولة
            </button>
          </div>
        ) : establishments.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
            </svg>
            <p className="text-gray-500 text-lg">لم يتم العثور على مؤسسات.</p>
            <p className="text-sm text-gray-400 mt-2">حاول تعديل معايير البحث الخاصة بك.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              تم العثور على {establishments.length} مؤسسة
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {establishments.map((establishment) => {
                const validPrices = (establishment.rooms || [])
                  .map((r) => parseFloat(r.prixNuit ?? r.prix_nuit))
                  .filter((p) => !isNaN(p) && isFinite(p) && p > 0)
                const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null
                const rating = establishment.rating || { avgRating: 0, reviewCount: 0 }
                const estServices = Array.isArray(establishment.services)
                  ? establishment.services
                  : (typeof establishment.services === 'string' ? establishment.services.split(',').map(s => s.trim()).filter(Boolean) : [])
                const roomServices = (establishment.rooms || []).flatMap(r =>
                  Array.isArray(r.services) ? r.services : (typeof r.services === 'string' ? r.services.split(',').map(s => s.trim()).filter(Boolean) : [])
                )
                const cardAmenities = Array.from(new Set([...estServices, ...roomServices]))

                return (
                  <Link key={establishment.id} to={`/etablissements/${establishment.id}`}>
                    <HoverRevealCard
                      image={establishment.imageVedette || establishment.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                      badge={establishment.type === 'hotel' ? 'فندق' : establishment.type === 'mraqed' ? 'مرقد' : 'بيت ضيافة'}
                      title={establishment.nom}
                      location={`${establishment.ville || ''}, ${establishment.wilaya || ''}`.replace(/^,\s*|,\s*$/g, '')}
                      rating={rating.avgRating > 0 ? rating.avgRating : null}
                      reviewsCount={rating.reviewCount}
                      amenities={cardAmenities}
                      price={minPrice != null && isFinite(minPrice) && minPrice > 0 ? `${Math.round(minPrice).toLocaleString('ar-DZ')} دج` : 'حسب الطلب'}
                      priceUnit="/ليلة"
                      onBook={() => {}}
                    />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Establishments
