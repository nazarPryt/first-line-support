import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useClients, useMessages, useRealtimeSync } from '@/hooks/queries'
import { clientName, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function Inbox() {
  useRealtimeSync()
  const params = useParams()
  const selectedId = params.clientId ? Number(params.clientId) : null
  const clients = useClients()
  const selectedClient = clients.data?.find((client) => client.id === selectedId)

  return (
    <div className="flex h-dvh bg-background text-sm">
      <aside
        className={cn(
          'w-full shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex md:w-80',
          selectedId === null ? 'flex' : 'hidden',
        )}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Clients</h1>
            {clients.data && <Badge variant="secondary">{clients.data.length}</Badge>}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </header>
        <ul className="flex-1 overflow-y-auto">
          {clients.isPending && <li className="p-4 text-muted-foreground">Loading…</li>}
          {clients.error && (
            <li className="p-4">
              <Alert variant="destructive">
                <AlertDescription>{clients.error.message}</AlertDescription>
              </Alert>
            </li>
          )}
          {clients.data?.length === 0 && <li className="p-4 text-muted-foreground">No clients yet.</li>}
          {clients.data?.map((c) => (
            <li key={c.id}>
              <Link
                to={`/clients/${c.id}`}
                aria-current={c.id === selectedId ? 'page' : undefined}
                className={cn(
                  'block border-b px-4 py-3 transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:-outline-offset-2',
                  c.id === selectedId && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                <div className="font-medium">{clientName(c)}</div>
                <div className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className={cn('min-w-0 flex-1 flex-col', selectedId === null ? 'hidden md:flex' : 'flex')}>
        {selectedId === null ? (
          <div className="m-auto text-muted-foreground">Select a client to see the conversation.</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <Button variant="ghost" size="sm" render={<Link to="/" />} className="md:hidden">
                Back
              </Button>
              <h2 className="truncate font-semibold">{selectedClient ? clientName(selectedClient) : 'Conversation'}</h2>
            </header>
            <Conversation clientId={selectedId} />
          </>
        )}
      </main>
    </div>
  )
}

function Conversation({ clientId }: { clientId: number }) {
  const messages = useMessages(clientId)
  const bottomRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the newest message whenever the list changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages.data])

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 md:p-6">
      {messages.isPending && <p className="text-muted-foreground">Loading…</p>}
      {messages.error && (
        <Alert variant="destructive">
          <AlertDescription>{messages.error.message}</AlertDescription>
        </Alert>
      )}
      {messages.data?.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
      {messages.data?.map((m) => (
        <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-[85%] break-words rounded-xl md:max-w-[70%] px-3 py-2 ${
              m.sender === 'client' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
            }`}
          >
            <p className="whitespace-pre-wrap">{m.text ?? <i className="opacity-70">(non-text message)</i>}</p>
            <p className="mt-1 text-right text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
