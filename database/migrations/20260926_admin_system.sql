-- Uni-Form integrated administrator system
-- Apply after 20260921_mvp_contract.sql and 20260922_deadline_and_short_answers.sql.

alter table public.users add column if not exists role text not null default 'USER';
alter table public.users add column if not exists account_status text not null default 'active';
alter table public.users add column if not exists restriction_category text;
alter table public.users add column if not exists restricted_until timestamptz;
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('USER', 'STAFF', 'ADMIN'));
alter table public.users drop constraint if exists users_account_status_check;
alter table public.users add constraint users_account_status_check check (account_status in ('pending', 'active', 'restricted', 'withdrawn'));

alter table public.surveys add column if not exists removal_reason text;
alter table public.surveys add column if not exists removed_at timestamptz;
alter table public.surveys add column if not exists removed_by uuid references public.users(id);
alter table public.surveys add column if not exists disposal_at timestamptz;
alter table public.surveys drop constraint if exists surveys_status_check;
alter table public.surveys add constraint surveys_status_check check (status in ('draft', 'active', 'closed', 'archived', 'removed'));

alter table public.responses add column if not exists warning_submitted boolean not null default false;
alter table public.responses add column if not exists excluded boolean not null default false;
alter table public.responses add column if not exists excluded_at timestamptz;
alter table public.responses add column if not exists excluded_by uuid references public.users(id);
alter table public.responses add column if not exists exclusion_reason text;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leader_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
alter table public.surveys add column if not exists team_id uuid references public.teams(id) on delete set null;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  actor_id uuid not null references public.users(id),
  actor_name text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  reason text not null,
  memo text not null,
  before_value text,
  after_value text,
  payload jsonb not null default '{}'::jsonb,
  email_requested boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists admin_logs_created_idx on public.admin_action_logs(created_at desc);
create index if not exists admin_logs_target_idx on public.admin_action_logs(target_type, target_id);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  request_key text not null,
  recipient_user_id uuid references public.users(id),
  recipient_email text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(request_key, recipient_email)
);

create table if not exists public.reward_weeks (
  week text primary key,
  range_label text not null,
  step integer not null default 1 check (step between 1 and 5),
  participant_count integer not null default 0,
  tie_count integer not null default 0,
  locked_at timestamptz,
  lottery_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.reward_weeks add column if not exists participant_count integer not null default 0;
alter table public.reward_weeks add column if not exists tie_count integer not null default 0;
create table if not exists public.reward_winners (
  week text not null references public.reward_weeks(week) on delete cascade,
  rank integer not null check (rank between 1 and 3),
  user_id uuid not null references public.users(id),
  sent_at timestamptz,
  primary key (week, rank)
);
create table if not exists public.reward_notice (
  id boolean primary key default true check (id),
  title text not null,
  body text not null,
  tiers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'ADMIN' and account_status = 'active');
$$;

create or replace function public.refresh_my_restriction()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.users set account_status='active', restriction_category=null, restricted_until=null, updated_at=now()
  where id=auth.uid() and account_status='restricted' and restricted_until is not null and restricted_until<=now();
end;
$$;

create or replace function public.enforce_member_write_access()
returns trigger language plpgsql security definer set search_path = public as $$
declare member public.users%rowtype;
begin
  select * into member from public.users where id=auth.uid();
  if member.account_status='restricted' and member.restricted_until is not null and member.restricted_until<=now() then
    update public.users set account_status='active',restriction_category=null,restricted_until=null,updated_at=now() where id=member.id;
  elsif member.account_status in ('restricted','withdrawn','pending') then
    raise exception '이용이 제한된 계정입니다.' using errcode='42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_survey_write_access on public.surveys;
create trigger enforce_survey_write_access before insert or update on public.surveys for each row execute function public.enforce_member_write_access();
drop trigger if exists enforce_response_write_access on public.responses;
create trigger enforce_response_write_access before insert on public.responses for each row execute function public.enforce_member_write_access();
drop trigger if exists enforce_team_write_access on public.teams;
create trigger enforce_team_write_access before insert or update on public.teams for each row execute function public.enforce_member_write_access();
drop trigger if exists enforce_team_member_write_access on public.team_members;
create trigger enforce_team_member_write_access before insert or update on public.team_members for each row execute function public.enforce_member_write_access();

create or replace function public.admin_get_summary()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select jsonb_build_object(
    'members', jsonb_build_object('total', count(*), 'today', count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'), 'week', count(*) filter (where created_at >= date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')),
    'surveys', (select jsonb_build_object('total', count(*), 'today', count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'), 'week', count(*) filter (where created_at >= date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')) from public.surveys where status <> 'draft'),
    'responses', (select jsonb_build_object('total', count(*), 'today', count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'), 'week', count(*) filter (where created_at >= date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')) from public.responses),
    'todos',
      coalesce((select jsonb_agg(jsonb_build_object('type','reward','label',week||' 정산을 완료해주세요','to','/admin/rewards/'||week) order by week desc) from public.reward_weeks where step<5), '[]'::jsonb)
      || case when (select count(*) from (select respondent_id from public.responses where warning_submitted and created_at>=date_trunc('week',now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul' group by respondent_id having count(*)>=5) warned)>0
        then jsonb_build_array(jsonb_build_object('type','member','label','경고 후 제출 5회 이상 회원 확인','to','/admin/members?sort=warnings')) else '[]'::jsonb end
  ) into result from public.users;
  return result;
end;
$$;

create or replace function public.admin_get_leaderboard()
returns table(id uuid, nickname text, status text, role text, score bigint, warning_week bigint, last_active timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return query select u.id, u.nickname, u.account_status, u.role,
    count(r.id) filter (where not r.excluded), count(r.id) filter (where r.warning_submitted), max(r.created_at)
  from public.users u left join public.responses r on r.respondent_id = u.id and r.created_at >= date_trunc('week', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
  group by u.id, u.nickname, u.account_status, u.role order by 5 desc, 7 asc nulls last;
end;
$$;

create or replace function public.admin_perform_action(
  action_name text, target_type text, target_id text, reason_category text,
  action_memo text, action_payload jsonb, idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare actor public.users%rowtype; before_text text := ''; after_text text := ''; resolved_name text := coalesce(action_payload->>'target_name', target_id); uid uuid; random_name text;
begin
  select * into actor from public.users where id = auth.uid();
  if actor.role <> 'ADMIN' or actor.account_status <> 'active' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if trim(coalesce(action_memo, '')) = '' then raise exception '메모는 필수입니다.'; end if;
  if exists(select 1 from public.admin_action_logs where request_key = idempotency_key) then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  if action_name in ('survey_remove', 'survey_restore') then
    select title, status into resolved_name, before_text from public.surveys where id = target_id::uuid for update;
    if action_name = 'survey_remove' then
      update public.surveys set status='removed', removal_reason=reason_category, removed_at=now(), removed_by=actor.id, disposal_at=coalesce(disposal_at, now()+interval '30 days'), updated_at=now() where id=target_id::uuid and status in ('active','closed','archived'); after_text := 'removed';
    else
      update public.surveys set status='closed', removal_reason=null, removed_at=null, removed_by=null, updated_at=now() where id=target_id::uuid and status='removed' and (disposal_at is null or disposal_at > now()); after_text := 'closed';
    end if;
  elsif action_name = 'response_exclude' then
    select respondent_id, excluded::text into uid, before_text from public.responses where id=target_id::uuid for update;
    update public.responses set excluded=true, excluded_at=now(), excluded_by=actor.id, exclusion_reason=reason_category where id=target_id::uuid and not excluded;
    after_text := 'true';
  elsif action_name in ('member_restrict','member_unrestrict','member_rename','member_staff') then
    uid := target_id::uuid; select nickname, account_status into resolved_name, before_text from public.users where id=uid for update;
    if action_name='member_restrict' then update public.users set account_status='restricted', restriction_category=reason_category, restricted_until=(action_payload->>'until')::timestamptz, updated_at=now() where id=uid and account_status='active'; after_text := 'restricted';
    elsif action_name='member_unrestrict' then update public.users set account_status='active', restriction_category=null, restricted_until=null, updated_at=now() where id=uid and account_status='restricted'; after_text := 'active';
    elsif action_name='member_rename' then random_name := '회원'||lpad(floor(random()*100000)::int::text,5,'0'); update public.users set nickname=random_name, updated_at=now() where id=uid; after_text := random_name;
    else update public.users set role=case when role='STAFF' then 'USER' else 'STAFF' end, updated_at=now() where id=uid and role <> 'ADMIN' returning role into after_text; end if;
  elsif action_name='team_rename' then
    select name into resolved_name from public.teams where id=target_id::uuid for update; random_name := '팀'||lpad(floor(random()*100000)::int::text,5,'0');
    update public.teams set name=random_name, updated_at=now() where id=target_id::uuid; before_text := resolved_name; after_text := random_name;
  else raise exception '지원하지 않는 관리자 조치입니다.'; end if;

  insert into public.admin_action_logs(request_key, actor_id, actor_name, action, target_type, target_id, target_name, reason, memo, before_value, after_value, payload)
  values(idempotency_key, actor.id, coalesce(actor.nickname, actor.email), action_name, target_type, target_id, resolved_name, reason_category, action_memo, before_text, after_text, action_payload);
  if target_type='member' then
    insert into public.email_outbox(request_key,recipient_user_id,recipient_email,template,payload)
    select idempotency_key,id,email,'admin_action',jsonb_build_object('action',action_name,'reason',reason_category,'memo',action_memo) from public.users where id=target_id::uuid and email is not null;
  elsif target_type='survey' then
    insert into public.email_outbox(request_key,recipient_user_id,recipient_email,template,payload)
    select idempotency_key,u.id,u.email,'admin_action',jsonb_build_object('action',action_name,'survey',resolved_name,'reason',reason_category,'memo',action_memo) from public.surveys s join public.users u on u.id=s.creator_id where s.id=target_id::uuid and u.email is not null;
  elsif target_type='team' then
    insert into public.email_outbox(request_key,recipient_user_id,recipient_email,template,payload)
    select idempotency_key,u.id,u.email,'admin_action',jsonb_build_object('action',action_name,'team',resolved_name,'reason',reason_category,'memo',action_memo) from public.team_members tm join public.users u on u.id=tm.user_id where tm.team_id=target_id::uuid and u.email is not null;
  elsif target_type='response' then
    insert into public.email_outbox(request_key,recipient_user_id,recipient_email,template,payload)
    select idempotency_key,u.id,u.email,'admin_action',jsonb_build_object('action',action_name,'reason',reason_category,'memo',action_memo) from public.responses r join public.users u on u.id=r.respondent_id where r.id=target_id::uuid and u.email is not null;
  end if;
  return jsonb_build_object('ok', true, 'before', before_text, 'after', after_text);
end;
$$;

create or replace function public.admin_advance_reward(target_week text, idempotency_key text)
returns public.reward_weeks language plpgsql security definer set search_path = public as $$
declare current_week public.reward_weeks%rowtype; week_start timestamptz; week_end timestamptz;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if exists(select 1 from public.admin_action_logs where request_key=idempotency_key) then select * into current_week from public.reward_weeks where week=target_week; return current_week; end if;
  select * into current_week from public.reward_weeks where week=target_week for update;
  if not found then raise exception '정산 주차를 찾을 수 없습니다.'; end if;
  if current_week.step >= 5 then raise exception '이미 완료된 정산입니다.'; end if;
  update public.reward_weeks set step=step+1,
    locked_at=case when step=1 then now() else locked_at end,
    lottery_at=case when step=2 then now() else lottery_at end,
    finalized_at=case when step=3 then now() else finalized_at end
  where week=target_week returning * into current_week;
  if current_week.step=4 then
    week_start := to_date(target_week||'-1', 'IYYY-"W"IW-ID')::timestamp at time zone 'Asia/Seoul'; week_end := week_start + interval '7 days';
    insert into public.reward_winners(week, rank, user_id)
    select target_week, row_number() over(order by count(r.id) desc, min(r.created_at), u.id), u.id
    from public.users u join public.responses r on r.respondent_id=u.id and r.created_at>=week_start and r.created_at<week_end and not r.excluded
    where u.role='USER' and u.account_status='active' group by u.id order by count(r.id) desc, min(r.created_at), u.id limit 3
    on conflict (week,rank) do nothing;
  end if;
  insert into public.admin_action_logs(request_key,actor_id,actor_name,action,target_type,target_id,target_name,reason,memo,before_value,after_value)
  select idempotency_key,u.id,coalesce(u.nickname,u.email),'reward_advance','reward_week',target_week,target_week,'주차 정산 진행','단계 순차 완료',(current_week.step-1)::text,current_week.step::text from public.users u where u.id=auth.uid();
  return current_week;
end;
$$;

create or replace function public.admin_save_reward_notice(notice_title text, notice_body text, notice_tiers jsonb, reason_category text, action_memo text, idempotency_key text)
returns public.reward_notice language plpgsql security definer set search_path = public as $$
declare saved public.reward_notice%rowtype;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if trim(coalesce(action_memo,''))='' then raise exception '메모는 필수입니다.'; end if;
  if exists(select 1 from public.admin_action_logs where request_key=idempotency_key) then select * into saved from public.reward_notice where id=true; return saved; end if;
  insert into public.reward_notice(id,title,body,tiers,updated_at,updated_by) values(true,notice_title,notice_body,notice_tiers,now(),auth.uid())
  on conflict(id) do update set title=excluded.title,body=excluded.body,tiers=excluded.tiers,updated_at=now(),updated_by=auth.uid() returning * into saved;
  insert into public.admin_action_logs(request_key,actor_id,actor_name,action,target_type,target_id,target_name,reason,memo,after_value)
  select idempotency_key,u.id,coalesce(u.nickname,u.email),'reward_notice_update','reward_notice','default','보상 안내',reason_category,action_memo,notice_title from public.users u where u.id=auth.uid();
  return saved;
end;
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.admin_action_logs enable row level security;
alter table public.reward_weeks enable row level security;
alter table public.reward_winners enable row level security;
alter table public.reward_notice enable row level security;
alter table public.email_outbox enable row level security;

drop policy if exists "admins_read_all_users" on public.users;
drop policy if exists "admins_read_all_surveys" on public.surveys;
drop policy if exists "admins_read_all_responses" on public.responses;
drop policy if exists "admins_read_teams" on public.teams;
drop policy if exists "admins_read_team_members" on public.team_members;
drop policy if exists "admins_read_logs" on public.admin_action_logs;
drop policy if exists "admins_read_reward_weeks" on public.reward_weeks;
drop policy if exists "admins_read_reward_winners" on public.reward_winners;
drop policy if exists "admins_read_reward_notice" on public.reward_notice;
drop policy if exists "members_read_reward_notice" on public.reward_notice;
drop policy if exists "admins_read_email_outbox" on public.email_outbox;
create policy "admins_read_all_users" on public.users for select to authenticated using (public.is_admin());
create policy "admins_read_all_surveys" on public.surveys for select to authenticated using (public.is_admin());
create policy "admins_read_all_responses" on public.responses for select to authenticated using (public.is_admin());
create policy "admins_read_teams" on public.teams for select to authenticated using (public.is_admin());
create policy "admins_read_team_members" on public.team_members for select to authenticated using (public.is_admin());
create policy "admins_read_logs" on public.admin_action_logs for select to authenticated using (public.is_admin());
create policy "admins_read_reward_weeks" on public.reward_weeks for select to authenticated using (public.is_admin());
create policy "admins_read_reward_winners" on public.reward_winners for select to authenticated using (public.is_admin());
create policy "admins_read_reward_notice" on public.reward_notice for select to authenticated using (public.is_admin());
create policy "members_read_reward_notice" on public.reward_notice for select to authenticated using (true);
create policy "admins_read_email_outbox" on public.email_outbox for select to authenticated using (public.is_admin());

revoke all on function public.admin_get_summary() from public;
revoke all on function public.admin_get_leaderboard() from public;
revoke all on function public.admin_perform_action(text,text,text,text,text,jsonb,text) from public;
grant execute on function public.admin_get_summary() to authenticated;
grant execute on function public.admin_get_leaderboard() to authenticated;
grant execute on function public.admin_perform_action(text,text,text,text,text,jsonb,text) to authenticated;
revoke all on function public.admin_advance_reward(text,text) from public;
revoke all on function public.admin_save_reward_notice(text,text,jsonb,text,text,text) from public;
grant execute on function public.admin_advance_reward(text,text) to authenticated;
grant execute on function public.admin_save_reward_notice(text,text,jsonb,text,text,text) to authenticated;
revoke all on function public.refresh_my_restriction() from public;
grant execute on function public.refresh_my_restriction() to authenticated;
