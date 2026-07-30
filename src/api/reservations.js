import { supabase } from '../lib/supabase'
import { getAuthUser } from './auth'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

// Manually attach client / establishment / room data (PostgREST embed workaround).
// This avoids depending on foreign keys existing / being detected by PostgREST's
// schema cache, and avoids column-casing mismatches in embed syntax.
//
// NOTE: the `establishments` table uses snake_case columns (statut_validation,
// owner_id) — confirmed via a live Postgres error (42703). Do not switch these
// back to camelCase without re-checking the actual table in Supabase.
const attachRelations = async (reservations) => {
  const rows = reservations || []
  if (rows.length === 0) return []

  const clientIds = [...new Set(rows.map((r) => r.clientId || r.client_id).filter(Boolean))]
  const establishmentIds = [...new Set(rows.map((r) => r.establishmentId || r.establishment_id).filter(Boolean))]
  const roomIds = [...new Set(rows.map((r) => r.roomId || r.room_id).filter(Boolean))]

  const [clientsRes, estsRes, roomsRes] = await Promise.all([
    clientIds.length
      ? supabase.from('users').select('id, nom, prenom, telephone, email').in('id', clientIds)
      : Promise.resolve({ data: [] }),
    establishmentIds.length
      ? supabase.from('establishments').select('id, nom, type, ville, statut_validation, owner_id').in('id', establishmentIds)
      : Promise.resolve({ data: [] }),
    roomIds.length
      ? supabase.from('rooms').select('id, nomType, nom_type').in('id', roomIds)
      : Promise.resolve({ data: [] }),
  ])

  if (clientsRes.error) console.error('attachRelations: failed to load clients:', clientsRes.error.message)
  if (estsRes.error) console.error('attachRelations: failed to load establishments:', estsRes.error.message)
  if (roomsRes.error) console.error('attachRelations: failed to load rooms:', roomsRes.error.message)

  const clientMap = {}
  ;(clientsRes.data || []).forEach((c) => { clientMap[c.id] = c })
  const estMap = {}
  ;(estsRes.data || []).forEach((e) => {
    estMap[e.id] = {
      ...e,
      statutValidation: e.statut_validation || e.statutValidation,
      ownerId: e.owner_id || e.ownerId
    } 
  })
  const roomMap = {}
  ;(roomsRes.data || []).forEach((r) => { 
    roomMap[r.id] = {
      ...r,
      nomType: r.nomType || r.nom_type
    }
  })

  return rows.map((r) => {
    const cId = r.clientId || r.client_id
    const eId = r.establishmentId || r.establishment_id
    const rmId = r.roomId || r.room_id
    return {
      ...r,
      clientId: cId,
      establishmentId: eId,
      roomId: rmId,
      _client: clientMap[cId] || null,
      _establishment: estMap[eId] || null,
      _room: roomMap[rmId] || null,
    }
  })
}

const statutMap = {
  pending: 'en_attente',
  accepted: 'acceptee',
  rejected: 'refusee',
  cancelled: 'annulee',
  completed: 'terminee',
}

const mapReservation = (r) => {
  if (!r) return null
  const cId = r.clientId || r.client_id
  const eId = r.establishmentId || r.establishment_id
  const rmId = r.roomId || r.room_id
  const dateDeb = r.dateDebut || r.date_debut
  const dateF = r.dateFin || r.date_fin
  const nbP = r.nbPersonnes || r.nb_personnes || 1
  const pTot = r.prixTotal || r.prix_total || 0
  const mRef = r.motifRefus || r.motif_refus
  const cAt = r.createdAt || r.created_at

  return {
    id: r.id,
    clientId: cId,
    establishmentId: eId,
    roomId: rmId,
    dateArrivee: dateDeb,
    dateDepart: dateF,
    nbPersonnes: nbP,
    prixTotal: pTot,
    statut: statutMap[r.statut] || r.statut,
    motifRefus: mRef,
    createdAt: cAt,
    etablissement: r._establishment ? {
      id: r._establishment.id,
      nom: r._establishment.nom,
      type: r._establishment.type,
      ville: r._establishment.ville,
      statutValidation: r._establishment.statutValidation,
      ownerId: r._establishment.ownerId,
    } : null,
    client: r._client ? {
      id: r._client.id,
      nom: r._client.nom,
      prenom: r._client.prenom,
      telephone: r._client.telephone,
      email: r._client.email,
    } : null,
    room: r._room ? { id: r._room.id, nomType: r._room.nomType } : null,
  }
}

export const createReservation = async (data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté. Veuillez vous re-connecter.')

    // Fetch room and join establishment using relationship
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*, establishments(id, nom, statut_validation, owner_id)')
      .eq('id', data.roomId)
      .maybeSingle()
    if (roomErr) return fail(`Erreur lors de la vérification de la chambre: ${roomErr.message}`)
    if (!room) return fail('Chambre/place introuvable.')
    if (room.actif === false) return fail('Cette chambre/place n\'est pas active.')

    const est = room.establishments
    const statutV = est?.statut_validation || est?.statutValidation
    if (est && statutV && statutV !== 'APPROVED' && statutV !== 'valide') {
      return fail('Établissement non validé.')
    }

    const nbNuits = Math.max(1, Math.ceil((new Date(data.dateFin) - new Date(data.dateDebut)) / 86400000))
    const prixTotal = nbNuits * parseFloat(room.prixNuit ?? room.prix_nuit ?? 0)

    const { data: res, error: insertErr } = await supabase
      .from('reservations')
      .insert({
        clientId: user.id,
        establishmentId: data.establishmentId,
        roomId: data.roomId,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        nbPersonnes: data.nbPersonnes || 1,
        prixTotal: prixTotal,
        statut: 'pending',
      })
      .select()
      .maybeSingle()
    
    if (insertErr) return fail(`Erreur lors de la réservation: ${insertErr.message}`)
    if (!res) return fail('La création de la réservation a échoué.')

    const ownerId = est?.owner_id || est?.ownerId
    if (ownerId) {
      try {
        await supabase.from('notifications').insert({
          userId: ownerId,
          message: `Nouvelle demande de réservation pour ${est.nom || 'votre établissement'} (${data.dateDebut} - ${data.dateFin}).`,
          type: 'reservation_pending',
        })
      } catch (e) {
        console.error('Failed to create notification:', e)
      }
    }

    const [withRelations] = await attachRelations([res])
    return ok(mapReservation(withRelations), 'Demande de réservation envoyée. En attente de confirmation.')
  } catch (err) {
    return fail(err.message)
  }
}

export const getMyReservations = async () => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté. Veuillez vous re-connecter.')

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('clientId', user.id)
      .order('createdAt', { ascending: false })
    if (error) return fail(error.message)

    const withRelations = await attachRelations(data || [])
    return ok(withRelations.map(mapReservation))
  } catch (err) {
    return fail(err.message)
  }
}

export const getOwnerReservations = async () => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté. Veuillez vous re-connecter.')

    const { data: myEsts, error: estErr } = await supabase
      .from('establishments')
      .select('id')
      .or(`owner_id.eq.${user.id},id.eq.${user.id}`)
    if (estErr) return fail(estErr.message)
    const estIds = (myEsts || []).map((e) => e.id)
    if (estIds.length === 0) return ok([])

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .in('establishmentId', estIds)
      .order('createdAt', { ascending: false })
    if (error) return fail(error.message)

    const withRelations = await attachRelations(data || [])
    return ok(withRelations.map(mapReservation))
  } catch (err) {
    return fail(err.message)
  }
}

export const getAllReservations = async () => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) return fail(error.message)

    const withRelations = await attachRelations(data || [])
    return ok(withRelations.map(mapReservation))
  } catch (err) {
    return fail(err.message)
  }
}

export const acceptReservation = async (id) => {
  try {
    const { data: res, error } = await supabase
      .from('reservations')
      .update({ statut: 'accepted' })
      .eq('id', id)
      .eq('statut', 'pending')
      .select('*')
      .maybeSingle()
    if (error) return fail(error.message)
    if (!res) return fail('Seule une réservation en attente peut être acceptée.')

    const clientId = res.clientId || res.client_id
    if (clientId) {
      try {
        await supabase.from('notifications').insert({
          userId: clientId,
          message: 'Votre réservation a été confirmée par l\'établissement.',
          type: 'reservation_accepted',
        })
      } catch (e) {
        console.error('Error adding notification:', e)
      }
    }

    const [withRelations] = await attachRelations([res])
    return ok(mapReservation(withRelations), 'Réservation acceptée.')
  } catch (err) {
    return fail(err.message)
  }
}

export const rejectReservation = async (id, data) => {
  try {
    const { data: res, error } = await supabase
      .from('reservations')
      .update({ statut: 'rejected', motifRefus: data?.motif || null })
      .eq('id', id)
      .eq('statut', 'pending')
      .select('*')
      .maybeSingle()
    if (error) return fail(error.message)
    if (!res) return fail('Seule une réservation en attente peut être refusée.')

    const clientId = res.clientId || res.client_id
    if (clientId) {
      try {
        await supabase.from('notifications').insert({
          userId: clientId,
          message: 'Votre demande de réservation a été refusée par l\'établissement.',
          type: 'reservation_rejected',
        })
      } catch (e) {
        console.error('Error adding notification:', e)
      }
    }

    const [withRelations] = await attachRelations([res])
    return ok(mapReservation(withRelations), 'Réservation refusée.')
  } catch (err) {
    return fail(err.message)
  }
}

export const cancelReservation = async (id) => {
  try {
    const { data: res, error } = await supabase
      .from('reservations')
      .update({ statut: 'cancelled' })
      .eq('id', id)
      .in('statut', ['pending', 'accepted'])
      .select()
      .maybeSingle()
    if (error) return fail(error.message)
    if (!res) return fail('Cette réservation ne peut plus être annulée.')

    const [withRelations] = await attachRelations([res])
    return ok(mapReservation(withRelations), 'Réservation annulée.')
  } catch (err) {
    return fail(err.message)
  }
}
