-- ORANOS Titan Pass sequential ID and QR credential foundation.
-- Canonical ID format: TITAN000001.
create sequence if not exists public.titan_pass_number_seq as bigint start with 1 increment by 1 minvalue 1 maxvalue 999999 no cycle;
alter table public.titan_passes add column if not exists qr_token_hash text, add column if not exists qr_issued_at timestamptz, add column if not exists qr_revoked_at timestamptz;
create unique index if not exists titan_passes_qr_token_hash_key on public.titan_passes(qr_token_hash) where qr_token_hash is not null;
alter table public.titan_passes drop constraint if exists titan_passes_titan_id_format_check;
alter table public.titan_passes add constraint titan_passes_titan_id_format_check check (titan_id ~ '^TITAN[0-9]{6}$');
