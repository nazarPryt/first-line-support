import { Navigate, Route, Routes } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-4 text-foreground">
        <Alert className="max-w-md">
          <AlertTitle>Operator access required</AlertTitle>
          <AlertDescription>
            {email} does not have operator access. Ask an admin to add you as an operator.
          </AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </Button>
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
