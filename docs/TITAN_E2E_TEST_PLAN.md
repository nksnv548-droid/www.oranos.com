# ORANOS Titan End-to-End Test Plan
Branch: oranos-platform-v1
Backend: Supabase project pbohqygrzesddmgmrfma
Scope: www.oranos.com only. Never use Oternal's separate backend.

## Test safety
- Use dedicated test accounts and synthetic test evidence.
- Do not create fake real-world achievements or issue a real Titan Pass during smoke checks.
- Finalize/cleanup tests only with disposable test applications.
- Do not merge to main during testing.
- Human review remains final; browser integrity signals are flags, not proof of cheating.

## A. Public website and navigation
- [ ] Home loads with no console errors; hero/statue asset resolves.
- [ ] Header/footer links route to Home, Community, Oternal, Titan, My ORANOS.
- [ ] Community page text, spelling, responsive layout, CTAs.
- [ ] Titan Pass explanation accurately says earned after human review.
- [ ] Mobile widths 360, 390, 430; tablet and desktop layout.
- [ ] Keyboard focus, reduced motion, contrast and link destinations.

## B. Auth and application
- [ ] New test user signup and email-confirmation path.
- [ ] Sign in, sign out, refresh session, expired session.
- [ ] User A cannot read User B profile/application/session/submission/check-ins/pass.
- [ ] Apply creates one application and initializes expected pillar states.
- [ ] Duplicate apply/active attempt handled without duplicate active records.

## C. Fitness capture
- [ ] Camera denied, unavailable, permission granted, stop/start and upload failure.
- [ ] Video upload succeeds; submission insert failure removes uploaded orphan.
- [ ] Submission is bound to matching application/session/user.
- [ ] Session moves active → under_review after submission.
- [ ] 5 challenge IDs are unique; approval count only increments on approved evidence.
- [ ] Run: permission denied, poor GPS accuracy, interrupted tracking, under-distance, over-time, valid 2 km under 14 min.
- [ ] Integrity flags are visible to reviewer and do not auto-decide outcome.

## D. Seven-day execution
- [ ] Fitness approval gates seven-day stage.
- [ ] All 3 pillars required per day.
- [ ] Server date/timezone drives check-in; client-supplied date cannot bypass.
- [ ] Duplicate same-day pillar check-in rejected.
- [ ] Day N+1 remains locked until next server calendar day.
- [ ] Missed calendar day transitions attempt to reattempt; restart creates a fresh attempt.
- [ ] Partial check-in does not count as a completed day.
- [ ] Check-in evidence and status render correctly in dashboard/admin.

## E. Declaration, review and pass
- [ ] Declaration requires active eligible application and video.
- [ ] Admin-only review actions enforced by RLS/RPC.
- [ ] Pass blocked unless 5 unique fitness approvals + 7 consecutive complete days + approved declaration.
- [ ] Fail finalization requires reviewed rejection/reattempt evidence.
- [ ] Double finalization is blocked; only one outcome/pass.
- [ ] Titan Pass appears only for passed application and correct user.
- [ ] Finalization cleanup removes only evidence belonging to that application.
- [ ] Cleanup failure is recorded and surfaced to admin; no false “purged” success.

## F. Security / backend
- [ ] Anonymous cannot execute protected Titan RPCs or access private video objects.
- [ ] Authenticated RPC ownership checks enforced; admin-only finalization/validation.
- [ ] Storage path is user-scoped; cross-user read/delete denied.
- [ ] Verify old titan-finalize is unused before deprecation; current frontend calls titan-finalize-v2.
- [ ] Re-run Supabase security/performance advisors after fixes.

## Exit criteria
- All critical user journey checks pass with two separate test users and one admin.
- No cross-user access, duplicate pass, skipped-day bypass, or unrelated evidence deletion.
- Record actual browser/device, account role, expected result, actual result, and defect for every failed test.
- Do not label E2E complete until browser/device tests are executed and results recorded.
