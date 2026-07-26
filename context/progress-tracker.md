# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 05: Prisma Setup — complete

## Current Goal
- Feature 06 (TBD)

## Completed

- Feature 01: Design System — shadcn/ui installed and configured for Tailwind v4, dark-only theme tokens in globals.css, Button/Card/Dialog/Input/Tabs/Textarea/ScrollArea components added to components/ui/, lucide-react installed, lib/utils.ts cn() helper in place. TypeScript compiles clean.
- Feature 02: Editor Chrome — EditorNavbar (fixed top bar with PanelLeftOpen/PanelLeftClose toggle) and ProjectSidebar (fixed overlay, slides from left, Projects title + close button, My Projects/Shared tabs with empty states, New Project button) added to components/editor/. Dialog pattern confirmed ready via existing components/ui/dialog.tsx. TypeScript and ESLint clean.
- Feature 03: Auth — @clerk/ui installed. ClerkProvider wraps root layout with dark theme from @clerk/ui/themes, overriding appearance variables using CSS tokens (no hardcoded colors). proxy.ts at project root uses clerkMiddleware + createRouteMatcher to protect all routes except /sign-in and /sign-up (resolved from NEXT_PUBLIC_CLERK_SIGN_IN_URL / NEXT_PUBLIC_CLERK_SIGN_UP_URL env vars). Sign-in and sign-up pages use a minimal two-panel layout (left panel with logo/tagline/feature list hidden on mobile, right panel with centered Clerk form). app/page.tsx redirects authenticated users to /editor and unauthenticated users to /sign-in. UserButton added to EditorNavbar right section. app/editor/page.tsx shell created with sidebar state management.
- Feature 04: Project Dialogs — hooks/use-project-dialogs.ts manages dialog/form/loading state and mock project data (CRUD operations on local state). components/editor/project-dialogs.tsx renders Create (name + live slug preview), Rename (prefilled, auto-focus, Enter submits), and Delete (destructive confirm) dialogs. ProjectSidebar updated with project item list showing rename/delete actions on hover for owned projects only, shared projects shown without actions, mobile backdrop scrim added. app/editor/page.tsx updated with centered home screen (heading, description, New Project button) wired to Create dialog. TypeScript and ESLint clean.
- Feature 05: Prisma Setup — prisma/models/project.prisma adds Project (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and ProjectCollaborator (projectId cascade, email, createdAt, unique on project/email, indexes on email and project/date). lib/prisma.ts exports a cached PrismaClient singleton using @prisma/adapter-pg. Migration 20260428095100_init applied to hosted Prisma Postgres DB. Client generated to app/generated/prisma. Build clean.

## In Progress

- None.

## Next Up
- Feature 06 (TBD)

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via @theme inline in globals.css, no tailwind.config.js).
- Dark-only theme: all shadcn :root variables set to dark values directly — no .dark class switching.
- Do not modify generated components/ui/* files after shadcn installation.
- Next.js 16 uses proxy.ts (not middleware.ts) — same API, renamed to reflect its purpose.

## Session Notes

- Using Next.js 16.2.4 with React 19 and Tailwind CSS v4.
- shadcn version 4.5.0 was used; it auto-detected Tailwind v4.
- lucide-react ^1.11.0 installed as a direct dependency.
- @clerk/nextjs ^7.2.7 and @clerk/ui ^1.6.7 installed.
- Prisma 7.8.0 — generated client goes to app/generated/prisma/; import PrismaClient from @/app/generated/prisma/client (no index.ts in v7). Constructor always requires { adapter } argument. @prisma/adapter-pg used for all connections.
- prisma.config.ts uses schema: "prisma/" (multi-file schema) and reads DATABASE_URL from .env via dotenv.
