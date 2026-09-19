alter table public.users enable row level security;
alter table public.surveys enable row level security;
alter table public.responses enable row level security;
alter table public.point_transactions enable row level security;

create policy "users_read_own" on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "users_update_own" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "active_surveys_are_readable" on public.surveys for select to authenticated using (status = 'active' or creator_id = (select auth.uid()));
create policy "creators_update_own_surveys" on public.surveys for update to authenticated using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy "respondents_read_own_responses" on public.responses for select to authenticated using (respondent_id = (select auth.uid()));
create policy "creators_read_survey_responses" on public.responses for select to authenticated using (exists (select 1 from public.surveys where surveys.id = responses.survey_id and surveys.creator_id = (select auth.uid())));
create policy "users_read_own_transactions" on public.point_transactions for select to authenticated using (user_id = (select auth.uid()));

revoke insert, delete on public.users from authenticated;
revoke update (point_balance, email, created_at) on public.users from authenticated;
grant update (name, age_group, region, interests, updated_at) on public.users to authenticated;
revoke insert, delete on public.surveys from authenticated;
revoke update (creator_id, response_count, reward_points, remaining_budget) on public.surveys from authenticated;
revoke insert, update, delete on public.responses from authenticated;
revoke insert, update, delete on public.point_transactions from authenticated;
