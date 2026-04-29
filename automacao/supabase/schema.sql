create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null,
  status text default 'bot',
  device text,
  app_used text,
  notes text,
  last_message_at timestamptz,
  flow_initial_sent boolean not null default false,
  flow_initial_sent_at timestamptz,
  bot_paused_until timestamptz,
  assigned_to_human boolean not null default false
);

alter table public.customers
  add column if not exists flow_initial_sent boolean not null default false;

alter table public.customers
  add column if not exists flow_initial_sent_at timestamptz;

alter table public.customers
  add column if not exists bot_paused_until timestamptz;

alter table public.customers
  add column if not exists assigned_to_human boolean not null default false;

alter table public.customers
  alter column status set default 'bot';

do $$
begin
  alter table public.customers
    add constraint customers_phone_unique unique (phone);
exception when duplicate_object then null;
end $$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  direction text,
  body text,
  media_url text,
  sent_by text,
  pending_send boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers(phone);
create index if not exists customers_last_message_at_idx on public.customers(last_message_at desc);
create index if not exists messages_customer_created_idx on public.messages(customer_id, created_at desc);

alter table public.customers enable row level security;
alter table public.messages enable row level security;

create or replace view public.v_customers_panel as
select
  c.id,
  c.name,
  c.phone,
  c.status,
  c.device,
  c.app_used,
  c.notes,
  c.last_message_at,
  c.flow_initial_sent,
  c.flow_initial_sent_at,
  c.bot_paused_until,
  c.assigned_to_human,
  (
    select m.body
    from public.messages m
    where m.customer_id = c.id
    order by m.created_at desc
    limit 1
  ) as last_message
from public.customers c;
