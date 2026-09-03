create extension if not exists pgcrypto;

create table if not exists topics (id uuid primary key default gen_random_uuid(), name text not null unique, description text, language text default 'es', created_at timestamptz default now());
create table if not exists categories (id uuid primary key default gen_random_uuid(), topic_id uuid not null references topics(id) on delete cascade, name text not null, description text, unique(topic_id,name));
create table if not exists subtopics (id uuid primary key default gen_random_uuid(), category_id uuid not null references categories(id) on delete cascade, name text not null, description text, status text default 'pending', unique(category_id,name));
create table if not exists sources (id uuid primary key default gen_random_uuid(), source_type text not null default 'web', title text, url text not null unique, author text, publication_date date, reliability numeric(3,2) default .5, created_at timestamptz default now());
create table if not exists information (id uuid primary key default gen_random_uuid(), subtopic_id uuid not null references subtopics(id) on delete cascade, source_id uuid references sources(id), title text not null, content text not null, summary text, information_type text, obtained_at timestamptz default now(), content_hash text, created_at timestamptz default now(), unique(source_id,title));
create table if not exists tags (id uuid primary key default gen_random_uuid(), name text not null unique, description text);
create table if not exists information_tags (info_id uuid references information(id) on delete cascade, etiqueta_id uuid references tags(id) on delete cascade, primary key(info_id,etiqueta_id));
create table if not exists files (id uuid primary key default gen_random_uuid(), info_id uuid references information(id) on delete cascade, nombre text, url text, tipo text, tamano bigint, created_at timestamptz default now());
create table if not exists entity_relationships (id uuid primary key default gen_random_uuid(), source_info_id uuid references information(id) on delete cascade, target_info_id uuid references information(id) on delete cascade, relation_type text not null, confidence numeric(3,2) default .5, unique(source_info_id,target_info_id,relation_type));
create table if not exists research_jobs (id uuid primary key default gen_random_uuid(), topic_id uuid references topics(id), requested_area text, requested_subtopic text, status text default 'pending', sources_limit int default 3, tokens_limit int default 12000, error_message text, started_at timestamptz, completed_at timestamptz, created_at timestamptz default now());
create table if not exists source_documents (id uuid primary key default gen_random_uuid(), source_id uuid not null references sources(id) on delete cascade, content_hash text not null unique, raw_content text, fetched_at timestamptz default now());
create table if not exists document_chunks (id uuid primary key default gen_random_uuid(), document_id uuid not null references source_documents(id) on delete cascade, chunk_index int not null, content text not null, unique(document_id,chunk_index));
create table if not exists weather_observations (id uuid primary key default gen_random_uuid(), location text not null, latitude numeric, longitude numeric, observed_at timestamptz not null, temperature numeric, precipitation numeric, humidity numeric, raw jsonb);
create index if not exists information_search_idx on information using gin(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,'')));
create index if not exists information_hash_idx on information(content_hash);
create index if not exists documents_source_idx on source_documents(source_id);

-- Ejecutar este archivo completo en Supabase antes de usar las herramientas de guardado.
