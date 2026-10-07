import { ArrowDown, ArrowLeft, Bot, LogOut, MessageSquare, Search, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients, useMessages, useRealtimeSync } from '@/hooks/queries'
import { type Client, clientName } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  today.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Yesterday'
  return dayFormat.format(date)
}

function ClientAvatar({ client }: { client?: Client }) {
  const initials = client
    ? clientName(client)
        .replace(/^[@#]/, '')
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : '?'
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary"
    >
      {initials}
    </span>
  )
}

export default function Inbox() {
  useRealtimeSync()
  const params = useParams()
  const selectedId = params.clientId ? Number(params.clientId) : null
  const clients = useClients()
  const [search, setSearch] = useState('')
  const selectedClient = clients.data?.find((client) => client.id === selectedId)
  const query = search.trim().toLocaleLowerCase()
  const filteredClients = clients.data?.filter((client) =>
    `${clientName(client)} ${client.username ?? ''} ${client.telegram_user_id}`.toLocaleLowerCase().includes(query),
  )

  return (
    <div className="flex h-dvh bg-background text-sm">
      <aside
        className={cn(
          'w-full shrink-0 flex-col border-r bg-card md:flex md:w-80 lg:w-96',
          selectedId === null ? 'flex' : 'hidden',
        )}
        aria-label="Client conversations"
      >
        <header className="space-y-5 px-5 pb-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-5 text-primary" aria-hidden="true" />
              <h1 className="text-xl font-semibold">Inbox</h1>
              {clients.data && <Badge variant="secondary">{clients.data.length}</Badge>}
            </div>
            <SignOutDialog>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Sign out" title="Sign out">
                <LogOut />
              </Button>
            </SignOutDialog>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Search clients"
              placeholder="Search name or username"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
                onClick={() => setSearch('')}
              >
                <X />
              </Button>
            )}
          </div>
        </header>
        <div className="flex items-center justify-between border-b px-5 pb-3 text-xs text-muted-foreground">
          <span>{query ? `${filteredClients?.length ?? 0} matching clients` : 'Client conversations'}</span>
          <span>Latest first</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {clients.isPending && (
            <li className="p-4 text-muted-foreground" role="status">
              Loading clients…
            </li>
          )}
          {clients.error && (
            <li className="p-3">
              <Alert variant="destructive">
                <AlertDescription>{clients.error.message}</AlertDescription>
              </Alert>
            </li>
          )}
          {clients.data?.length === 0 && (
            <li className="space-y-1 p-4">
              <p className="font-medium">No conversations yet</p>
              <p className="text-muted-foreground">Clients will appear here when they message your Telegram bot.</p>
            </li>
          )}
          {query && clients.data && clients.data.length > 0 && filteredClients?.length === 0 && (
            <li className="space-y-1 p-4">
              <p className="font-medium">No clients found</p>
              <p className="text-muted-foreground">Try another name or username.</p>
            </li>
          )}
          {filteredClients?.map((client) => (
            <li key={client.id}>
              <Link
                to={`/clients/${client.id}`}
                aria-current={client.id === selectedId ? 'page' : undefined}
                className={cn(
                  'my-1 flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 focus-visible:outline-2 focus-visible:outline-ring hover:bg-muted',
                  client.id === selectedId && 'border-primary/25 bg-primary/10 hover:bg-primary/10',
                )}
              >
                <ClientAvatar client={client} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold">{clientName(client)}</p>
                    <time
                      dateTime={client.last_message_at}
                      title={new Date(client.last_message_at).toLocaleString()}
                      className="shrink-0 text-[11px] text-muted-foreground"
                    >
                      {dayLabel(client.last_message_at) === 'Today'
                        ? timeFormat.format(new Date(client.last_message_at))
                        : dayLabel(client.last_message_at)}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {client.username ? `@${client.username}` : `Telegram ID ${client.telegram_user_id}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main
        className={cn('min-w-0 flex-1 flex-col', selectedId === null ? 'hidden md:flex' : 'flex')}
        aria-label="Conversation"
      >
        {selectedId === null ? (
          <div className="m-auto max-w-sm px-6 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MessageSquare className="size-7" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold">Your conversations, in one place</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Choose a client to read their messages and your bot’s replies.
            </p>
          </div>
        ) : (
          <>
            <header className="flex min-h-20 items-center gap-3 border-b bg-card px-4 py-4 md:px-6">
              <Button
                variant="ghost"
                size="icon-sm"
                render={<Link to="/" />}
                className="md:hidden"
                aria-label="Back to clients"
              >
                <ArrowLeft />
              </Button>
              <ClientAvatar client={selectedClient} />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  {selectedClient ? clientName(selectedClient) : 'Conversation'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selectedClient?.username ? `@${selectedClient.username}` : 'Telegram conversation'}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto hidden sm:inline-flex">
                Conversation history
              </Badge>
            </header>
            <Conversation key={selectedId} clientId={selectedId} />
            <footer className="border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground">
              Messages and bot replies update automatically.
            </footer>
          </>
        )}
      </main>
    </div>
  )
}

function Conversation({ clientId }: { clientId: number }) {
  const messages = useMessages(clientId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const [showLatest, setShowLatest] = useState(false)

  function scrollToLatest() {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight
    nearBottom.current = true
    setShowLatest(false)
  }

  useEffect(() => {
    if (!messages.data) return
    const container = scrollRef.current
    if (container && nearBottom.current) container.scrollTop = container.scrollHeight
  }, [messages.data])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={() => {
          const container = scrollRef.current
          if (!container) return
          nearBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 100
          setShowLatest(!nearBottom.current)
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8"
      >
        <div className="mx-auto max-w-3xl">
          {messages.isPending && (
            <p className="text-center text-muted-foreground" role="status">
              Loading conversation…
            </p>
          )}
          {messages.error && (
            <Alert variant="destructive">
              <AlertDescription>{messages.error.message}</AlertDescription>
            </Alert>
          )}
          {messages.data?.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No messages in this conversation yet.</p>
          )}
          {messages.data?.map((message, index, list) => {
            const previous = list[index - 1]
            const newDay =
              !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString()
            const incoming = message.sender === 'client'
            const showSender = newDay || previous?.sender !== message.sender
            return (
              <Fragment key={message.id}>
                {newDay && (
                  <div className="my-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border/60" />
                    <time dateTime={message.created_at} className="text-xs text-muted-foreground">
                      {dayLabel(message.created_at)}
                    </time>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                )}
                <div className={cn('flex', incoming ? 'justify-start' : 'justify-end', showSender ? 'mt-5' : 'mt-1.5')}>
                  <div className="max-w-[88%] sm:max-w-[75%]">
                    {showSender && (
                      <p
                        className={cn(
                          'mb-1.5 flex items-center gap-1 text-xs text-muted-foreground',
                          !incoming && 'justify-end',
                        )}
                      >
                        {!incoming && <Bot className="size-3.5" aria-hidden="true" />}
                        {incoming ? 'Client' : 'Bot'}
                      </p>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl border px-4 py-3',
                        incoming
                          ? 'rounded-tl-md border-border bg-card'
                          : 'rounded-tr-md border-primary/25 bg-primary/10',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                        {message.text ?? <span className="italic text-muted-foreground">Non-text message</span>}
                      </p>
                      <time
                        dateTime={message.created_at}
                        title={new Date(message.created_at).toLocaleString()}
                        className="mt-2 block text-right text-[11px] text-muted-foreground"
                      >
                        {timeFormat.format(new Date(message.created_at))}
                      </time>
                    </div>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
      {showLatest && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-md"
          onClick={scrollToLatest}
        >
          <ArrowDown />
          Latest messages
        </Button>
      )}
    </div>
  )
}
