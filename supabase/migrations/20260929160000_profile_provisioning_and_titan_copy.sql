-- Prepared for review only; do not apply to the connected database without approval.
-- Auth signup needs profile provisioning before titan_applications.user_id can satisfy its FK.
create or replace function public.handle_new_user_profile() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles (id,full_name,role) values (new.id,nullif(trim(new.raw_user_meta_data ->> 'full_name'),''),'user') on conflict (id) do update set full_name=coalesce(public.profiles.full_name,excluded.full_name); return new; end; $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute procedure public.handle_new_user_profile();
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id=auth.uid() and role='user');
update public.titan_challenges set description='10 strict pull-ups' where slug='pullups';
update public.titan_challenges set description='100 bodyweight squats' where slug='squats';
