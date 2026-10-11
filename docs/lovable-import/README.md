# Lovable frontend import — staging branch

Branch: `oranos-lovable-frontend-dev-20261011`

This branch was created from `oranos-production-source-dev-20260929`. Production `main` has not been changed.

## Import note

The Lovable ZIP supplied for this work is a Vite + React + TypeScript project. The existing ORANOS repository has a Next.js application architecture. Do not overwrite the existing repository root with the Vite project blindly: that would replace the framework/configuration and could break existing routes, auth, Titan flows, and Vercel settings.

Recommended safe integration:
1. Keep this branch isolated from `main`.
2. Import the Lovable frontend source into a separate folder or deliberately migrate page-by-page into the existing Next.js app.
3. Preserve the supplied ORANOS assets and verify OTERNAL/ORANOS asset separation.
4. Keep backend integration disabled until the frontend has been reviewed.
5. Run install, lint/typecheck, production build, and route-by-route preview checks.
6. Create a preview deployment only after the actual source has been committed to this branch.
7. Do not merge to `main` or change the production domain without explicit approval.

## Current status

The branch is a safe staging branch. The complete uploaded ZIP has not yet been transferred into the GitHub repository by this connector, because its file-creation API supports UTF-8 text files and does not accept a local ZIP attachment as a binary upload. The project ZIP remains available in the current ChatGPT conversation for transfer through GitHub's web upload/commit workflow or another supported binary upload path.
