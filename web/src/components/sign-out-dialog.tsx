import type { ReactElement } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { supabase } from '@/lib/supabase'

export function SignOutDialog({ children }: { children: ReactElement }) {
  return (
    <ConfirmDialog
      trigger={children}
      title="Sign out?"
      description="Are you sure you want to sign out? You’ll need to sign in again to view your conversations."
      confirmLabel="Sign out"
      pendingLabel="Signing out…"
      onConfirm={async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }}
    />
  )
}
