-- ORANOS Phase 03: Titan submission ownership and atomic admin review hardening.
-- Keep all changes in source control. Apply to the shared/production Supabase project only
-- after explicit release approval.

-- is_admin() is intentionally callable only by authenticated clients that need the
-- boolean authorization check (AdminReviewDesk and RLS policies). It never exposes role data.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Prevent cross-user application/session/submission references through the Data API.
drop policy if exists applications_own_or_admin on public.titan_applications;
create policy applications_own_or_admin
  on public.titan_applications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists applications_insert_own_authenticated on public.titan_applications;
create policy applications_insert_own_authenticated
  on public.titan_applications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists applications_update_admin on public.titan_applications;
create policy applications_update_admin
  on public.titan_applications
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists sessions_own_or_admin on public.titan_sessions;
create policy sessions_own_or_admin
  on public.titan_sessions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists sessions_insert_own on public.titan_sessions;
create policy sessions_insert_own
  on public.titan_sessions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.titan_applications a
      where a.id = application_id
        and a.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.titan_challenges c
      where c.id = challenge_id
        and c.active = true
    )
  );

drop policy if exists sessions_update_own_active_to_review_or_admin on public.titan_sessions;
create policy sessions_update_own_active_to_review_or_admin
  on public.titan_sessions
  for update
  to authenticated
  using (
    (
      user_id = (select auth.uid())
      and status = any (array['active','submitted'])
      and exists (
        select 1
        from public.titan_applications a
        where a.id = application_id
          and a.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  )
  with check (
    (
      user_id = (select auth.uid())
      and status = any (array['active','submitted','under_review'])
      and exists (
        select 1
        from public.titan_applications a
        where a.id = application_id
          and a.user_id = (select auth.uid())
      )
    )
    or (select public.is_admin())
  );

drop policy if exists submissions_read_own_or_admin on public.titan_submissions;
create policy submissions_read_own_or_admin
  on public.titan_submissions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists submissions_insert_own_authenticated on public.titan_submissions;
create policy submissions_insert_own_authenticated
  on public.titan_submissions
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.titan_applications a
      where a.id = application_id
        and a.user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.titan_sessions s
      where s.id = session_id
        and s.user_id = (select auth.uid())
        and s.application_id = application_id
        and s.challenge_id = challenge_id
    )
  );

drop policy if exists submissions_update_admin on public.titan_submissions;
create policy submissions_update_admin
  on public.titan_submissions
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists reviews_admin_only on public.titan_reviews;
create policy reviews_admin_only
  on public.titan_reviews
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists passes_own_or_admin on public.titan_passes;
create policy passes_own_or_admin
  on public.titan_passes
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists passes_admin_write on public.titan_passes;
create policy passes_admin_write
  on public.titan_passes
  for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists passes_admin_update on public.titan_passes;
create policy passes_admin_update
  on public.titan_passes
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- One RPC makes a review decision and its audit row one database transaction.
-- The row lock prevents two admins from deciding the same evidence item concurrently.
create or replace function public.titan_review_submission(
  p_submission_id uuid,
  p_decision text,
  p_reviewer_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_submission public.titan_submissions%rowtype;
  v_reviewer uuid;
begin
  v_reviewer := auth.uid();

  if v_reviewer is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_decision not in ('approved','reattempt','rejected') then
    raise exception 'Invalid review decision';
  end if;

  select *
  into v_submission
  from public.titan_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found';
  end if;

  if v_submission.status <> 'under_review' then
    raise exception 'Submission has already been reviewed';
  end if;

  update public.titan_submissions
  set
    status = p_decision,
    reviewer_notes = p_reviewer_notes,
    reviewed_by = v_reviewer,
    reviewed_at = now()
  where id = p_submission_id;

  insert into public.titan_reviews(
    submission_id,
    reviewer_id,
    decision,
    notes
  )
  values (
    p_submission_id,
    v_reviewer,
    p_decision,
    p_reviewer_notes
  );

  update public.titan_sessions
  set
    status = p_decision,
    ended_at = coalesce(ended_at, now())
  where id = v_submission.session_id;

  return jsonb_build_object(
    'ok', true,
    'submission_id', p_submission_id,
    'decision', p_decision,
    'session_id', v_submission.session_id,
    'titan_pass_issued', false
  );
end;
$function$;

revoke all on function public.titan_review_submission(uuid,text,text) from public, anon;
grant execute on function public.titan_review_submission(uuid,text,text) to authenticated;
