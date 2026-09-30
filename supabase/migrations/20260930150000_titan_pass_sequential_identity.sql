-- ORANOS Titan Pass identity foundation.
-- Canonical permanent IDs: TITAN000001, TITAN000002, ...
-- QR credentials are opaque random tokens; only a digest is stored.
-- QR token generation and verification endpoint are a later implementation step.

create sequence if not exists public.titan_pass_number_seq
  as bigint start with 1 increment by 1 minvalue 1 maxvalue 999999 no cycle;

do $$
declare v_max bigint;
begin
  select max(substring(titan_id from '^TITAN([0-9]{6})$')::bigint)
    into v_max
  from public.titan_passes;
  if v_max is not null and v_max >= 1 then
    perform setval('public.titan_pass_number_seq', v_max, true);
  else
    perform setval('public.titan_pass_number_seq', 1, false);
  end if;
end
$$;

alter table public.titan_passes
  add column if not exists qr_token_hash text,
  add column if not exists qr_issued_at timestamptz,
  add column if not exists qr_revoked_at timestamptz;

create unique index if not exists titan_passes_qr_token_hash_key
  on public.titan_passes(qr_token_hash)
  where qr_token_hash is not null;

alter table public.titan_passes
  drop constraint if exists titan_passes_titan_id_format_check;
alter table public.titan_passes
  add constraint titan_passes_titan_id_format_check
  check (titan_id ~ '^TITAN[0-9]{6}$');

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
  v_titan_id text;
  v_outcome_id uuid;
  v_next_number bigint;
begin
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
    into v_admin;
  if not v_admin then raise exception 'Admin access required'; end if;
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

  if p_outcome='failed'
    and not exists(select 1 from public.titan_submissions where application_id=p_application_id and status in ('rejected','reattempt'))
    and not exists(select 1 from public.titan_declarations where application_id=p_application_id and status in ('rejected','reattempt')) then
    raise exception 'A reviewed failure or reattempt is required before final failure';
  end if;

  if exists(select 1 from public.titan_outcomes where application_id=p_application_id) then
    raise exception 'Outcome already recorded';
  end if;

  if p_outcome='passed' then
    v_next_number := nextval('public.titan_pass_number_seq');
    if v_next_number > 999999 then raise exception 'Titan ID capacity reached'; end if;
    v_titan_id := 'TITAN' || lpad(v_next_number::text,6,'0');
  end if;

  insert into public.titan_outcomes(
    user_id,application_id,outcome,titan_id,reviewer_id,finalized_by,reviewer_notes,cleanup_status
  ) values (
    v_app.user_id,p_application_id,p_outcome,v_titan_id,auth.uid(),auth.uid(),p_reviewer_notes,'pending'
  ) returning id into v_outcome_id;

  if p_outcome='passed' then
    insert into public.titan_passes(user_id,application_id,titan_id,status)
    values(v_app.user_id,p_application_id,v_titan_id,'active');
  end if;

  update public.titan_applications set status=p_outcome,completed_at=now()
  where id=p_application_id;

  return jsonb_build_object('ok',true,'outcome_id',v_outcome_id,'outcome',p_outcome,
    'titan_id',v_titan_id,'cleanup_required',true);
end;
$function$;

revoke all on function public.titan_finalize_outcome(uuid,text,text) from public, anon;
grant execute on function public.titan_finalize_outcome(uuid,text,text) to authenticated;
