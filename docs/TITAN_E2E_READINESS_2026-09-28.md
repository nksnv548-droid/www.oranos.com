# Titan E2E Readiness Check — 2026-09-28

Target: www.oranos.com / branch oranos-platform-v1
Supabase: pbohqygrzesddmgmrfma
No production/main branch changes.

## Automated/static checks completed
- [x] App config points to the dedicated www.oranos.com Supabase project.
- [x] Community route is present.
- [x] Daily execution calls submit_titan_daily_checkin RPC.
- [x] Missed-day transition uses server-side titan_mark_missed_attempt RPC, not a client-side application status update.
- [x] Finalization invokes titan-finalize-v2.
- [x] Removed client-side Titan Pass issuance from both duplicate admin review definitions; Pass/outcome is server-finalized only.
- [x] Added idempotent same-calendar-day retry behavior for daily check-ins so a partial three-pillar submit can resume without duplicate-row failure.
- [x] Session owner status transition policy supports active/submitted → under_review.
- [x] Supabase project reports ACTIVE_HEALTHY.
- [x] Titan tables have RLS enabled (verified in project table inventory).

## Not executed / blocked
- [ ] Real signup/sign-in with two distinct test accounts.
- [ ] Browser camera/microphone permission and recording.
- [ ] Real phone GPS run, permission denial, interruption and accuracy cases.
- [ ] Admin account review and end-to-end finalization/cleanup with disposable evidence.
- [ ] Device-width, console/network, and accessibility checks.

These require live browser/device interaction and dedicated test identities. No real Titan Pass or user evidence was created during this readiness pass.

## Known advisor notices
- Security advisor flags four intentionally authenticated SECURITY DEFINER RPCs: submit_titan_daily_checkin, titan_checkin_state, titan_mark_missed_attempt, titan_restart_attempt. They are callable by authenticated users by design and include ownership/eligibility checks; admin finalization/validation remain non-executable by authenticated users.
- Performance advisor reports RLS initplan warnings and unused-index notices. Unused indexes are expected on a near-empty test database; do not drop blindly before workload exists.

## Current gate
Static/readiness checks: passed.
Full browser E2E: NOT RUN.
Do not claim production-ready until the unchecked browser/device cases pass.
