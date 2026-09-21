create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  occupation text,
  age integer check (age between 1 and 120),
  birth_date date,
  gender text,
  nickname text,
  grade text,
  major text,
  enrollment_status text,
  additional_info text,
  age_group text,
  region text,
  interests text[] not null default '{}',
  point_balance bigint not null default 5000 check (point_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists occupation text;
alter table public.users add column if not exists age integer check (age between 1 and 120);
alter table public.users add column if not exists birth_date date;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists additional_info text;
alter table public.users add column if not exists nickname text;
alter table public.users add column if not exists grade text;
alter table public.users add column if not exists major text;
alter table public.users add column if not exists enrollment_status text;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) >= 3),
  description text not null default '',
  category text not null default '일반',
  questions jsonb not null default '[]'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  target_count integer not null check (target_count between 1 and 100),
  response_count integer not null default 0 check (response_count >= 0),
  reward_points integer not null default 0 check (reward_points >= 0),
  remaining_budget bigint not null default 0 check (remaining_budget >= 0),
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  deadline date not null,
  status text not null default 'active' check (status in ('draft', 'active', 'closed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null,
  reward_points integer not null default 0 check (reward_points >= 0),
  created_at timestamptz not null default now(),
  unique (survey_id, respondent_id)
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  survey_id uuid references public.surveys(id) on delete set null,
  response_id uuid references public.responses(id) on delete set null,
  type text not null check (type in ('survey_reward', 'survey_funding', 'admin_adjustment')),
  amount bigint not null check (amount <> 0),
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);

create index if not exists surveys_status_created_idx on public.surveys(status, created_at desc);
create index if not exists responses_survey_idx on public.responses(survey_id);
create index if not exists point_transactions_user_created_idx on public.point_transactions(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, name, nickname, gender, grade, major, enrollment_status)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nickname', ''), new.raw_user_meta_data ->> 'nickname', new.raw_user_meta_data ->> 'gender', new.raw_user_meta_data ->> 'grade', new.raw_user_meta_data ->> 'major', new.raw_user_meta_data ->> 'enrollment_status')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Survey lifecycle RPCs and upgrade-safe backfills are defined in
-- migrations/20260921_mvp_contract.sql. Apply migrations after this base schema.
