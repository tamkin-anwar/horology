-- Horology: shared collection for two (or a few) people.
-- Run once in the Supabase SQL editor of a new project.
--
-- Everything a person does is an append-only operation (see prototype/store.js). Members of a
-- collection can read and add operations; nobody can edit or delete one, so history is exact and
-- two devices merge by union. A "private_to" operation is visible only to that person: that's how
-- a surprise pick stays hidden from the person it's for until it's revealed.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Watches',
  created_at timestamptz not null default now()
);

create table public.members (
  collection_id uuid not null references public.collections on delete cascade,
  email text not null,
  name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  added_at timestamptz not null default now(),
  primary key (collection_id, email)
);

create table public.ops (
  id text primary key,
  collection_id uuid not null references public.collections on delete cascade,
  at bigint not null,
  author text not null default lower(auth.jwt() ->> 'email'),
  device text,
  type text not null check (type in ('create', 'update', 'delete', 'undo')),
  kind text,
  ref text,
  target text,
  data jsonb,
  label text,
  "group" text,
  private_to text,
  created_at timestamptz not null default now()
);
create index ops_collection_at on public.ops (collection_id, at);

-- Who is asking, by verified sign-in email.
create function public.me() returns text language sql stable as $$
  select lower(auth.jwt() ->> 'email')
$$;

create function public.is_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where collection_id = cid and lower(email) = public.me())
$$;

create function public.is_owner(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where collection_id = cid and lower(email) = public.me() and role = 'owner')
$$;

-- First sign-in: create a collection and become its owner.
create function public.create_collection(collection_name text, your_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if public.me() is null then raise exception 'Sign in first'; end if;
  insert into collections (name) values (coalesce(nullif(collection_name, ''), 'Watches')) returning id into cid;
  insert into members (collection_id, email, name, role) values (cid, public.me(), nullif(your_name, ''), 'owner');
  return cid;
end $$;

alter table public.collections enable row level security;
alter table public.members enable row level security;
alter table public.ops enable row level security;

create policy "members see their collections" on public.collections
  for select to authenticated using (public.is_member(id));

create policy "members see each other" on public.members
  for select to authenticated using (public.is_member(collection_id));
create policy "owners add members" on public.members
  for insert to authenticated with check (public.is_owner(collection_id) and role = 'member');
create policy "owners remove members" on public.members
  for delete to authenticated using (public.is_owner(collection_id) and role = 'member');
create policy "you can set your own name" on public.members
  for update to authenticated using (lower(email) = public.me()) with check (lower(email) = public.me());

create policy "members read shared and their own private ops" on public.ops
  for select to authenticated
  using (public.is_member(collection_id) and (private_to is null or lower(private_to) = public.me()));
create policy "members add ops as themselves" on public.ops
  for insert to authenticated
  with check (public.is_member(collection_id) and author = public.me() and (private_to is null or lower(private_to) = public.me()));
-- No update or delete policies: operations are permanent. Undo is a new operation.

-- Live updates: a change on one phone appears on the other.
alter publication supabase_realtime add table public.ops;

-- Watch photos: private bucket, one folder per collection.
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;

create policy "members read photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "members add photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
