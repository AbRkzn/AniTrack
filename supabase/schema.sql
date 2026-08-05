-- AniTrack Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Tables mirror the app's local SQLite schema (camelCase columns, TEXT ids).
-- Every synced row is owned by a user (owner_id) and supports soft-delete (deleted).

create table if not exists crops (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  name text not null,
  variety text not null default '',
  fieldLocation text not null default '',
  fieldId text,
  plantingDate text not null,
  expectedHarvestDate text not null,
  actualHarvestDate text,
  status text not null default 'growing',
  notes text not null default '',
  photos text not null default '[]',
  yieldEstimate real not null default 0,
  yieldUnit text not null default 'kg',
  createdAt text not null,
  updatedAt text not null
);
create index if not exists crops_owner_idx on crops (owner_id, updatedAt);

create table if not exists harvests (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  cropId text not null,
  harvestDate text not null,
  quantity real not null default 0,
  unit text not null default 'kg',
  quality text,
  moistureContent real,
  photos text not null default '[]',
  notes text not null default '',
  sellingPrice real not null default 0,
  buyer text,
  revenue real not null default 0,
  createdAt text not null,
  updatedAt text not null
);
create index if not exists harvests_owner_idx on harvests (owner_id, updatedAt);

create table if not exists expenses (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  cropId text,
  category text not null default 'other',
  amount real not null default 0,
  currency text not null default 'PHP',
  date text not null,
  vendor text,
  receiptPhoto text,
  notes text not null default '',
  recurring integer not null default 0,
  recurringInterval text,
  healthRecordId text,
  recurringSourceId text,
  createdAt text not null,
  updatedAt text not null
);
create index if not exists expenses_owner_idx on expenses (owner_id, updatedAt);

create table if not exists fertilizer_schedules (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  cropId text not null,
  fertilizerName text not null,
  fertilizerType text not null default 'compound',
  applicationMethod text not null default 'broadcast',
  amountPerUnit real not null default 0,
  totalAmount real not null default 0,
  unit text not null default 'kg',
  scheduledDate text not null,
  completedDate text,
  status text not null default 'pending',
  notes text not null default '',
  reminderEnabled integer not null default 1,
  createdAt text not null,
  updatedAt text not null
);
create index if not exists fertilizer_schedules_owner_idx on fertilizer_schedules (owner_id, updatedAt);

create table if not exists animals (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  tagNumber text not null,
  name text,
  species text not null default 'Cattle',
  breed text,
  birthDate text,
  sex text not null default 'female',
  weight real,
  weightUnit text not null default 'kg',
  status text not null default 'active',
  location text not null default '',
  notes text not null default '',
  photos text not null default '[]',
  createdAt text not null,
  updatedAt text not null
);
create index if not exists animals_owner_idx on animals (owner_id, updatedAt);

create table if not exists animal_health_records (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  animalId text not null,
  date text not null,
  type text not null default 'examination',
  diagnosis text,
  medication text,
  dosage text,
  veterinarian text,
  cost real,
  notes text not null default '',
  createdAt text not null,
  updatedAt text not null
);
create index if not exists animal_health_records_owner_idx on animal_health_records (owner_id, updatedAt);

create table if not exists fields (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  name text not null,
  acreage real not null default 0,
  soilType text not null default '',
  notes text not null default '',
  createdAt text not null,
  updatedAt text not null
);
create index if not exists fields_owner_idx on fields (owner_id, updatedAt);

create table if not exists farm_tasks (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  priority text not null default 'medium',
  status text not null default 'pending',
  dueDate text not null,
  cropId text,
  fieldId text,
  assignedTo text,
  reminderEnabled integer not null default 0,
  reminderDate text,
  completedDate text,
  createdAt text not null,
  updatedAt text not null
);
create index if not exists farm_tasks_owner_idx on farm_tasks (owner_id, updatedAt);

create table if not exists budgets (
  id text primary key,
  owner_id uuid not null default auth.uid(),
  deleted boolean not null default false,
  category text not null,
  amount real not null default 0,
  currency text not null default 'PHP',
  month text not null,
  notes text not null default '',
  createdAt text not null,
  updatedAt text not null
);
create index if not exists budgets_owner_idx on budgets (owner_id, updatedAt);

-- Row Level Security: each user can only read/write their own rows.
alter table crops enable row level security;
alter table harvests enable row level security;
alter table expenses enable row level security;
alter table fertilizer_schedules enable row level security;
alter table animals enable row level security;
alter table animal_health_records enable row level security;
alter table fields enable row level security;
alter table farm_tasks enable row level security;
alter table budgets enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['crops','harvests','expenses','fertilizer_schedules','animals','animal_health_records','fields','farm_tasks','budgets']
  loop
    execute format('create policy "owner select %1$s" on %1$s for select using (auth.uid() = owner_id);', t);
    execute format('create policy "owner insert %1$s" on %1$s for insert with check (auth.uid() = owner_id);', t);
    execute format('create policy "owner update %1$s" on %1$s for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);', t);
    execute format('create policy "owner delete %1$s" on %1$s for delete using (auth.uid() = owner_id);', t);
  end loop;
end $$;
