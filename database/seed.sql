-- Auth 사용자를 한 명 이상 만든 뒤 실행하세요.
do $$
declare
  seed_creator uuid;
begin
  select id into seed_creator from public.users order by created_at limit 1;
  if seed_creator is null then
    raise notice 'seed 생략: public.users에 사용자가 없습니다.';
    return;
  end if;

  if not exists (select 1 from public.surveys where title = '더 나은 캠퍼스 라이프를 위한 설문') then
    insert into public.surveys (creator_id, title, description, category, questions, audience, target_count, response_count, reward_points, remaining_budget, estimated_minutes)
    values (seed_creator, '더 나은 캠퍼스 라이프를 위한 설문', '대학생의 공간 이용과 생활 습관을 알아봅니다.', '교육', '[{"id":"q1","type":"single","title":"캠퍼스에서 가장 자주 이용하는 공간은?","options":["도서관","학생회관","카페","강의실"]},{"id":"q2","type":"scale","title":"현재 캠퍼스 생활에 얼마나 만족하나요?","min":1,"max":5},{"id":"q3","type":"text","title":"가장 개선되었으면 하는 점을 알려주세요."}]'::jsonb, '{"age_groups":["10대","20대"]}'::jsonb, 120, 0, 320, 38400, 4);
  end if;
end $$;
