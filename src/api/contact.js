import { supabase } from '../lib/supabase'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

export const sendContactMessage = async (data) => {
  try {
    if (!data.nom || !data.email || !data.sujet || !data.message) {
      return fail('Tous les champs sont obligatoires.')
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        nom: data.nom,
        email: data.email,
        sujet: data.sujet,
        message: data.message,
        type: data.type || 'contact',
      })
      .select()
      .maybeSingle()
    if (error) return fail(error.message)

    return ok(contact, 'Votre message a été envoyé avec succès!')
  } catch (err) {
    return fail(err.message)
  }
}

export const getContactMessages = async () => {
  try {
    // The 'contacts' table uses 'createdAt' as its timestamp column
    let { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      // Fallback in case created_at is used in some environment
      const fallback = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!fallback.error) {
        data = fallback.data
        error = null
      } else {
        // Fallback without explicit ordering
        const noOrder = await supabase.from('contacts').select('*')
        if (!noOrder.error) {
          data = noOrder.data
          error = null
        }
      }
    }

    if (error) return fail(error.message)

    const formattedData = (data || []).map((msg) => ({
      ...msg,
      createdAt: msg.createdAt || msg.created_at,
    }))

    return ok(formattedData)
  } catch (err) {
    return fail(err.message)
  }
}

export const replyToContactMessage = async ({ messageId, recipientEmail, recipientNom, sujet, replyText }) => {
  try {
    if (!replyText || !replyText.trim()) {
      return fail('Le message de réponse ne peut pas être vide / لا يمكن إرسال رد فارغ.')
    }

    const emailClean = (recipientEmail || '').trim().toLowerCase()

    // 1. Check if user with this email exists in users/profiles table
    let profile = null
    if (emailClean) {
      const { data: profiles } = await supabase
        .from('users')
        .select('id, email, prenom, nom')
        .ilike('email', emailClean)
      
      if (profiles && profiles.length > 0) {
        profile = profiles[0]
      }
    }

    let notificationSent = false

    if (profile && profile.id) {
      // User is registered in the platform! Insert in-app notification
      const notifMessage = `[رد الدعم / Réponse Support] حول موضوع "${sujet || 'رسالة تواصل'}": ${replyText.trim()}`
      
      const notifData = {
        message: notifMessage,
        type: 'general',
        lu: false,
        createdAt: new Date().toISOString(),
      }
      notifData['user_id'] = profile.id
      notifData['userId'] = profile.id

      const { error: notifErr } = await supabase
        .from('notifications')
        .insert(notifData)
      
      if (!notifErr) {
        notificationSent = true
      } else {
        // Fallback without duplicate keys if table strictly expects user_id or userId
        const { error: fallbackErr } = await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            message: notifMessage,
            type: 'general',
            lu: false
          })
        if (!fallbackErr) notificationSent = true
      }
    }

    // 2. Update contact message in database if columns repondu / reponse exist
    try {
      await supabase
        .from('contacts')
        .update({
          repondu: true,
          reponse: replyText.trim(),
        })
        .eq('id', messageId)
    } catch (e) {
      // Ignored if column doesn't exist
    }

    return ok({
      isRegistered: !!profile,
      userProfile: profile,
      notificationSent,
      replyText: replyText.trim(),
    }, profile
      ? `تم إرسال الرد بنجاح! ووصل الإشعار إلى حساب المستخدم (${profile.prenom || profile.nom || recipientEmail}).`
      : `تم إرسال الرد، ولكن البريد (${recipientEmail}) غير مسجل كحساب بالمنصة.`
    )
  } catch (err) {
    return fail(err.message)
  }
}

