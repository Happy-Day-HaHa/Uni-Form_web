create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null default '',
  occupation text,
  age integer check (age between 1 and 120),
  birth_date date,
  gender text,
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

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) >= 3),
  description text not null default '',
  category text not null default '일반',
  questions jsonb not null default '[]'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  target_count integer not null check (target_count > 0),
  response_count integer not null default 0 check (response_count >= 0),
  reward_points integer not null check (reward_points > 0),
  remaining_budget bigint not null check (remaining_budget >= 0),
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  status text not null default 'active' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null,
  reward_points integer not null check (reward_points > 0),
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
  insert into public.users (id, email, name, occupation, age, birth_date, gender, additional_info)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''), new.raw_user_meta_data ->> 'occupation', nullif(new.raw_user_meta_data ->> 'age', '')::integer, nullif(new.raw_user_meta_data ->> 'birth_date', '')::date, new.raw_user_meta_data ->> 'gender', new.raw_user_meta_data ->> 'additional_info')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_survey_with_budget(survey_payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  created_survey_id uuid := gen_random_uuid();
  target_total integer := (survey_payload ->> 'target_count')::integer;
  reward_each integer := (survey_payload ->> 'reward_points')::integer;
  required_budget bigint := target_total::bigint * reward_each::bigint;
  new_balance bigint;
begin
  if actor_id is null then raise exception '로그인이 필요합니다.'; end if;
  if target_total < 1 or reward_each < 1 then raise exception '모집 인원과 리워드는 1 이상이어야 합니다.'; end if;

  update public.users set point_balance = point_balance - required_budget, updated_at = now()
  where id = actor_id and point_balance >= required_budget
  returning point_balance into new_balance;
  if new_balance is null then raise exception '포인트가 부족합니다.'; end if;

  insert into public.surveys (id, creator_id, title, description, category, questions, audience, target_count, reward_points, remaining_budget, estimated_minutes)
  values (created_survey_id, actor_id, survey_payload ->> 'title', coalesce(survey_payload ->> 'description', ''), coalesce(survey_payload ->> 'category', '일반'), coalesce(survey_payload -> 'questions', '[]'::jsonb), coalesce(survey_payload -> 'audience', '{}'::jsonb), target_total, reward_each, required_budget, greatest(1, coalesce((survey_payload ->> 'estimated_minutes')::integer, 5)));

  insert into public.point_transactions (user_id, survey_id, type, amount, balance_after)
  values (actor_id, created_survey_id, 'survey_funding', -required_budget, new_balance);
  return created_survey_id;
end;
$$;

create or replace function public.submit_survey_response(target_survey_id uuid, submitted_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor_id uuid := auth.uid();
  target_survey public.surveys%rowtype;
  created_response_id uuid := gen_random_uuid();
  new_balance bigint;
begin
  if actor_id is null then raise exception '로그인이 필요합니다.'; end if;
  select * into target_survey from public.surveys where id = target_survey_id for update;
  if not found or target_survey.status <> 'active' then raise exception '참여할 수 없는 설문입니다.'; end if;
  if target_survey.creator_id = actor_id then raise exception '본인이 만든 설문에는 참여할 수 없습니다.'; end if;
  if target_survey.response_count >= target_survey.target_count or target_survey.remaining_budget < target_survey.reward_points then raise exception '모집이 마감되었습니다.'; end if;

  insert into public.responses (id, survey_id, respondent_id, answers, reward_points)
  values (created_response_id, target_survey_id, actor_id, submitted_answers, target_survey.reward_points);
  update public.surveys set response_count = response_count + 1, remaining_budget = remaining_budget - reward_points,
    status = case when response_count + 1 >= target_count then 'closed' else status end
  where id = target_survey_id;
  update public.users set point_balance = point_balance + target_survey.reward_points, updated_at = now()
  where id = actor_id returning point_balance into new_balance;
  insert into public.point_transactions (user_id, survey_id, response_id, type, amount, balance_after)
  values (actor_id, target_survey_id, created_response_id, 'survey_reward', target_survey.reward_points, new_balance);
  return jsonb_build_object('response_id', created_response_id, 'reward_points', target_survey.reward_points);
exception when unique_violation then
  raise exception '이미 참여한 설문입니다.';
end;
$$;

revoke all on function public.create_survey_with_budget(jsonb) from public;
revoke all on function public.submit_survey_response(uuid, jsonb) from public;
grant execute on function public.create_survey_with_budget(jsonb) to authenticated;
grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;
