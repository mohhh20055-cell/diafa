import { supabase } from '../lib/supabase'
import { getAuthUser } from './auth'
import bcrypt from 'bcryptjs'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

// Helper to safely parse services into an array of strings regardless of DB format (jsonb, text array, comma-separated string, or JSON string)
export const parseServices = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean)
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean)
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

// Map DB row from establishments table to frontend shape
const mapEstablishment = (e) => {
  if (!e) return null
  const imgVedette = (e.imageVedette ?? e.image_vedette ?? (Array.isArray(e.images) ? e.images[0] : null)) || null
  const ownerIdVal = e.ownerId ?? e.owner_id ?? null
  const statutVal = e.statutValidation ?? e.statut_validation ?? 'valide'
  const createdVal = e.createdAt ?? e.created_at ?? new Date().toISOString()

  return {
    id: e.id,
    owner_id: ownerIdVal,
    ownerId: ownerIdVal,
    nom: e.nom,
    type: e.type,
    wilaya: e.wilaya,
    ville: e.ville,
    adresse: e.adresse,
    latitude: e.latitude,
    longitude: e.longitude,
    description: e.description,
    services: parseServices(e.services),
    images: Array.isArray(e.images) ? e.images : (e.images ? [e.images] : []),
    image_vedette: imgVedette,
    imageVedette: imgVedette,
    statut_validation: statutVal,
    statutValidation: statutVal,
    actif: e.actif !== false,
    created_at: createdVal,
    createdAt: createdVal,
    rooms: (e.rooms || []).map(mapRoom).filter(Boolean),
    owner: e.owner ? mapProfile(e.owner) : null,
  }
}

// Map user row (merged owner/establishment) to frontend establishment shape
const mapUserToEstablishment = (u) => {
  if (!u) return null
  const estNom = u.nomEtablissement || u.nom_etablissement || `Établissement ${u.nom || ''} ${u.prenom || ''}`.trim()
  const imgVedette = u.imageVedette || u.image_vedette || (Array.isArray(u.images) ? u.images[0] : null) || null
  const statutVal = u.statutValidation || u.statut_validation || 'en_attente'
  const createdVal = u.createdAt || u.created_at || new Date().toISOString()

  return {
    id: u.id,
    owner_id: u.id,
    ownerId: u.id,
    nom: estNom,
    type: u.typeEtablissement || u.type_etablissement || 'hotel',
    wilaya: u.wilaya || '',
    ville: u.ville || '',
    adresse: u.adresse || u.ville || '',
    latitude: u.latitude || null,
    longitude: u.longitude || null,
    description: u.description || `Établissement ${estNom}`,
    services: parseServices(u.services),
    images: Array.isArray(u.images) ? u.images : (u.images ? [u.images] : []),
    image_vedette: imgVedette,
    imageVedette: imgVedette,
    statut_validation: statutVal,
    statutValidation: statutVal,
    actif: u.actif !== undefined ? u.actif : false,
    created_at: createdVal,
    createdAt: createdVal,
    rooms: (u.rooms || []).map(mapRoom).filter(Boolean),
    owner: mapProfile(u),
  }
}

const mapRoom = (r) => {
  if (!r) return null
  const rawPrix = r.prixNuit ?? r.prix_nuit ?? r.prix
  const parsedPrix = parseFloat(rawPrix)
  const safePrix = !isNaN(parsedPrix) && isFinite(parsedPrix) ? parsedPrix : 0

  const nom = r.nomType ?? r.nom_type ?? 'Chambre Standard'
  const estId = r.establishment_id ?? r.etablissement_id ?? r.establishmentId
  const cap = Number(r.capacite) || 1
  const disp = Number(r.nbDisponible ?? r.nb_disponible) || 0

  return {
    id: r.id,
    establishment_id: estId,
    etablissement_id: estId,
    establishmentId: estId,
    nom_type: nom,
    nomType: nom,
    prix_nuit: safePrix,
    prixNuit: safePrix,
    capacite: cap,
    nb_disponible: disp,
    nbDisponible: disp,
    images: Array.isArray(r.images) ? r.images : (r.images ? [r.images] : []),
    description: r.description || '',
    services: parseServices(r.services),
    actif: r.actif !== false,
    created_at: r.createdAt ?? r.created_at,
    createdAt: r.createdAt ?? r.created_at,
  }
}

const mapProfile = (p) => {
  if (!p) return null
  return {
    id: p.id,
    nom: p.nom,
    prenom: p.prenom,
    email: p.email,
    telephone: p.telephone,
    role: p.role,
    statut: p.statut,
  }
}

const attachOwners = async (establishments) => {
  const ownerIds = [...new Set((establishments || []).map((e) => e.ownerId || e.owner_id).filter(Boolean))]
  if (ownerIds.length === 0) return establishments || []

  const { data: owners, error } = await supabase
    .from('users')
    .select('id,nom,prenom,email,telephone')
    .in('id', ownerIds)
  if (error) {
    console.error('attachOwners: failed to load owner profiles:', error.message)
    return establishments
  }

  const ownerMap = {}
  ;(owners || []).forEach((o) => { ownerMap[o.id] = o })
  return (establishments || []).map((e) => ({ ...e, owner: ownerMap[e.ownerId || e.owner_id] || null }))
}

export const getEstablishments = async (params = {}) => {
  try {
    // 1. Fetch from establishments table with fallback retry
    let estQuery = supabase.from('establishments').select('*, rooms(*)')
    if (params.ville) estQuery = estQuery.ilike('ville', `%${params.ville}%`)
    if (params.wilaya) estQuery = estQuery.ilike('wilaya', `%${params.wilaya}%`)
    if (params.type) estQuery = estQuery.eq('type', params.type)
    if (params.ownerId) estQuery = estQuery.or(`owner_id.eq.${params.ownerId},id.eq.${params.ownerId}`)

    let { data: estData, error: estErr } = await estQuery

    if (estErr) {
      console.warn('getEstablishments: query with rooms failed, retrying without rooms join:', estErr.message)
      let fallbackQuery = supabase.from('establishments').select('*')
      if (params.ville) fallbackQuery = fallbackQuery.ilike('ville', `%${params.ville}%`)
      if (params.wilaya) fallbackQuery = fallbackQuery.ilike('wilaya', `%${params.wilaya}%`)
      if (params.type) fallbackQuery = fallbackQuery.eq('type', params.type)
      if (params.ownerId) fallbackQuery = fallbackQuery.or(`owner_id.eq.${params.ownerId},id.eq.${params.ownerId}`)

      const retryRes = await fallbackQuery
      if (retryRes.data) {
        estData = retryRes.data
      }
    }

    const mappedEsts = await attachOwners(estData || [])
    const mappedEstList = mappedEsts.map(mapEstablishment).filter(Boolean)

    let allEsts = mappedEstList

    // If ownerId provided and no records found in establishments table, check users table for owner profile
    if (params.ownerId && allEsts.length === 0) {
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', params.ownerId)
          .maybeSingle()

        if (userProfile && userProfile.role === 'owner') {
          const fallbackEst = mapUserToEstablishment(userProfile)
          if (fallbackEst) {
            allEsts = [fallbackEst]
          }
        }
      } catch (e) {
        console.warn('getEstablishments: fallback user check failed:', e)
      }
    }

    // Apply filters
    if (params.type) {
      allEsts = allEsts.filter(e => e.type === params.type)
    }
    if (!params.ownerId && !params.includeUnvalidated) {
      allEsts = allEsts.filter(e => (e.statut_validation === 'valide' || e.statut_validation === 'APPROVED') && e.actif)
    }

    // Only show establishments that have at least one room if filtering for guest browse
    if (!params.ownerId && !params.includeUnvalidated) {
      allEsts = allEsts.filter((e) => (e.rooms || []).length > 0)
    }

    return ok(allEsts)
  } catch (err) {
    return fail(err.message)
  }
}

export const listEstablishments = async (params = {}) => {
  const res = await getEstablishments(params)
  if (!res.success) return []
  return res.data || []
}

export const toAssetUrl = (path) => {
  if (!path) return 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'
  if (/^https?:\/\//i.test(path)) return path
  return path
}

export const getEstablishment = async (id) => {
  try {
    // 1. Try establishments table
    const { data: estData } = await supabase
      .from('establishments')
      .select('*, rooms(*)')
      .eq('id', id)
      .maybeSingle()

    if (estData) {
      const withOwners = await attachOwners([estData])
      return ok(mapEstablishment(withOwners[0]))
    }

    return fail('Établissement introuvable.')
  } catch (err) {
    return fail(err.message)
  }
}

export const createEstablishment = async (data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    const parsedSrvs = parseServices(data.services)

    // Insert into establishments table
    const { data: est } = await supabase
      .from('establishments')
      .insert({
        id: user.id, // Ensure backwards compatibility by using user.id
        owner_id: user.id,
        nom: data.nom,
        type: data.type || 'hotel',
        wilaya: data.wilaya,
        ville: data.ville,
        adresse: data.adresse || data.ville,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        services: parsedSrvs,
        images: data.images || [],
        statut_validation: 'en_attente',
        actif: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    // Also sync to users table
    await supabase.from('users').update({
      nomEtablissement: data.nom,
      typeEtablissement: data.type,
      wilaya: data.wilaya,
      ville: data.ville,
      adresse: data.adresse,
      description: data.description,
      services: parsedSrvs,
      images: data.images || [],
    }).eq('id', user.id)

    const result = est ? mapEstablishment(est) : mapUserToEstablishment({ id: user.id, ...data, services: parsedSrvs })
    return ok(result, 'Établissement créé. En attente de validation.')
  } catch (err) {
    return fail(err.message)
  }
}

export const updateEstablishment = async (id, data) => {
  try {
    const updates = {}
    const fields = ['nom', 'type', 'wilaya', 'ville', 'adresse', 'latitude', 'longitude', 'description']
    fields.forEach((f) => { if (data[f] !== undefined) updates[f] = data[f] })
    if (data.images !== undefined) updates.images = data.images
    if (data.services !== undefined) updates.services = parseServices(data.services)
    if (data.image_vedette !== undefined) updates.image_vedette = data.image_vedette
    if (data.imageVedette !== undefined) updates.image_vedette = data.imageVedette

    // Update establishments table
    const { data: est, error } = await supabase
      .from('establishments')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    // Also update users table if this is a partner profile
    const userUpdates = {}
    if (data.nom !== undefined) userUpdates.nomEtablissement = data.nom
    if (data.type !== undefined) userUpdates.typeEtablissement = data.type
    if (data.wilaya !== undefined) userUpdates.wilaya = data.wilaya
    if (data.ville !== undefined) userUpdates.ville = data.ville
    if (data.adresse !== undefined) userUpdates.adresse = data.adresse
    if (data.description !== undefined) userUpdates.description = data.description
    if (data.services !== undefined) userUpdates.services = parseServices(data.services)
    if (data.images !== undefined) userUpdates.images = data.images
    if (data.image_vedette !== undefined || data.imageVedette !== undefined) {
      userUpdates.imageVedette = data.image_vedette || data.imageVedette
    }

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', id)
    }

    if (error && !est) {
      console.warn('Note on updating establishment row:', error)
    }

    const res = await getEstablishment(id)
    return ok(res.data || est, 'Établissement mis à jour avec succès.')
  } catch (err) {
    return fail(err.message || 'Erreur lors de la mise à jour.')
  }
}

export const setFeaturedImage = async (id, imageUrl) => {
  try {
    await supabase.from('establishments').update({ image_vedette: imageUrl }).eq('id', id)

    const res = await getEstablishment(id)
    return ok(res.data, 'Image mise en avant mise à jour.')
  } catch (err) {
    return fail(err.message)
  }
}

export const deleteEstablishment = async (id) => {
  try {
    await supabase.from('establishments').delete().eq('id', id)
    await supabase.from('users').update({ nomEtablissement: null, actif: false }).eq('id', id)

    return ok(null, 'Établissement supprimé.')
  } catch (err) {
    return fail(err.message)
  }
}

export const getPendingEstablishments = async () => {
  try {
    // Fetch from establishments
    const { data: estData } = await supabase
      .from('establishments')
      .select('*')
      .or('statut_validation.eq.en_attente,statut_validation.eq.PENDING')
    
    const withOwners = await attachOwners(estData || [])
    const mappedEsts = withOwners.map(mapEstablishment)

    return ok(mappedEsts)
  } catch (err) {
    return fail(err.message)
  }
}

export const validateEstablishment = async (id, data) => {
  try {
    const decision = data.statutValidation || data.decision || 'valide'
    const isApprove = decision === 'valide' || decision === 'APPROVED'
    const finalDecision = isApprove ? 'valide' : 'refuse'

    // Update establishments table
    await supabase
      .from('establishments')
      .update({ statut_validation: finalDecision, actif: isApprove })
      .eq('id', id)

    // Update users table (just user status)
    const targetId = data.ownerId || id
    await supabase
      .from('users')
      .update({ statut: isApprove ? 'actif' : 'bloque' })
      .or(`id.eq.${targetId},id.eq.${id}`)
      
    // Create notification for the user
    await supabase
      .from('notifications')
      .insert({
        message: isApprove 
          ? 'تم قبول مؤسستك بنجاح! يمكنك الآن إضافة غرف. / Votre établissement a été validé !' 
          : 'نأسف، تم رفض طلب مؤسستك. / Votre demande d\'établissement a été refusée.',
        type: 'validation',
        lu: false,
        user_id: targetId,
        userId: targetId,
        created_at: new Date().toISOString()
      })

    const res = await getEstablishment(id)
    return ok(res.data, `Établissement ${finalDecision}.`)
  } catch (err) {
    return fail(err.message)
  }
}

export const approveEstablishment = async (id, ownerId) => {
  return validateEstablishment(id, { statut_validation: 'valide', ownerId })
}

export const rejectEstablishment = async (id, ownerId) => {
  return validateEstablishment(id, { statut_validation: 'refuse', ownerId })
}

// Creates a brand new owner account directly in the users table (no Supabase Auth
// signUp), so the admin's own session is never affected. The account can log in
// right away thanks to the DB-fallback login already implemented in auth.js.
const createOwnerAccount = async (newOwner) => {
  const nom = (newOwner.nom || '').trim()
  const prenom = (newOwner.prenom || '').trim()
  const email = (newOwner.email || '').trim()
  const telephone = (newOwner.telephone || '').trim()
  const motDePasse = newOwner.motDePasse || ''

  if (!nom || !prenom) return { error: 'الاسم واللقب مطلوبان.' }
  if (!email) return { error: 'البريد الإلكتروني مطلوب.' }
  if (!telephone) return { error: 'رقم الهاتف مطلوب.' }
  if (!motDePasse || motDePasse.length < 8) {
    return { error: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل. / Le mot de passe doit contenir au moins 8 caractères.' }
  }

  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existingEmail) return { error: 'هذا البريد الإلكتروني مستعمل بالفعل. / Cet email est déjà utilisé.' }

  const { data: existingPhone } = await supabase
    .from('users')
    .select('id')
    .eq('telephone', telephone)
    .maybeSingle()
  if (existingPhone) return { error: 'رقم الهاتف مستعمل بالفعل. / Ce numéro de téléphone est déjà utilisé.' }

  const newId = crypto.randomUUID()
  const { error: userError } = await supabase.from('users').insert({
    id: newId,
    nom,
    prenom,
    email,
    telephone,
    motDePasse: bcrypt.hashSync(motDePasse, 10),
    role: 'owner',
    statut: 'actif',
    createdAt: new Date().toISOString(),
  })
  if (userError) return { error: userError.message }

  return { id: newId }
}

export const adminCreateEstablishment = async (data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    let ownerId = data.ownerId

    // Admin is creating a brand new owner account (partner gave their info to the admin)
    if (!ownerId && data.newOwner) {
      const created = await createOwnerAccount(data.newOwner)
      if (created.error) return fail(created.error)
      ownerId = created.id
    }

    if (!ownerId) ownerId = user.id

    const parsedSrvs = parseServices(data.services)

    // Update users table
    await supabase.from('users').update({
      statut: 'actif',
      nomEtablissement: data.nom,
      typeEtablissement: data.type,
      wilaya: data.wilaya,
      ville: data.ville,
      adresse: data.adresse,
      description: data.description,
      services: parsedSrvs,
      images: data.images || [],
    }).eq('id', ownerId)

    // Insert into establishments table
    const { data: est } = await supabase
      .from('establishments')
      .insert({
        id: crypto.randomUUID(),
        owner_id: ownerId,
        nom: data.nom,
        type: data.type || 'hotel',
        wilaya: data.wilaya || 'Alger',
        ville: data.ville || 'Alger',
        adresse: data.adresse || data.ville || 'Alger',
        description: data.description || '',
        services: parsedSrvs,
        images: data.images || [],
        image_vedette: data.imageVedette || (data.images || [])[0] || null,
        statut_validation: 'valide',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    const res = await getEstablishment(ownerId)
    return ok(res.data || (est ? mapEstablishment(est) : null), 'Établissement créé et validé avec succès.')
  } catch (err) {
    return fail(err.message)
  }
}

export const createRoom = async (establishment_id, data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté. Veuillez vous re-connecter.')

    const targetEstId = establishment_id || user.id

    // Ensure establishment exists in establishments table before creating room
    try {
      const { data: estExists } = await supabase
        .from('establishments')
        .select('id, statut_validation, actif')
        .eq('id', targetEstId)
        .maybeSingle()

      if (!estExists) {
        const { data: userProf } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        const estNom = userProf?.nomEtablissement || userProf?.nometablissement || `Établissement ${userProf?.nom || ''}`.trim() || 'Mon Établissement'
        const rawType = (userProf?.typeEtablissement || 'hotel').toString().toLowerCase()
        const estType = (rawType === 'dortoir' || rawType === 'mraqed') ? 'mraqed' : 'hotel'

        await supabase.from('establishments').upsert({
          id: targetEstId,
          owner_id: user.id,
          nom: estNom,
          type: estType,
          wilaya: userProf?.wilaya || 'Alger',
          ville: userProf?.ville || 'Alger',
          adresse: userProf?.adresse || userProf?.ville || 'Alger',
          description: userProf?.description || '',
          images: [],
          statut_validation: 'valide',
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else if (estExists.statut_validation !== 'valide' || !estExists.actif) {
        await supabase
          .from('establishments')
          .update({ statut_validation: 'valide', actif: true })
          .eq('id', targetEstId)
      }
    } catch (estErr) {
      console.warn('Error verifying establishment before room creation:', estErr)
    }

    const roomId = crypto.randomUUID()
    const nomVal = data.nomType || 'Chambre Standard'
    const prixVal = Number(data.prixNuit) || 5000
    const capVal = Number(data.capacite) || 1
    const dispVal = Number(data.nbDisponible) || 1
    const imgVal = data.images || []
    const descVal = data.description || ''
    const servicesVal = data.services || []

    const payload = {
      id: roomId,
      establishment_id: targetEstId,
      establishmentId: targetEstId,
      nom_type: nomVal,
      prix_nuit: prixVal,
      prixNuit: prixVal,
      nb_disponible: dispVal,
      nbDisponible: dispVal,
      capacite: capVal,
      images: imgVal,
      description: descVal,
      services: servicesVal,
      actif: true,
    }

    const { data: roomData, error: lastError } = await supabase
      .from('rooms')
      .insert(payload)
      .select()
      .maybeSingle()

    if (lastError && !roomData) {
      console.error('Error creating room:', lastError)
      return fail(`Erreur lors de la création de la chambre: ${lastError.message}`)
    }

    return ok(mapRoom(roomData || {
      id: roomId,
      establishment_id: targetEstId,
      nom_type: nomVal,
      prix_nuit: prixVal,
      capacite: capVal,
      nb_disponible: dispVal,
      images: imgVal,
      actif: true,
    }), 'Chambre créée avec succès.')
  } catch (err) {
    return fail(err.message)
  }
}

export const getRooms = async (establishment_id) => {
  try {
    if (!establishment_id) return ok([])
    let { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('establishment_id', establishment_id)
    if (error || !data || data.length === 0) {
      const { data: data2, error: error2 } = await supabase
        .from('rooms')
        .select('*')
        .eq('etablissement_id', establishment_id)
      if (!error2 && data2 && data2.length > 0) {
        data = data2
        error = null
      }
    }
    if (error) return ok([])
    return ok((data || []).map(mapRoom))
  } catch (err) {
    return ok([])
  }
}

export const deleteRoom = async (roomId) => {
  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
    if (error) return fail(error.message)
    return ok(null, 'Chambre supprimée.')
  } catch (err) {
    return fail(err.message)
  }
}

export const updateRoom = async (roomId, data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    const nomVal = data.nomType
    const prixVal = data.prixNuit !== undefined ? Number(data.prixNuit) : undefined
    const capVal = data.capacite !== undefined ? Number(data.capacite) : undefined
    const dispVal = data.nbDisponible !== undefined ? Number(data.nbDisponible) : undefined
    const imgVal = data.images
    const descVal = data.description
    const servicesVal = data.services

    const payloadPrimary = {}
    if (nomVal !== undefined) payloadPrimary.nom_type = nomVal
    if (prixVal !== undefined) payloadPrimary.prix_nuit = prixVal
    // Note: capacite is intentionally omitted from primary if we suspect it doesn't exist
    if (dispVal !== undefined) payloadPrimary.nb_disponible = dispVal
    if (imgVal !== undefined) payloadPrimary.images = imgVal
    if (descVal !== undefined) payloadPrimary.description = descVal
    if (servicesVal !== undefined) payloadPrimary.services = servicesVal

    let { data: resData, error: resErr } = await supabase
      .from('rooms')
      .update(payloadPrimary)
      .eq('id', roomId)
      .select()
      .maybeSingle()

    if (resErr) {
      console.warn('Primary update failed, trying fallback:', resErr)
      const payloadFallback = {}
      if (nomVal !== undefined) payloadFallback.nom_type = nomVal
      if (prixVal !== undefined) payloadFallback.prix_nuit = prixVal
      if (capVal !== undefined) payloadFallback.capacite = capVal
      if (dispVal !== undefined) payloadFallback.nb_disponible = dispVal
      if (imgVal !== undefined) payloadFallback.images = imgVal
      if (descVal !== undefined) payloadFallback.description = descVal
      if (servicesVal !== undefined) payloadFallback.services = servicesVal

      const { data: fbData, error: fbErr } = await supabase
        .from('rooms')
        .update(payloadFallback)
        .eq('id', roomId)
        .select()
        .maybeSingle()

      if (fbErr) {
        console.error('Error updating room:', fbErr)
        return fail(fbErr.message || 'Erreur lors de la mise à jour de la chambre.')
      }
      resData = fbData
    }

    return ok(mapRoom(resData), 'Chambre mise à jour avec succès.')
  } catch (err) {
    return fail(err.message)
  }
}

export const getAllEstablishments = async () => {
  try {
    const { data: estData } = await supabase.from('establishments').select('*')
    const withOwners = await attachOwners(estData || [])
    const mappedEsts = withOwners.map(mapEstablishment)

    return ok(mappedEsts)
  } catch (err) {
    return fail(err.message)
  }
}
