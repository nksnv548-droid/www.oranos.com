-- ORANOS Titan Challenge review and approval only.
-- Titan Pass ID allocation, physical card production, QR credentials and delivery
-- are intentionally handled manually by the ORANOS team.
-- Preserve the existing finalize RPC signature; record outcome without issuing a pass.

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
  v_admin boolean;
  v_app public.titan_applications%rowtype;
  v_ready jsonb;
  v_outcome_id uuid;
begin
  select public.is_admin() into v_admin;
  if not coalesce(v_admin,false) then raise exception 'Admin access required'; end if;
  if p_outcome not in ('passed','failed') then raise exception 'Invalid final outcome'; end if;

  select * into v_app from public.titan_applications
  where id=p_application_id for update;
  if not found then raise exception 'Application not found'; end if;
  if v_app.status in ('passed','failed','rejected') then
    raise exception 'Application already finalized';
  end if;

  v_ready := public.titan_validate_completion(p_application_id);
  if p_outcome='passed' and coalesce((v_ready->>'ready')::boolean,false)=false then
    raise exception 'Pass criteria not satisfied';
  end if;

  if p_outcome='failed' and not exists(
    select 1 from public.titan_submissions
    where application_id=p_application_id and status in ('rejected','reattempt')
  ) and not exists(
    select 1 from public.titan_declarations
    where application_id=p_application_id and status in ('rejected','reattempt')
  ) then
    raise exception 'A reviewed failure or reattempt is required before final failure';
  end if;

  if exists(select 1 from public.titan_outcomes where application_id=p_application_id) then
    raise exception 'Outcome already recorded';
  end if;

  insert into public.titan_outcomes(
    user_id,application_id,outcome,titan_id,reviewer_id,finalized_by,
    reviewer_notes,cleanup_status
  ) values (
    v_app.user_id,p_application_id,p_outcome,null,auth.uid(),auth.uid(),
    p_reviewer_notes,'pending'
  ) returning id into v_outcome_id;

  update public.titan_applications
  set status=p_outcome, completed_at=now()
  where id=p_application_id;

  return jsonb_build_object(
    'ok',true,'outcome_id',v_outcome_id,'outcome',p_outcome,
    'titan_pass_issued',false,
    'manual_issuance_required',p_outcome='passed',
    'cleanup_required',true
  );
end;
$function$;

revoke all on function public.titan_finalize_outcome(uuid,text,text) from public, anon;
grant execute on function public.titan_finalize_outcome(uuid,text,text) to authenticated;
