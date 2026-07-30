import { supabase } from '../lib/supabase'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    if (error) return fail(error.message)

    const mapped = (data || []).map((p) => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      email: p.email,
      telephone: p.telephone,
      role: p.role,
      statut: p.statut,
      createdAt: p.created_at ?? p.createdAt,
    }))

    return ok(mapped)
  } catch (err) {
    return fail(err.message)
  }
}

export const updateUserStatus = async (id, data) => {
  try {
    const statut = data.statut || data
    if (!['actif', 'bloque', 'ACTIVE', 'BLOQUE'].includes(statut)) {
      return fail('Statut invalide.')
    }

    const normalized = statut === 'ACTIVE' ? 'actif' : statut === 'BLOQUE' ? 'bloque' : statut

    const { data: user, error } = await supabase
      .from('users')
      .update({ statut: normalized })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) return fail(error.message)

    return ok({ id: user.id, statut: user.statut }, `Utilisateur ${normalized}.`)
  } catch (err) {
    return fail(err.message)
  }
}

export const getStats = async () => {
  try {
    const queries = {
      users: supabase.from('users').select('*', { count: 'exact', head: true }),
      clients: supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      owners: supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
      estsValides: supabase.from('establishments').select('*', { count: 'exact', head: true }).or('statut_validation.eq.valide,statut_validation.eq.APPROVED').eq('actif', true),
      estsPending: supabase.from('establishments').select('*', { count: 'exact', head: true }).or('statut_validation.eq.en_attente,statut_validation.eq.PENDING'),
      reservations: supabase.from('reservations').select('*', { count: 'exact', head: true }),
      resPending: supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
      resAccepted: supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('statut', 'accepted'),
      resRejected: supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('statut', 'rejected'),
    }

    const keys = Object.keys(queries)
    const results = await Promise.all(Object.values(queries))

    const counts = {}
    results.forEach((res, i) => {
      const key = keys[i]
      if (res.error) {
        console.error(`[admin.getStats] "${key}" query failed:`, res.error.message)
        counts[key] = 0
      } else {
        counts[key] = res.count || 0
      }
    })

    const totalEstsValides = counts.estsValides || 0
    const totalEstsPending = counts.estsPending || 0

    return ok({
      totalUsers: counts.users ?? 0,
      totalClients: counts.clients ?? 0,
      totalOwners: counts.owners ?? 0,
      totalEstablishments: totalEstsValides,
      pendingEstablishments: totalEstsPending,
      totalReservations: counts.reservations ?? 0,
      pendingReservations: counts.resPending ?? 0,
      acceptedReservations: counts.resAccepted ?? 0,
      rejectedReservations: counts.resRejected ?? 0,
    })
  } catch (err) {
    return fail(err.message)
  }
}

export const getDashboard = async () => {
  const stats = await getStats()
  if (!stats.success) return fail(stats.message)
  return ok(stats.data)
}

export const getPendingEstablishments = async () => {
  try {
    const { data: estData, error: estErr } = await supabase
      .from('establishments')
      .select('*')
      .or('statut_validation.eq.en_attente,statut_validation.eq.PENDING')

    if (estErr) return fail(estErr.message)

    const ownerIds = [...new Set((estData || []).map(e => e.owner_id || e.ownerId).filter(Boolean))]
    let ownerMap = {}
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from('users')
        .select('id, nom, prenom, email, telephone')
        .in('id', ownerIds)
      if (owners) {
        owners.forEach(o => { ownerMap[o.id] = o })
      }
    }

    const mapEst = (e) => {
      const ownerId = e.owner_id || e.ownerId
      return {
        id: e.id,
        ownerId: ownerId,
        nom: e.nom,
        type: e.type,
        wilaya: e.wilaya,
        ville: e.ville,
        adresse: e.adresse,
        description: e.description,
        statutValidation: e.statut_validation || e.statutValidation,
        actif: e.actif,
        owner: ownerMap[ownerId] || e.users || e.owner || null,
      }
    }

    const estMap = new Map()
    ;(estData || []).forEach(e => estMap.set(e.id, mapEst(e)))

    return ok(Array.from(estMap.values()))
  } catch (err) {
    return fail(err.message)
  }
}

export const approveEstablishment = async (establishmentId, ownerId) => {
  try {
    // 1. Update establishments table
    await supabase
      .from('establishments')
      .update({ statut_validation: 'valide', actif: true })
      .eq('id', establishmentId)
    
    // 2. Update users table
    const targetId = ownerId || establishmentId
    if (targetId) {
      await supabase
        .from('users')
        .update({ statut: 'actif' })
        .or(`id.eq.${targetId},id.eq.${establishmentId}`)

      await supabase
        .from('notifications')
        .insert({
          id: crypto.randomUUID(),
          userId: targetId,
          message: 'Votre établissement a été approuvé !',
          type: 'INFO',
          lu: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
    }

    return ok(null, 'Établissement approuvé.')
  } catch (err) {
    return fail(err.message)
  }
}

export const rejectEstablishment = async (establishmentId, ownerId) => {
  try {
    await supabase
      .from('establishments')
      .update({ statut_validation: 'refuse', actif: false })
      .eq('id', establishmentId)
    
    const targetId = ownerId || establishmentId
    if (targetId) {
      await supabase
        .from('notifications')
        .insert({
          id: crypto.randomUUID(),
          userId: targetId,
          message: 'Votre établissement a été rejeté.',
          type: 'INFO',
          lu: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
    }

    return ok(null, 'Établissement rejeté.')
  } catch (err) {
    return fail(err.message)
  }
}

export const deleteUser = async (id) => {
  try {
    await supabase
      .from('establishments')
      .delete()
      .or(`owner_id.eq.${id},id.eq.${id}`);

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (userError) return fail(userError.message);

    return ok(null, 'Utilisateur supprimé.');
  } catch (err) {
    return fail(err.message);
  }
}

