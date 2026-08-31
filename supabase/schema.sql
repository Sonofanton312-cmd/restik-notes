-- Clean up any partial state from previous run
drop table if exists public.nodes cascade;

create table public.nodes (
  id           text primary key default gen_random_uuid()::text,
  owner        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id    text references public.nodes(id) on delete cascade,
  type         text not null check (type in ('folder', 'question', 'note', 'file', 'link')),
  name         text not null,
  content      jsonb not null default '{}'::jsonb,
  metadata     jsonb not null default '{}'::jsonb,
  tags         text[] not null default '{}',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  search_vector tsvector
);

create index if not exists nodes_parent_idx on public.nodes (owner, parent_id);
create index if not exists nodes_type_idx on public.nodes (owner, type);
create index if not exists nodes_deleted_idx on public.nodes (owner, deleted_at);
create index if not exists nodes_search_idx on public.nodes using gin (search_vector);

-- Trigger to maintain search_vector automatically
create or replace function public.nodes_update_search_vector()
returns trigger as $$
begin
  new.search_vector := to_tsvector(
    'english',
    coalesce(new.name, '') || ' ' ||
    coalesce(new.content->>'question', '') || ' ' ||
    coalesce(new.content->>'answer', '') || ' ' ||
    coalesce(new.content->>'body', '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$ language plpgsql;

create trigger nodes_search_vector_trigger
  before insert or update on public.nodes
  for each row execute procedure public.nodes_update_search_vector();

-- Trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger nodes_set_updated_at
  before update on public.nodes
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.nodes enable row level security;

create policy "Nodes are visible to their owner"
  on public.nodes for select using (auth.uid() = owner);

create policy "Nodes are insertable by their owner"
  on public.nodes for insert with check (auth.uid() = owner);

create policy "Nodes are updatable by their owner"
  on public.nodes for update using (auth.uid() = owner) with check (auth.uid() = owner);

create policy "Nodes are deletable by their owner"
  on public.nodes for delete using (auth.uid() = owner);

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------

-- Breadcrumbs ancestor path
create or replace function public.get_node_path(target_id text)
returns table(id text, name text, type text, depth int)
language sql stable security invoker as $$
  with recursive ancestors as (
    select n.id, n.name, n.type, n.parent_id, 0 as depth
    from public.nodes n
    where n.id = target_id and n.owner = auth.uid()
    union all
    select p.id, p.name, p.type, p.parent_id, a.depth + 1
    from public.nodes p
    join ancestors a on p.id = a.parent_id
    where p.owner = auth.uid()
  )
  select ancestors.id, ancestors.name, ancestors.type, ancestors.depth
  from ancestors
  order by depth desc;
$$;

-- Subtree descendant IDs
create or replace function public.get_descendant_ids(target_id text)
returns table(id text)
language sql stable security invoker as $$
  with recursive descendants as (
    select n.id from public.nodes n where n.id = target_id and n.owner = auth.uid()
    union all
    select c.id from public.nodes c
    join descendants d on c.parent_id = d.id
    where c.owner = auth.uid()
  )
  select id from descendants;
$$;

-- Soft delete
create or replace function public.soft_delete_node(target_id text)
returns void
language sql security invoker as $$
  update public.nodes
  set deleted_at = now()
  where id in (select id from public.get_descendant_ids(target_id))
    and owner = auth.uid();
$$;

-- Restore
create or replace function public.restore_node(target_id text)
returns void
language sql security invoker as $$
  update public.nodes
  set deleted_at = null
  where id in (select id from public.get_descendant_ids(target_id))
    and owner = auth.uid();
$$;

-- Full-text search
create or replace function public.search_nodes(search_query text)
returns setof public.nodes
language sql stable security invoker as $$
  select *
  from public.nodes
  where owner = auth.uid()
    and deleted_at is null
    and search_vector @@ websearch_to_tsquery('english', search_query)
  order by ts_rank(search_vector, websearch_to_tsquery('english', search_query)) desc
  limit 30;
$$;

-- ---------------------------------------------------------------------
-- Storage Bucket & Policies
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "Users manage their own attachment files" on storage.objects;
create policy "Users manage their own attachment files"
  on storage.objects for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);