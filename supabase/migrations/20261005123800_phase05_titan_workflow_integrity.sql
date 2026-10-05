-- ORANOS Phase 05: Titan workflow integrity.
-- Source-controlled migration only. Do not apply to production without release approval.

-- Member check-ins: members may write only their own application records.
drop policy if exists titan_daily_checkins_select_own on public.titan_daily_checkins;
create policy titan_daily_checkins_select_own
  on public.titan_daily_checkins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists titan_daily_checkins_insert_own on public.titan_daily_checkins;
create policy titan_daily_checkins_insert_own
  on public.titan_daily_checkins for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.titan_applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
    and day_number between 1 and 7
    and pillar_code in ('FITNESS','MINDSET','LIFESTYLE')
  );

drop policy if exists titan_daily_checkins_update_own on public.titan_daily_checkins;
create policy titan_daily_checkins_update_own
  on public.titan_daily_checkins for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.titan_applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.titan_applications a
      where a.id = application_id and a.user_id = (select auth.uid())
    )
    and day_number between 1 and 7
    and pillar_code in ('FITNESS','MINDSET','LIFESTYLE')
    and reviewer_status = 'submitted'
  );

drop policy if exists titan_daily_checkins_admin_review on public.titan_daily_checkins;
create policy titan_daily_checkins_admin_review
  on public.titan_daily_checkins for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- The completion validator is intentionally read-only and safe for both member
-- status views and admin finalization.
create or replace function public.titan_validate_completion(p_application_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_app public.titan_applications%rowtype;
  v_fitness_count integer;
  v_days jsonb;
  v_day_count integer;
  v_first_date date;
  v_last_date date;
  v_decl boolean;
  v_ready boolean;
begin
  select * into v_app
  from public.titan_applications
  where id = p_application_id
    and (user_id = auth.uid() or public.is_admin());

  if not found then
    raise exception 'Not authorized';
  end if;

  select count(distinct s.challenge_id)
    into v_fitness_count
  from public.titan_submissions s
  where s.application_id = p_application_id
    and s.status = 'approved';

  select count(*) into v_day_count
  from (
    select day_number, min(checkin_date) as checkin_date
    from public.titan_daily_checkins
    where application_id = p_application_id
      and completed = true
      and reviewer_status in ('submitted','accepted')
    group by day_number
    having count(distinct pillar_code) = 3
  ) d
  where day_number between 1 and 7;

  select min(checkin_date), max(checkin_date)
    into v_first_date, v_last_date
  from (
    select day_number, min(checkin_date) as checkin_date
    from public.titan_daily_checkins
    where application_id = p_application_id
      and completed = true
      and reviewer_status in ('submitted','accepted')
    group by day_number
    having count(distinct pillar_code) = 3
  ) ordered_days
  where day_number between 1 and 7;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'day', day_number,
        'date', checkin_date,
        'pillars', pillar_count
      ) order by day_number
    ), '[]'::jsonb
  )
  into v_days
  from (
    select day_number, min(checkin_date) as checkin_date,
           count(distinct pillar_code) as pillar_count
    from public.titan_daily_checkins
    where application_id = p_application_id
      and completed = true
      and reviewer_status in ('submitted','accepted')
    group by day_number
    having count(distinct pillar_code) = 3
  ) d
  where day_number between 1 and 7;

  select exists (
    select 1 from public.titan_declarations
    where application_id = p_application_id
      and status = 'approved'
  ) into v_decl;

  v_ready :=
    v_fitness_count >= 5
    and v_day_count = 7
    and v_first_date is not null
    and v_last_date = v_first_date + 6
    and v_decl;

  return jsonb_build_object(
    'fitness_approved', v_fitness_count,
    'fitness_required', 5,
    'seven_days', jsonb_array_length(v_days),
    'days_required', 7,
    'declaration', v_decl,
    'ready', v_ready
  );
end;
$function$;

revoke all on function public.titan_validate_completion(uuid) from public, anon;
grant execute on function public.titan_validate_completion(uuid) to authenticated;

-- Finalization must never allocate a Titan Pass. Pass identity remains a manual
-- ORANOS team operation after a passed outcome.
create or replace function public.titan_finalize_outcome(
  p_application_id uuid,
  p_outcome text,
  p_reviewer_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_app public.titan_applications%rowtype;
  v_ready jsonb;
  v_outcome_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_outcome not in ('passed','failed') then raise exception 'Invalid final outcome'; end if;

  select * into v_app
  from public.titan_applications
  where id = p_application_id
  for update;

  if not found then raise exception 'Application not found'; end if;
  if v_app.status in ('passed','failed','rejected') then
    raise exception 'Application already finalized';
  end if;

  v_ready := public.titan_validate_completion(p_application_id);

  if p_outcome = 'passed'
     and coalesce((v_ready->>'ready')::boolean, false) = false then
    raise exception 'Pass criteria not satisfied: %', v_ready;
  end if;

  if p_outcome = 'failed'
     and not exists (
       select 1 from public.titan_submissions
       where application_id = p_application_id
         and status in ('rejected','reattempt')
     )
     and not exists (
       select 1 from public.titan_declarations
       where application_id = p_application_id
         and status in ('rejected','reattempt')
     ) then
    raise exception 'A reviewed failure or reattempt is required before final failure';
  end if;

  if exists (
    select 1 from public.titan_outcomes
    where application_id = p_application_id
  ) then
    raise exception 'Outcome already recorded';
  end if;

  insert into public.titan_outcomes(
    user_id, application_id, outcome, titan_id, reviewer_id, finalized_by,
    reviewer_notes, cleanup_status
  ) values (
    v_app.user_id, p_application_id, p_outcome, null, auth.uid(), auth.uid(),
    p_reviewer_notes, 'pending'
  ) returning id into v_outcome_id;

  update public.titan_applications
  set status = p_outcome, completed_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'ok', true,
    'outcome_id', v_outcome_id,
    'outcome', p_outcome,
    'titan_pass_issued', false,
    'manual_issuance_required', p_outcome = 'passed'
  );
end;
$function$;

revoke all on function public.titan_finalize_outcome(uuid,text,text) from public, anon;
grant execute on function public.titan_finalize_outcome(uuid,text,text) to authenticated;
