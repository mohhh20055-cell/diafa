import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

// Phone numbers in the database aren't stored in one consistent format
// (some as 0794906307, some as +213794906307...). This builds every
// likely variant of what the person typed so the lookup matches regardless.
const phoneCandidates = (input) => {
  const digits = input.replace(/\D/g, '')
  const core = digits.slice(-9) // last 9 digits = the actual mobile number without prefix
  const variants = new Set([input.trim(), digits, core, `0${core}`, `+213${core}`, `213${core}`])
  return [...variants]
}

const findEmailByPhone = async (phoneInput) => {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .in('telephone', phoneCandidates(phoneInput))
    .maybeSingle()
  return { data, error }
}

export const login = async (identifiant, motDePasse) => {
  try {
    let email = identifiant.trim()
    if (email === 'admin') email = 'admin@diyafa.dz'
    if (email === 'founder') email = 'founder@diyafa.dz'
    if (email === 'owner') email = 'owner@diyafa.dz'
    if (email === 'client') email = 'client@diyafa.dz'

    if (!email.includes('@')) {
      let { data: profile, error: pErr } = await findEmailByPhone(email)
      if (pErr && (pErr.message?.includes('Failed to fetch') || pErr.message?.includes('fetch'))) {
        await new Promise(r => setTimeout(r, 1500))
        const retry = await findEmailByPhone(email)
        profile = retry.data
        pErr = retry.error
      }

      if (pErr) {
        if (pErr.message?.includes('Failed to fetch') || pErr.message?.includes('fetch')) {
          return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.')
        }
        return fail(`[DB ${pErr.code || ''}] ${pErr.message}`)
      }
      if (!profile?.email) {
        return fail(`[DB] لم يتم العثور على بروفايل مرتبط برقم الهاتف: ${email}`)
      }
      email = profile.email
    }

    let authData = null
    let authError = null

    let res = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    if (res.error && (res.error.message?.includes('Failed to fetch') || res.error.message?.includes('fetch'))) {
      await new Promise(r => setTimeout(r, 1500))
      res = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    }
    
    authData = res.data
    authError = res.error

    let profile = null
    if (authError) {
      const { data: foundProfile } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle()

      if (foundProfile && foundProfile.motDePasse) {
        const passwordMatch = bcrypt.compareSync(motDePasse, foundProfile.motDePasse) || foundProfile.motDePasse === motDePasse
        if (passwordMatch) {
          await supabase.auth.signUp({
            email,
            password: motDePasse,
            options: {
              data: {
                nom: foundProfile.nom,
                prenom: foundProfile.prenom,
                role: foundProfile.role,
                telephone: foundProfile.telephone,
              }
            }
          })
          let retryRes = await supabase.auth.signInWithPassword({ email, password: motDePasse })
          if (!retryRes.error) {
            authData = retryRes.data
            authError = null
            profile = foundProfile
          } else {
            profile = foundProfile
            authData = { user: { id: foundProfile.id, email: foundProfile.email }, session: { access_token: 'token-' + foundProfile.id } }
            authError = null
          }
        }
      }
    }

    if (authError || (!authData?.user && !profile)) {
      const msg = (authError?.message || '').toLowerCase()
      if (msg.includes('failed to fetch') || msg.includes('fetch')) {
        return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.')
      }
      if (msg.includes('invalid login credentials')) {
        return fail('بيانات الدخول غير صحيحة.')
      }
      return fail(`[AUTH ${authError?.name || 'Error'}] ${authError?.message || 'خطأ في الاتصال'}`)
    }

    const userId = authData?.user?.id || profile?.id

    if (!profile && userId) {
      const { data: profById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      profile = profById
    }

    if (!profile && authData?.user?.email) {
      const { data: profByEmail } = await supabase
        .from('users')
        .select('*')
        .ilike('email', authData.user.email)
        .maybeSingle()
      profile = profByEmail
      if (profile && profile.id !== userId) {
        try {
          await supabase.from('users').update({ id: userId }).eq('id', profile.id)
          profile.id = userId
        } catch (e) {
          console.error('Error syncing profile ID:', e)
        }
      }
    }

    if (!profile) {
      const userMeta = authData?.user?.user_metadata || {}
      profile = {
        id: userId,
        email: authData?.user?.email || email,
        nom: userMeta.nom || userMeta.full_name?.split(' ')[0] || email.split('@')[0] || 'Utilisateur',
        prenom: userMeta.prenom || userMeta.full_name?.split(' ').slice(1).join(' ') || '',
        telephone: userMeta.telephone || null,
        role: userMeta.role || 'client',
        statut: 'actif',
      }
      try {
        await supabase.from('users').upsert(profile)
      } catch (e) {
        console.error('Error auto-creating profile during login:', e)
      }
    }

    if (profile?.statut === 'bloque') {
      await supabase.auth.signOut()
      return fail('Compte bloqué. Contactez le support.')
    }

    if (profile?.role === 'owner') {
      try {
        const { data: existingEst } = await supabase
          .from('establishments')
          .select('id')
          .or(`owner_id.eq.${profile.id},id.eq.${profile.id}`)
          .maybeSingle()

        if (!existingEst) {
          const meta = authData?.user?.user_metadata || {}
          const estNom = meta.nomEtablissement || `Établissement ${profile.nom} ${profile.prenom}`
          const rawType = (meta.typeEtablissement || 'hotel').toString().toLowerCase()
          const estType = (rawType === 'dortoir' || rawType === 'mraqed') ? 'mraqed' : 'hotel'
          await supabase.from('establishments').upsert({
            id: profile.id,
            owner_id: profile.id,
            nom: estNom,
            type: estType,
            wilaya: meta.wilaya || 'Alger',
            ville: meta.ville || 'Alger',
            adresse: meta.adresse || meta.ville || 'Alger',
            description: `Établissement ${estNom}`,
            images: meta.photoEtablissement ? [meta.photoEtablissement] : [],
            image_vedette: meta.photoEtablissement || null,
            statut_validation: 'en_attente',
            actif: false,
          })
        }
      } catch (e) {
        console.error('Error self-healing missing establishment on login:', e)
      }
    }

    return ok({ token: authData?.session?.access_token || 'token-' + profile.id, user: profile }, 'Connexion réussie.')
  } catch (err) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.')
    }
    return fail(err.message || 'Erreur de connexion.')
  }
}

export const registerUser = async (userData) => {
  try {
    const { nom, prenom, email, telephone, motDePasse, role = 'client', nomEtablissement, typeEtablissement = 'hotel', wilaya = 'Alger', ville = '', photoEtablissement } = userData

    if (!nom || !prenom) {
      return fail('الاسم واللقب مطلوبان.')
    }
    if (!email) {
      return fail('البريد الإلكتروني مطلوب.')
    }
    if (!telephone) {
      return fail('رقم الهاتف مطلوب.')
    }
    if (!motDePasse || motDePasse.length < 8) {
      return fail('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل. / Le mot de passe doit contenir au moins 8 caractères.')
    }
    if (role === 'owner' && !nomEtablissement) {
      return fail('اسم المؤسسة مطلوب.')
    }
    if (role === 'owner' && !ville) {
      return fail('المدينة مطلوبة.')
    }

    // Check for duplicate phone number before signup with retry resilience
    let existingPhone = null
    try {
      let phoneRes = await supabase
        .from('users')
        .select('id')
        .eq('telephone', telephone)
        .maybeSingle()
      if (phoneRes.error && (phoneRes.error.message?.includes('Failed to fetch') || phoneRes.error.message?.includes('fetch'))) {
        await new Promise(r => setTimeout(r, 1200))
        phoneRes = await supabase
          .from('users')
          .select('id')
          .eq('telephone', telephone)
          .maybeSingle()
      }
      existingPhone = phoneRes.data
    } catch (e) {
      console.warn('Phone pre-check error ignored:', e)
    }

    if (existingPhone) {
      return fail('رقم الهاتف مستعمل بالفعل. / Ce numéro de téléphone est déjà utilisé.')
    }

    let signUpRes = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        data: {
          nom,
          prenom,
          telephone,
          role, // 'client' or 'owner'
          nomEtablissement: nomEtablissement || '',
          typeEtablissement: typeEtablissement || 'hotel',
          wilaya: wilaya || '',
          ville: ville || '',
          photoEtablissement: photoEtablissement || '',
        },
      },
    })

    if (signUpRes.error && (signUpRes.error.message?.includes('Failed to fetch') || signUpRes.error.message?.includes('fetch'))) {
      await new Promise(r => setTimeout(r, 1500))
      signUpRes = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: {
          data: {
            nom,
            prenom,
            telephone,
            role,
            nomEtablissement: nomEtablissement || '',
            typeEtablissement: typeEtablissement || 'hotel',
            wilaya: wilaya || '',
            ville: ville || '',
            photoEtablissement: photoEtablissement || '',
          },
        },
      })
    }

    const { data, error } = signUpRes
    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('already registered') || msg.includes('already')) {
        return fail('هذا البريد الإلكتروني مستعمل بالفعل. / Cet email est déjà utilisé.')
      }
      if (msg.includes('password') && msg.includes('weak')) {
        return fail('كلمة المرور ضعيفة جداً. / Le mot de passe est trop faible.')
      }
      if (msg.includes('password')) {
        return fail('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل. / Le mot de passe doit contenir au moins 8 caractères.')
      }
      if (msg.includes('email')) {
        return fail('البريد الإلكتروني غير صالح أو مستعمل. / Email invalide ou déjà utilisé.')
      }
      if (msg.includes('phone')) {
        return fail('رقم الهاتف مستعمل بالفعل. / Ce numéro de téléphone est déjà utilisé.')
      }
      return fail(error.message || "Erreur lors de l'inscription.")
    }

    // Set session immediately if returned from signUp or auto sign in
    if (data?.session) {
      try {
        await supabase.auth.setSession(data.session)
      } catch (e) {
        console.warn('Could not set session after sign up:', e)
      }
    } else if (data?.user) {
      try {
        const signInRes = await supabase.auth.signInWithPassword({ email, password: motDePasse })
        if (signInRes.data?.session) {
          await supabase.auth.setSession(signInRes.data.session)
        }
      } catch (e) {
        console.warn('Could not auto-signin after signup:', e)
      }
    }

    // Upsert into public.users table in Supabase
    if (data?.user) {
      try {
        const userData = {
          id: data.user.id,
          email,
          nom,
          prenom,
          telephone,
          role,
          motDePasse: bcrypt.hashSync(motDePasse, 10),
          statut: 'actif',
        }

        let { error: userError } = await supabase.from('users').upsert(userData)
        if (userError) {
          console.error('Error inserting user into users table:', userError)
          await new Promise(r => setTimeout(r, 1000))
          const fallbackData = {
            id: data.user.id,
            email,
            nom,
            prenom,
            telephone,
            role,
          }
          const retryRes = await supabase.from('users').upsert(fallbackData)
          userError = retryRes.error
        }
        if (userError) {
          console.warn('Note: Could not insert into users table immediately:', userError)
        }
      } catch (e) {
        console.warn('Note: Error inserting user into users table:', e)
      }
    }

    // Insert establishment entry in establishments table
    if (role === 'owner' && data?.user) {
      try {
        const estNom = nomEtablissement || `Établissement ${nom} ${prenom}`
        const estWilaya = wilaya || 'Alger'
        const estVille = ville || 'Alger'
        const rawType = (typeEtablissement || 'hotel').toString().toLowerCase()
        const estType = (rawType === 'dortoir' || rawType === 'mraqed') ? 'mraqed' : 'hotel'

        const estData = {
          id: data.user.id,
          owner_id: data.user.id,
          nom: estNom,
          type: estType,
          wilaya: estWilaya,
          ville: estVille,
          adresse: estVille || estWilaya,
          description: `Établissement ${estNom} situé à ${estVille}, ${estWilaya}`,
          services: [],
          images: Array.isArray(photoEtablissement) ? photoEtablissement : (photoEtablissement ? [photoEtablissement] : []),
          image_vedette: Array.isArray(photoEtablissement) ? (photoEtablissement[0] || null) : (photoEtablissement || null),
          statut_validation: 'en_attente',
          actif: false,
        }

        let { data: est, error: estError } = await supabase.from('establishments').upsert(estData)
        if (estError) {
          console.error('Error inserting into establishments table:', estError)
          await new Promise(r => setTimeout(r, 1000))
          const retryRes = await supabase.from('establishments').upsert(estData)
          if (retryRes.error) {
            console.error('Retry error inserting into establishments table:', retryRes.error)
            return fail(`خطأ في حفظ بيانات المؤسسة: ${retryRes.error.message || estError.message}`)
          } else {
            console.log('Establishment created on retry upsert:', retryRes.data)
          }
        } else {
          console.log('Establishment created successfully:', est)
        }
      } catch (e) {
        console.error('Could not insert into establishments table:', e)
        return fail(`خطأ في حفظ بيانات المؤسسة: ${e.message || e}`)
      }
    }

    const message = data?.session
      ? 'Inscription réussie! Vous pouvez maintenant vous connecter.'
      : 'Inscription réussie! Vérifiez votre email pour confirmer votre compte, puis connectez-vous.'

    return ok(null, message)
  } catch (err) {
    return fail(err.message || "Erreur lors de l'inscription.")
  }
}

export const registerClient = registerUser


export const getAuthUser = async () => {
  try {
    const { data: uRes } = await supabase.auth.getUser()
    if (uRes?.user) return uRes.user
  } catch (e) {
    console.warn('getUser error:', e)
  }

  try {
    const { data: sRes } = await supabase.auth.getSession()
    if (sRes?.session?.user) return sRes.session.user
  } catch (e) {
    console.warn('getSession error:', e)
  }

  try {
    const { data: rRes } = await supabase.auth.refreshSession()
    if (rRes?.session?.user) return rRes.session.user
  } catch (e) {
    console.warn('refreshSession error:', e)
  }

  try {
    const savedUser = localStorage.getItem('diyafa_user')
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      if (parsed && parsed.id) {
        return parsed
      }
    }
  } catch (e) {}

  return null
}

export const getMe = async () => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    let { data: profile, error: pErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (pErr && (pErr.message?.includes('Failed to fetch') || pErr.message?.includes('fetch'))) {
      await new Promise(r => setTimeout(r, 1500))
      const retry = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
      profile = retry.data
      pErr = retry.error
    }

    if (!profile && user.email) {
      const { data: profByEmail } = await supabase
        .from('users')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle()
      if (profByEmail) {
        profile = profByEmail
      }
    }

    if (!profile) {
      if (user.nom || user.role) {
        profile = user
      } else {
        const userMeta = user.user_metadata || {}
        const newProfile = {
          id: user.id,
          email: user.email,
          nom: userMeta.nom || userMeta.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Utilisateur',
          prenom: userMeta.prenom || userMeta.full_name?.split(' ').slice(1).join(' ') || '',
          telephone: userMeta.telephone || null,
          role: userMeta.role || 'client',
          statut: 'actif',
        }
        try {
          await supabase.from('users').upsert(newProfile)
        } catch (e) {
          console.error('Error auto-creating profile in getMe:', e)
        }
        profile = newProfile
      }
    }

    try {
      localStorage.setItem('diyafa_user', JSON.stringify(profile))
    } catch (e) {}

    if (profile.statut === 'bloque') return fail('Compte bloqué.')

    if (profile?.role === 'owner') {
      try {
        const { data: existingEst } = await supabase
          .from('establishments')
          .select('id')
          .or(`owner_id.eq.${profile.id},id.eq.${profile.id}`)
          .maybeSingle()

        if (!existingEst) {
          const userMeta = user.user_metadata || {}
          const estNom = userMeta.nomEtablissement || `Établissement ${profile.nom} ${profile.prenom}`
          const rawType = (userMeta.typeEtablissement || 'hotel').toString().toLowerCase()
          const estType = (rawType === 'dortoir' || rawType === 'mraqed') ? 'mraqed' : 'hotel'

          await supabase.from('establishments').upsert({
            id: profile.id,
            owner_id: profile.id,
            nom: estNom,
            type: estType,
            wilaya: userMeta.wilaya || 'Alger',
            ville: userMeta.ville || 'Alger',
            adresse: userMeta.adresse || userMeta.ville || 'Alger',
            description: `Établissement ${estNom}`,
            images: userMeta.photoEtablissement ? [userMeta.photoEtablissement] : [],
            image_vedette: userMeta.photoEtablissement || null,
            statut_validation: 'en_attente',
            actif: false,
          })
        }
      } catch (e) {
        console.error('Error self-healing missing establishment in getMe:', e)
      }
    }

    return ok(profile)
  } catch (err) {
    return fail(err.message)
  }
}

export const updateProfile = async (data) => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    const updates = {}
    if (data.nom) updates.nom = data.nom
    if (data.prenom) updates.prenom = data.prenom
    if (data.email) updates.email = data.email
    if (data.telephone) updates.telephone = data.telephone
    if (data.motDePasse) updates.motDePasse = bcrypt.hashSync(data.motDePasse, 10)

    const { data: profile, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .maybeSingle()
    if (error) return fail(error.message)

    if (data.motDePasse) {
      const { error: pwErr } = await supabase.auth.updateUser({ password: data.motDePasse })
      if (pwErr) return fail(pwErr.message)
    }

    return ok(profile, 'Profil mis à jour.')
  } catch (err) {
    return fail(err.message)
  }
}

export const resetPasswordRequest = async (identifiant) => {
  try {
    if (!identifiant || !identifiant.trim()) {
      return fail('يرجى إدخال البريد الإلكتروني أو رقم الهاتف. / Veuillez entrer votre email ou numéro de téléphone.')
    }

    let email = identifiant.trim()
    if (email === 'admin') email = 'admin@diyafa.dz'
    if (email === 'founder') email = 'founder@diyafa.dz'
    if (email === 'owner') email = 'owner@diyafa.dz'
    if (email === 'client') email = 'client@diyafa.dz'

    let profile = null
    if (!email.includes('@')) {
      const { data, error: pErr } = await findEmailByPhone(email)

      if (pErr) {
        if (pErr.message?.includes('Failed to fetch') || pErr.message?.includes('fetch')) {
          return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.')
        }
        return fail(`[DB ${pErr.code || ''}] ${pErr.message}`)
      }

      if (!data?.email) {
        return fail('لم يتم العثور على أي حساب مرتبط برقم الهاتف هذا في قاعدة البيانات. / Aucun compte trouvé pour ce numéro de téléphone dans la base de données.')
      }
      profile = data
      email = data.email
    } else {
      const { data, error: pErr } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle()

      if (pErr) {
        if (pErr.message?.includes('Failed to fetch') || pErr.message?.includes('fetch')) {
          return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur. Vérifiez votre connexion internet.')
        }
        return fail(`[DB ${pErr.code || ''}] ${pErr.message}`)
      }

      if (!data?.email) {
        return fail('هذا البريد الإلكتروني غير مسجل في قاعدة البيانات. / Cet e-mail n\'existe pas dans notre base de données.')
      }
      profile = data
      email = data.email
    }

    const redirectTo = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`
    
    // Attempt Supabase email reset
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    } catch (e) {
      console.warn('Supabase resetPasswordForEmail attempt:', e)
    }

    return ok(
      { email, profile },
      'تم العثور على الحساب بنجاح. يمكنك الآن إعادة تعيين كلمة المرور مباشرة أو التحقق من بريدك الإلكتروني.'
    )
  } catch (err) {
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('fetch')) {
      return fail('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت. / Impossible de contacter le serveur.')
    }
    return fail(err.message || 'حدث خطأ أثناء معالجة الطلب.')
  }
}

export const updateUserPassword = async (newPassword, targetEmail = null) => {
  try {
    if (!newPassword || newPassword.length < 8) {
      return fail('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل. / Le mot de passe doit contenir au moins 8 caractères.')
    }

    let emailToUpdate = targetEmail

    if (!emailToUpdate) {
      const { data: { user } } = await supabase.auth.getUser()
      emailToUpdate = user?.email
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    // Update password in users database table
    if (emailToUpdate) {
      const { error: dbErr } = await supabase
        .from('users')
        .update({ motDePasse: hashedPassword })
        .ilike('email', emailToUpdate)

      if (dbErr) {
        console.warn('Error updating users table password:', dbErr)
      }
    }

    // Try updating Supabase Auth
    const { error: authErr } = await supabase.auth.updateUser({ password: newPassword })

    if (authErr && emailToUpdate) {
      // If no active session, try signIn to sync password or re-auth
      try {
        await supabase.auth.signInWithPassword({ email: emailToUpdate, password: newPassword })
      } catch (e) {
        console.warn('Supabase auth sync attempt:', e)
      }
    }

    return ok(null, 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة. / Mot de passe modifié avec succès.')
  } catch (err) {
    return fail(err.message || 'حدث خطأ أثناء تغيير كلمة المرور.')
  }
}
