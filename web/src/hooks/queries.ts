import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useIsOperator(userId: string) {
  return useQuery({
    queryKey: ['operator', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('operators').select('user_id').eq('user_id', userId).maybeSingle()
      if (error) throw error
      return data !== null
    },
  })
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select().order('last_message_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useMessages(clientId: number) {
  return useQuery({
    queryKey: ['messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select()
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

// Refetches the affected queries whenever a client or message changes in the database.
export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.new.client_id] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
