import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in web/.env.local')

export const supabase = createClient<Database>(url, key)

export type Client = Database['public']['Tables']['clients']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export function clientName(c: Pick<Client, 'first_name' | 'last_name' | 'username' | 'telegram_user_id'>) {
  const full = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return full || (c.username ? `@${c.username}` : `#${c.telegram_user_id}`)
}
