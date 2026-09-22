-- A deadline includes its entire Asia/Seoul calendar day. Keep the existing RPC
-- signatures so clients can continue to call them without a coordinated release.

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
  if requested_deadline is null or requested_deadline < (now() at time zone 'Asia/Seoul')::date then
    raise exception '마감일은 오늘 또는 이후 날짜로 설정해주세요.';
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
  if jsonb_typeof(submitted_answers) <> 'object' then
    raise exception '응답 형식이 올바르지 않습니다.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(target_survey.questions) as question
    where question->>'type' = 'text'
      and jsonb_typeof(submitted_answers->(question->>'id')) = 'string'
      and length(submitted_answers->>(question->>'id')) > 100
  ) then
    raise exception '단답형 답변은 최대 100자까지 입력할 수 있습니다.';
  end if;

  insert into public.responses (survey_id, respondent_id, answers, reward_points)
  values (target_survey_id, current_user_id, submitted_answers, 0)
  returning id into new_response_id;
  update public.surveys set response_count = response_count + 1, updated_at = now() where id = target_survey_id;
  return jsonb_build_object('response_id', new_response_id);
end;
$$;
