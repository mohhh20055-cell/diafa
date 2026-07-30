import { supabase } from '../lib/supabase'
import { getAuthUser } from './auth'

const ok = (data, message) => ({ success: true, data, message })
const fail = (message) => ({ success: false, message })

export const getMyNotifications = async () => {
  try {
    const user = await getAuthUser()
    if (!user) return fail('Non connecté.')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false })
      .limit(50)
    if (error) return fail(error.message)

    const mapped = (data || []).map((n) => ({
      id: n.id,
      userId: n.userId,
      message: n.message,
      type: n.type,
      lu: n.lu,
      createdAt: n.createdAt,
    }))

    return ok(mapped)
  } catch (err) {
    return fail(err.message)
  }
}

export const markNotificationAsRead = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ lu: true })
      .eq('id', id)
    if (error) return fail(error.message)

    return ok(null, 'Notification marquée comme lue.')
  } catch (err) {
    return fail(err.message)
  }
}
