import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { useClients, useMessages, useRealtimeSync } from '@/hooks/queries'
import { clientName, supabase } from '@/lib/supabase'

export default function Inbox() {
  useRealtimeSync()
  const params = useParams()
  const selectedId = params.clientId ? Number(params.clientId) : null
  const clients = useClients()

  return (
    <div className="flex h-screen text-sm">
      <aside className="flex w-80 flex-col border-r bg-gray-50">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold">Clients</span>
          <button type="button" className="text-gray-500 hover:text-gray-900" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </header>
        <ul className="flex-1 overflow-y-auto">
          {clients.isPending && <li className="p-4 text-gray-500">Loading…</li>}
          {clients.error && <li className="p-4 text-red-600">{clients.error.message}</li>}
          {clients.data?.length === 0 && <li className="p-4 text-gray-500">No clients yet.</li>}
          {clients.data?.map((c) => (
            <li key={c.id}>
              <Link
                to={`/clients/${c.id}`}
                className={`block border-b px-4 py-3 hover:bg-white ${c.id === selectedId ? 'bg-white' : ''}`}
              >
                <div className="font-medium">{clientName(c)}</div>
                <div className="text-xs text-gray-500">{new Date(c.last_message_at).toLocaleString()}</div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex flex-1 flex-col">
        {selectedId === null ? (
          <div className="m-auto text-gray-500">Select a client to see the conversation.</div>
        ) : (
          <Conversation clientId={selectedId} />
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
    <div className="flex-1 space-y-2 overflow-y-auto p-6">
      {messages.isPending && <p className="text-gray-500">Loading…</p>}
      {messages.error && <p className="text-red-600">{messages.error.message}</p>}
      {messages.data?.map((m) => (
        <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-[70%] rounded-lg px-3 py-2 ${
              m.sender === 'client' ? 'bg-gray-100' : 'bg-blue-600 text-white'
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
