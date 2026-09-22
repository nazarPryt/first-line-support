-- Every Telegram user who writes to the bot becomes a client; every message in either direction is logged.

create type public.message_sender as enum ('client', 'bot');

create table public.clients (
  id bigint generated always as identity primary key,
  telegram_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  -- Last message from the client or from the bot; kept up to date by the trigger below.
  last_message_at timestamptz not null default now()
);

create index clients_last_message_at_idx on public.clients (last_message_at desc);

create table public.messages (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients (id) on delete cascade,
  sender public.message_sender not null,
  telegram_message_id bigint,
  -- Null for non-text messages (stickers, photos without caption, ...).
  text text,
  created_at timestamptz not null default now()
);

create index messages_client_id_idx on public.messages (client_id);
create index messages_created_at_idx on public.messages (created_at desc);

create function public.touch_client_last_message_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.clients
  set last_message_at = greatest(last_message_at, new.created_at)
  where id = new.client_id;
  return new;
end;
$$;

create trigger messages_touch_client
after insert on public.messages
for each row execute function public.touch_client_last_message_at();

-- Only Edge Functions (secret key) touch these tables; no policies means anon/authenticated see nothing.
alter table public.clients enable row level security;
alter table public.messages enable row level security;
