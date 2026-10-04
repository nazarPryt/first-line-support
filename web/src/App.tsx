import { Navigate, Route, Routes } from 'react-router'
import { useIsOperator } from '@/hooks/queries'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'
import Inbox from '@/pages/Inbox'
import Login from '@/pages/Login'

export default function App() {
  const session = useSession()

  if (session === undefined) return null
  if (session === null) return <Login />
  return <Authorized userId={session.user.id} email={session.user.email} />
}

function Authorized({ userId, email }: { userId: string; email?: string }) {
  const isOperator = useIsOperator(userId)

  if (isOperator.isPending) return null
  if (!isOperator.data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-gray-700">
        <p>{email} is not an operator. Ask an admin to add you to the operators table.</p>
        <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Inbox />} />
      <Route path="/clients/:clientId" element={<Inbox />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
