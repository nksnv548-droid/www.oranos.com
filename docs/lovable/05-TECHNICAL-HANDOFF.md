# ORANOS — LOVABLE TECHNICAL HANDOFF

## Phase 1 — visual build
Build the new experience in Lovable using realistic mock data.

Preferred prototype stack:
- React
- Tailwind CSS or equivalent component styling
- responsive web UI
- mock/local data only

Do not connect the prototype to production ORANOS Supabase.

## Phase 2 — GitHub handoff
Lovable build → visual review → GitHub sync/export → integration branch → connect existing ORANOS architecture → QA → release review.

Lovable supports GitHub synchronization and portable code ownership/export. Use GitHub as the version-control handoff rather than treating the Lovable preview as the final production source.

## Existing production logic that must survive integration
- Next.js application
- Supabase
- Supabase Auth
- Titan Challenge workflow
- Titan evidence storage/review
- manual Titan Pass issuance
- My ORANOS member data
- Admin Review Desk
- separate OTERNAL application gateway

## Integration principles
1. Treat Lovable output as a frontend candidate.
2. Do not overwrite the existing repository wholesale.
3. Extract the best layouts/components/styles.
4. Preserve business logic.
5. Preserve route/security boundaries.
6. Reconnect Supabase only after visual architecture approval.
7. Keep production untouched during migration.

## Authentication
OTERNAL: /oternal/launch → unauthenticated → /sign-in?next=/oternal/launch → successful auth → /oternal/launch → external OTERNAL app.
Titan should preserve its intended destination similarly.
Do not allow arbitrary external next URLs.

## Titan business rules
7 days.
5 physical standards.
3 daily pillars.
Current day writable.
Future days locked.
Previous days read-only.
Seven-day sequence enforced.
Titan Pass manually issued by ORANOS.

## Security
Never place service-role credentials in frontend code.
Do not use user-editable metadata for authorization.
RLS and backend authorization remain the source of truth.