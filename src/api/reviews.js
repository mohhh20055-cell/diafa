import { supabase } from '../lib/supabase'
import { getAuthUser } from './auth'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

export const getEstablishmentRating = async (establishmentId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('note')
      .eq('establishment_id', establishmentId)
    if (error) return ok({ avgRating: 0, reviewCount: 0 })
    if (!data || data.length === 0) return ok({ avgRating: 0, reviewCount: 0 })

    const sum = data.reduce((acc, r) => acc + (r.note || 0), 0)
    return ok({
      avgRating: Math.round((sum / data.length) * 10) / 10,
      reviewCount: data.length,
    })
  } catch (err) {
    return fail(err.message)
  }
}

export const getRatingsBatch = async (establishmentIds) => {
  try {
    if (!establishmentIds || establishmentIds.length === 0) return ok({})
    const { data, error } = await supabase
      .from('reviews')
      .select('establishment_id, note')
      .in('establishment_id', establishmentIds)
    if (error) return ok({})

    const map = {}
    ;(data || []).forEach((row) => {
      const id = row.establishment_id
      if (!map[id]) map[id] = { sum: 0, count: 0 }
      map[id].sum += (row.note || 0)
      map[id].count += 1
    })

    const res = {}
    Object.keys(map).forEach((id) => {
      res[id] = {
        avgRating: Math.round((map[id].sum / map[id].count) * 10) / 10,
        reviewCount: map[id].count,
      }
    })
    return ok(res)
  } catch (err) {
    return fail(err.message)
  }
}

export const getReviews = async (establishmentId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, note, commentaire, created_at, client_id')
      .eq('establishment_id', establishmentId)
      .order('created_at', { ascending: false })
    if (error) return fail(error.message)

    const userIds = [...new Set((data || []).map((r) => r.client_id).filter(Boolean))]
    let usersMap = {}
    if (userIds.length > 0) {
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, nom, prenom')
        .in('id', userIds)
      if (usersErr) {
        console.error('getReviews: failed to load reviewer profiles:', usersErr.message)
      } else {
        ;(users || []).forEach((u) => { usersMap[u.id] = u })
      }
    }

    return ok((data || []).map((r) => ({
      id: r.id,
      rating: r.note,
      comment: r.commentaire,
      createdAt: r.created_at,
      user: usersMap[r.client_id] ? {
        id: usersMap[r.client_id].id,
        nom: usersMap[r.client_id].nom,
        prenom: usersMap[r.client_id].prenom,
      } : null,
    })))
  } catch (err) {
    return fail(err.message)
  }
}

export const addReview = async (establishmentId, { rating, comment }) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Vous devez être connecté pour laisser un avis.')
    if (!rating || rating < 1 || rating > 5) return fail('La note doit être entre 1 et 5.')

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        establishment_id: establishmentId,
        client_id: user.id,
        note: rating,
        commentaire: comment || null,
      })
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') return fail('Vous avez déjà laissé un avis pour cet établissement.')
      return fail(error.message)
    }

    return ok(data, 'Avis publié avec succès.')
  } catch (err) {
    return fail(err.message)
  }
}

export const getGlobalRatingStats = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('note')
    if (error) return ok({ avgRating: 0, reviewCount: 0 })
    if (!data || data.length === 0) return ok({ avgRating: 0, reviewCount: 0 })

    const sum = data.reduce((acc, r) => acc + (r.note || 0), 0)
    return ok({
      avgRating: Math.round((sum / data.length) * 10) / 10,
      reviewCount: data.length,
    })
  } catch (err) {
    return fail(err.message)
  }
}

export const deleteReview = async (reviewId) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
    if (error) return fail(error.message)

    return ok(null, 'Avis supprimé.')
  } catch (err) {
    return fail(err.message)
  }
}
