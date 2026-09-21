-- Uni-Form MVP policy contract (2026-09-21)
-- Existing legacy columns are retained for compatibility, but are no longer part of the app contract.

alter table public.users add column if not exists nickname text;
alter table public.users add column if not exists grade text;
alter table public.users add column if not exists major text;
alter table public.users add column if not exists enrollment_status text;

update public.surveys
set deadline = ((now() at time zone 'Asia/Seoul')::date + 30)
where deadline is null;

update public.surveys set target_count = greatest(1, least(target_count, 100));
update public.surveys set status = 'closed' where status not in ('draft', 'active', 'closed', 'archived');

alter table public.surveys alter column deadline set not null;
alter table public.surveys drop constraint if exists surveys_target_count_check;
alter table public.surveys add constraint surveys_target_count_check check (target_count between 1 and 100);
alter table public.surveys drop constraint if exists surveys_status_check;
alter table public.surveys add constraint surveys_status_check check (status in ('draft', 'active', 'closed', 'archived'));

create or replace function public.prevent_survey_reopen()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status in ('closed', 'archived') and new.status = 'active' then
    raise exception '마감하거나 보관한 설문은 다시 열 수 없습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_survey_reopen_trigger on public.surveys;
create trigger prevent_survey_reopen_trigger before update of status on public.surveys
for each row execute function public.prevent_survey_reopen();

create or replace function public.create_survey(survey_payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  current_user_id uuid := auth.uid();
  new_id uuid;
  requested_status text := coalesce(survey_payload->>'status', 'active');
  requested_target integer := coalesce((survey_payload->>'target_count')::integer, 50);
  requested_deadline date := (survey_payload->>'deadline')::date;
begin
  if current_user_id is null then raise exception '로그인이 필요합니다.'; end if;
  if requested_status not in ('draft', 'active') then raise exception '올바르지 않은 설문 상태입니다.'; end if;
  if requested_target not between 1 and 100 then raise exception '목표 인원은 1명 이상 100명 이하입니다.'; end if;
  if requested_deadline is null or requested_deadline <= (now() at time zone 'Asia/Seoul')::date then
    raise exception '마감일은 오늘 이후 날짜여야 합니다.';
  end if;
  if length(trim(coalesce(survey_payload->>'title', ''))) < 3 then raise exception '설문 제목을 확인해주세요.'; end if;

  insert into public.surveys (
    creator_id, title, description, category, target_count, estimated_minutes,
    deadline, questions, status, response_count, reward_points, remaining_budget
  ) values (
    current_user_id, survey_payload->>'title', coalesce(survey_payload->>'description', ''),
    coalesce(survey_payload->>'category', '일반'), requested_target,
    greatest(1, coalesce((survey_payload->>'estimated_minutes')::integer, 5)),
    requested_deadline, coalesce(survey_payload->'questions', '[]'::jsonb), requested_status,
    0, 0, 0
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.submit_survey_response(target_survey_id uuid, submitted_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  current_user_id uuid := auth.uid();
  target_survey public.surveys%rowtype;
  new_response_id uuid;
begin
  if current_user_id is null then raise exception '로그인이 필요합니다.'; end if;
  select * into target_survey from public.surveys where id = target_survey_id for update;
  if not found then raise exception '설문을 찾을 수 없습니다.'; end if;
  if target_survey.creator_id = current_user_id then raise exception '본인 설문에는 응답할 수 없습니다.'; end if;
  if target_survey.status <> 'active' or target_survey.deadline < (now() at time zone 'Asia/Seoul')::date then
    raise exception '마감된 설문입니다.';
  end if;
  if exists (select 1 from public.responses where survey_id = target_survey_id and respondent_id = current_user_id) then
    raise exception '이미 응답을 완료한 설문입니다.';
  end if;

  insert into public.responses (survey_id, respondent_id, answers, reward_points)
  values (target_survey_id, current_user_id, submitted_answers, 0)
  returning id into new_response_id;
  update public.surveys set response_count = response_count + 1, updated_at = now() where id = target_survey_id;
  return jsonb_build_object('response_id', new_response_id);
end;
$$;

create or replace function public.delete_draft_survey(target_survey_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  delete from public.surveys
  where id = target_survey_id and creator_id = auth.uid() and status = 'draft' and response_count = 0;
  if not found then raise exception '임시저장 상태이며 응답이 없는 설문만 삭제할 수 있습니다.'; end if;
end;
$$;

create or replace function public.close_survey(target_survey_id uuid)
returns public.surveys language plpgsql security definer set search_path = public as $$
declare closed_survey public.surveys%rowtype;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다.'; end if;
  update public.surveys set status = 'closed', updated_at = now()
  where id = target_survey_id and creator_id = auth.uid() and status = 'active'
  returning * into closed_survey;
  if not found then raise exception '모집 중인 본인 설문만 마감할 수 있습니다.'; end if;
  return closed_survey;
end;
$$;

revoke all on function public.create_survey(jsonb) from public;
revoke all on function public.submit_survey_response(uuid, jsonb) from public;
revoke all on function public.delete_draft_survey(uuid) from public;
revoke all on function public.close_survey(uuid) from public;
grant execute on function public.create_survey(jsonb) to authenticated;
grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;
grant execute on function public.delete_draft_survey(uuid) to authenticated;
grant execute on function public.close_survey(uuid) to authenticated;

revoke insert, update, delete on public.surveys from authenticated;
revoke update on public.users from authenticated;
grant update (nickname, gender, grade, major, enrollment_status, updated_at) on public.users to authenticated;
