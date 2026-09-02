-- Esquema de conocimiento agronómico para NEXO.
create extension if not exists pgcrypto;

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  language text not null default 'es',
  depth text not null default 'medium' check (depth in ('basic', 'medium', 'deep')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  unique(topic_id, name)
);

create table if not exists subtopics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'researching', 'processed', 'error')),
  last_researched_at timestamptz,
  unique(category_id, name)
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('web', 'academic', 'pdf', 'report', 'video', 'api', 'book', 'other')),
  title text not null,
  url text not null unique,
  author text,
  publisher text,
  publication_date date,
  accessed_at timestamptz not null default now(),
  content_hash text,
  reliability_score numeric(4,3) check (reliability_score between 0 and 1),
  reliability_reason text,
  raw_content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists information (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  subtopic_id uuid references subtopics(id) on delete set null,
  source_id uuid not null references sources(id) on delete restrict,
  title text not null,
  content text not null,
  summary text,
  information_type text not null default 'fact',
  confidence_score numeric(4,3) check (confidence_score between 0 and 1),
  validation_status text not null default 'unreviewed' check (validation_status in ('unreviewed', 'validated', 'contradictory', 'needs_review')),
  published_at date,
  obtained_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
  ) stored,
  unique(source_id, title)
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists information_tags (
  information_id uuid not null references information(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key(information_id, tag_id)
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  information_id uuid references information(id) on delete cascade,
  name text not null,
  url text,
  mime_type text,
  size_bytes bigint,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists entity_relationships (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  predicate text not null,
  object_type text not null,
  object_id uuid,
  object_text text,
  evidence_information_id uuid references information(id) on delete set null,
  confidence_score numeric(4,3) check (confidence_score between 0 and 1),
  unique(subject_type, subject_id, predicate, object_type, object_id, object_text)
);

create table if not exists research_jobs (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  requested_area text,
  requested_subtopic text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'paused_quota', 'error')),
  sources_limit integer not null default 10,
  tokens_limit integer not null default 20000,
  sources_processed integer not null default 0,
  tokens_used integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists information_search_idx on information using gin(search_vector);
create index if not exists information_subtopic_idx on information(subtopic_id);
create index if not exists sources_type_idx on sources(source_type);
create index if not exists relationships_subject_idx on entity_relationships(subject_type, subject_id);

-- Tema raíz inicial.
insert into topics (name, description, language)
values ('Agronomía', 'Base de conocimiento sobre producción vegetal y manejo agrícola.', 'es')
on conflict (name) do nothing;

-- Las 10 áreas principales.
insert into categories (topic_id, name, sort_order)
select t.id, c.name, c.sort_order
from topics t
cross join (values
  ('Cultivos y técnicas de producción', 1),
  ('Riego y manejo del agua', 2),
  ('Suelos', 3),
  ('Fertilización y nutrición vegetal', 4),
  ('Plagas', 5),
  ('Enfermedades de las plantas', 6),
  ('Clima y meteorología agrícola', 7),
  ('Especies y variedades', 8),
  ('Fisiología, anatomía y desarrollo vegetal', 9),
  ('Tecnología y manejo agrícola', 10)
) as c(name, sort_order)
where t.name = 'Agronomía'
on conflict (topic_id, name) do nothing;

-- Subtemas iniciales; se pueden ampliar desde el panel o mediante NEXO.
insert into subtopics (category_id, name, sort_order)
select c.id, s.name, s.sort_order
from categories c
join topics t on t.id = c.topic_id
cross join lateral (
  select * from (values
    ('Técnicas de siembra', 1), ('Densidad y distancia de plantación', 2), ('Rotación y asociación de cultivos', 3), ('Agricultura protegida', 4), ('Invernaderos', 5), ('Hidroponía', 6), ('Agricultura de conservación', 7), ('Etapas fenológicas', 8), ('Rendimiento y cosecha', 9)
  ) as x(name, sort_order) where c.name = 'Cultivos y técnicas de producción'
  union all select * from (values
    ('Riego por goteo', 1), ('Aspersión', 2), ('Microaspersión', 3), ('Riego por gravedad', 4), ('Necesidades hídricas', 5), ('Frecuencia y cantidad de riego', 6), ('Calidad del agua', 7), ('Drenaje', 8), ('Captación de agua de lluvia', 9), ('Estrés hídrico', 10)
  ) as x(name, sort_order) where c.name = 'Riego y manejo del agua'
  union all select * from (values
    ('Tipos de suelo', 1), ('pH', 2), ('Textura y estructura', 3), ('Materia orgánica', 4), ('Humedad', 5), ('Salinidad', 6), ('Compactación', 7), ('Erosión', 8), ('Análisis de suelo', 9), ('Preparación y mejoramiento', 10)
  ) as x(name, sort_order) where c.name = 'Suelos'
  union all select * from (values
    ('Nitrógeno, fósforo y potasio (NPK)', 1), ('Micronutrientes', 2), ('Fertilizantes químicos', 3), ('Fertilizantes orgánicos', 4), ('Compost', 5), ('Biofertilizantes', 6), ('Fertirrigación', 7), ('Deficiencias nutricionales', 8), ('Dosis y calendarios de fertilización', 9)
  ) as x(name, sort_order) where c.name = 'Fertilización y nutrición vegetal'
  union all select * from (values
    ('Identificación de insectos y otras plagas', 1), ('Cultivos afectados', 2), ('Ciclo de vida', 3), ('Daños y síntomas', 4), ('Prevención', 5), ('Control biológico', 6), ('Control químico', 7), ('Control cultural', 8), ('Manejo integrado de plagas (MIP)', 9)
  ) as x(name, sort_order) where c.name = 'Plagas'
  union all select * from (values
    ('Hongos', 1), ('Bacterias', 2), ('Virus', 3), ('Nematodos', 4), ('Síntomas', 5), ('Diagnóstico', 6), ('Condiciones que favorecen la enfermedad', 7), ('Prevención', 8), ('Tratamientos', 9)
  ) as x(name, sort_order) where c.name = 'Enfermedades de las plantas'
  union all select * from (values
    ('Temperatura', 1), ('Precipitación', 2), ('Humedad', 3), ('Radiación solar', 4), ('Viento', 5), ('Heladas', 6), ('Sequías', 7), ('Calendarios agrícolas', 8), ('Relación clima-cultivo', 9)
  ) as x(name, sort_order) where c.name = 'Clima y meteorología agrícola'
  union all select * from (values
    ('Maíz', 1), ('Trigo', 2), ('Frijol', 3), ('Aguacate', 4), ('Jitomate', 5), ('Chile', 6), ('Fresa', 7), ('Limón', 8), ('Papa', 9), ('Flores y ornamentales', 10)
  ) as x(name, sort_order) where c.name = 'Especies y variedades'
  union all select * from (values
    ('Partes de una planta', 1), ('Raíces', 2), ('Tallos', 3), ('Hojas', 4), ('Flores', 5), ('Frutos', 6), ('Semillas', 7), ('Fotosíntesis', 8), ('Polinización', 9), ('Germinación', 10), ('Etapas de crecimiento', 11)
  ) as x(name, sort_order) where c.name = 'Fisiología, anatomía y desarrollo vegetal'
  union all select * from (values
    ('Maquinaria', 1), ('Sensores', 2), ('Drones', 3), ('Estaciones meteorológicas', 4), ('Agricultura de precisión', 5), ('IoT', 6), ('Imágenes satelitales', 7), ('Automatización del riego', 8), ('Monitoreo de cultivos', 9), ('IA aplicada a agricultura', 10)
  ) as x(name, sort_order) where c.name = 'Tecnología y manejo agrícola'
) s
where t.name = 'Agronomía'
on conflict (category_id, name) do nothing;
