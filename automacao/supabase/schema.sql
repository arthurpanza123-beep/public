create extension if not exists pgcrypto;

do $$
begin
  create type public.contact_state as enum (
    'new',
    'initial_flow',
    'ai_ready',
    'waiting_test_confirmation',
    'waiting_arthur_approval',
    'test_creating',
    'human_takeover',
    'inactive'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_direction as enum ('inbound', 'outbound', 'internal');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_sender as enum ('customer', 'bot', 'arthur', 'system');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.test_request_status as enum (
    'requested',
    'awaiting_arthur_approval',
    'approved',
    'creating',
    'completed',
    'failed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  jid text,
  display_name text,
  state public.contact_state not null default 'new',
  initial_flow_sent_at timestamptz,
  ai_enabled boolean not null default false,
  human_takeover_by text,
  human_takeover_until timestamptz,
  last_customer_message text,
  last_customer_message_at timestamptz,
  last_bot_message_at timestamptz,
  last_human_message_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_phone_digits check (phone ~ '^[0-9]{8,15}$')
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  phone text not null,
  direction public.message_direction not null,
  sender public.message_sender not null,
  message_type text not null default 'text',
  body text,
  media_file text,
  whatsapp_message_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.initial_flow_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  phone text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.test_requests (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  phone text not null,
  customer_name text,
  status public.test_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text,
  created_in_panel_at timestamptz,
  provider text,
  username text,
  password text,
  expires_at_text text,
  tester_response jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  n8n_execution_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  test_request_id uuid references public.test_requests(id) on delete set null,
  phone text not null,
  provider text,
  username text not null,
  password text not null,
  expires_at_text text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  phone text not null,
  reason text not null,
  context text not null,
  status text not null default 'scheduled',
  due_at timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  phone text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_black_friday_sends (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  phone text not null,
  sent_by text not null default 'arthur',
  caption text,
  sent_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists contacts_state_idx on public.contacts(state);
create index if not exists contacts_human_takeover_until_idx on public.contacts(human_takeover_until);
create index if not exists conversations_phone_created_idx on public.conversations(phone, created_at desc);
create index if not exists test_requests_phone_created_idx on public.test_requests(phone, created_at desc);
create index if not exists test_requests_status_idx on public.test_requests(status);
create index if not exists follow_ups_due_status_idx on public.follow_ups(status, due_at);
create index if not exists automation_events_type_created_idx on public.automation_events(event_type, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists test_requests_set_updated_at on public.test_requests;
create trigger test_requests_set_updated_at
before update on public.test_requests
for each row execute function public.set_updated_at();

drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at
before update on public.follow_ups
for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.initial_flow_events enable row level security;
alter table public.test_requests enable row level security;
alter table public.credentials enable row level security;
alter table public.follow_ups enable row level security;
alter table public.automation_events enable row level security;
alter table public.manual_black_friday_sends enable row level security;

create or replace view public.v_contacts_panel as
select
  c.id,
  c.phone,
  c.display_name,
  c.state,
  c.initial_flow_sent_at,
  c.ai_enabled,
  c.human_takeover_by,
  c.human_takeover_until,
  c.last_customer_message,
  c.last_customer_message_at,
  c.last_bot_message_at,
  c.last_human_message_at,
  c.created_at,
  c.updated_at,
  (
    select tr.status
    from public.test_requests tr
    where tr.contact_id = c.id
    order by tr.created_at desc
    limit 1
  ) as last_test_status
from public.contacts c;
