-- CRM access: support staff sign in with Supabase Auth, and only users listed in `operators` can read
-- clients and messages. Writes still go through Edge Functions (secret key).

create table public.operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.operators enable row level security;

-- An operator can see their own row; the policies below rely on this lookup.
create policy "operators can read own row"
on public.operators for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "operators can read clients"
on public.clients for select
to authenticated
using (exists (select 1 from public.operators o where o.user_id = (select auth.uid())));

create policy "operators can read messages"
on public.messages for select
to authenticated
using (exists (select 1 from public.operators o where o.user_id = (select auth.uid())));

grant select on public.operators, public.clients, public.messages to authenticated;

-- Live updates in the CRM (Realtime respects the select policies above).
alter publication supabase_realtime add table public.clients, public.messages;
