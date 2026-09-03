-- Actualización segura para una base ya creada.
-- No borra ni modifica los registros existentes.

alter table information add column if not exists content_hash text;
alter table information add column if not exists summary text;
alter table information add column if not exists information_type text;
alter table information add column if not exists obtained_at timestamptz default now();

create index if not exists information_hash_idx on information(content_hash);

drop index if exists information_search_idx;
create index information_search_idx
on information using gin (
  to_tsvector(
    'spanish',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(content, '')
  )
);
