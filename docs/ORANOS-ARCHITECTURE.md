# ORANOS Architecture — Phase 0/1

## Product hierarchy
ORANOS is the parent ecosystem. OTERNAL, Titan Challenge, and Community are primary public experiences. My ORANOS is the authenticated member environment. Admin is the operational environment.

## Public routes
- /
- /about
- /pillars
- /oternal
- /titan-challenge
- /journey
- /community

## Member routes
- /sign-in
- /reset-password
- /account
- /oternal/launch

## Operations
- /admin

## Canonical content ownership
- ORANOS overview → /
- ORANOS vision → /about
- Four pillars → /pillars
- OTERNAL product information → /oternal
- Titan product information and challenge entry → /titan-challenge
- ORANOS journey → /journey
- Community information → /community
- Authenticated member progress → /account
- Titan review operations → /admin

## Core journeys
Home → OTERNAL → /oternal → Enter OTERNAL → /oternal/launch → authentication when required → external OTERNAL application.
Home → Titan → /titan-challenge → Begin Challenge → authentication when required → My ORANOS → Titan workflow.
Home → Community → /community → Join / Enter → authentication when required → member environment.

## Migration strategy
The existing legacy HTML surfaces remain available during migration. New canonical routes are introduced first, then legacy links are redirected or retired only after route and functional verification.

Production remains untouched. All implementation work is performed on the development branch and validated through Vercel Preview.