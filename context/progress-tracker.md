# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 12: Shape Panel — complete

## Current Goal
- Feature 13 (TBD)

## Completed

- Feature 01: Design System — shadcn/ui installed and configured for Tailwind v4, dark-only theme tokens in globals.css, Button/Card/Dialog/Input/Tabs/Textarea/ScrollArea components added to components/ui/, lucide-react installed, lib/utils.ts cn() helper in place. TypeScript compiles clean.
- Feature 02: Editor Chrome — EditorNavbar (fixed top bar with PanelLeftOpen/PanelLeftClose toggle) and ProjectSidebar (fixed overlay, slides from left, Projects title + close button, My Projects/Shared tabs with empty states, New Project button) added to components/editor/. Dialog pattern confirmed ready via existing components/ui/dialog.tsx. TypeScript and ESLint clean.
- Feature 03: Auth — @clerk/ui installed. ClerkProvider wraps root layout with dark theme from @clerk/ui/themes, overriding appearance variables using CSS tokens (no hardcoded colors). proxy.ts at project root uses clerkMiddleware + createRouteMatcher to protect all routes except /sign-in and /sign-up (resolved from NEXT_PUBLIC_CLERK_SIGN_IN_URL / NEXT_PUBLIC_CLERK_SIGN_UP_URL env vars). Sign-in and sign-up pages use a minimal two-panel layout (left panel with logo/tagline/feature list hidden on mobile, right panel with centered Clerk form). app/page.tsx redirects authenticated users to /editor and unauthenticated users to /sign-in. UserButton added to EditorNavbar right section. app/editor/page.tsx shell created with sidebar state management.
- Feature 04: Project Dialogs — hooks/use-project-dialogs.ts manages dialog/form/loading state and mock project data (CRUD operations on local state). components/editor/project-dialogs.tsx renders Create (name + live slug preview), Rename (prefilled, auto-focus, Enter submits), and Delete (destructive confirm) dialogs. ProjectSidebar updated with project item list showing rename/delete actions on hover for owned projects only, shared projects shown without actions, mobile backdrop scrim added. app/editor/page.tsx updated with centered home screen (heading, description, New Project button) wired to Create dialog. TypeScript and ESLint clean.
- Feature 05: Prisma Setup — prisma/models/project.prisma adds Project (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and ProjectCollaborator (projectId cascade, email, createdAt, unique on project/email, indexes on email and project/date). lib/prisma.ts exports a cached PrismaClient singleton using @prisma/adapter-pg. Migration 20260428095100_init applied to hosted Prisma Postgres DB. Client generated to app/generated/prisma. Build clean.
- Feature 06: Project APIs — app/api/projects/route.ts (GET list by ownerId ordered by createdAt desc, POST create with default name "Untitled Project") and app/api/projects/[projectId]/route.ts (PATCH rename, DELETE delete). Auth via Clerk auth(); 401 for unauthenticated, 403 for non-owner mutations, 404 when project missing. Build clean.
- Feature 07: Wire Editor Home — app/editor/page.tsx converted to server component; fetches owned projects (by ownerId) and shared projects (via ProjectCollaborator email lookup) using lib/projects.ts getProjectsForUser(). EditorHomeClient (components/editor/editor-home-client.tsx) is the new client shell receiving serialized ProjectRow arrays. hooks/use-project-actions.ts replaces mock hook: create generates roomId (slugify+suffix), POSTs to /api/projects with custom id field, navigates to /editor/[id]; rename PATCHes and router.refresh(); delete DELETEs and redirects to /editor if active workspace else refresh. POST API updated to accept optional id. ProjectSidebar updated to accept ownedProjects/sharedProjects separately; project items link to /editor/[id]. ProjectDialogs updated to use useProjectActions type, slug renamed to roomId. Build clean.
- Feature 08: Editor Workspace Shell — app/editor/[roomId]/page.tsx added as a server component using Next.js 16 async params, redirecting unauthenticated users to /sign-in and rendering components/editor/access-denied.tsx for missing or unauthorized rooms. lib/project-access.ts centralizes current Clerk identity lookup (userId + primary email) and project access checks by owner/collaborator. components/editor/editor-workspace-client.tsx renders the guarded workspace shell with project-aware navbar, active-room sidebar highlight, canvas placeholder, and toggleable right AI placeholder. components/editor/editor-navbar.tsx now supports project title plus share/AI actions, and components/editor/project-sidebar.tsx now auto-opens the correct tab for the active room. `npm run lint` and `npm run build` both pass.
- Feature 09: Share Dialog — app/api/projects/[projectId]/collaborators/route.ts adds collaborator list/invite/remove endpoints with auth enforced for all access and owner-only checks for mutations. lib/project-collaborators.ts enriches stored collaborator emails with Clerk Backend user data (display names and avatars) without introducing a local user table, and normalizes collaborator emails to lowercase for storage and shared-project lookup consistency. components/editor/project-share-dialog.tsx and hooks/use-project-share.ts add the share modal opened from the workspace navbar, including owner-only invite/remove/copy-link controls plus read-only collaborator mode. components/editor/editor-navbar.tsx and components/editor/editor-workspace-client.tsx now wire the Share button into the workspace shell. `npm run lint` and `npm run build` both pass.
- Feature 10: Liveblocks Setup — liveblocks.config.ts updated with Presence (cursor: {x,y}|null, isThinking: boolean) and UserMeta (id, info: {name, avatar, color}). lib/liveblocks.ts exports a lazily-initialized cached Liveblocks node client (getLiveblocks()) and a deterministic getUserColor(userId) helper mapping user IDs to a 10-color palette. app/api/liveblocks-auth/route.ts is a POST endpoint requiring Clerk auth, verifying project access via the existing userHasProjectAccess helper, ensuring the room exists with getOrCreateRoom (private by default), and returning a session token with full access plus name/avatar/color from Clerk. @liveblocks/node installed. `npm run build` passes.
- Feature 11: Base Canvas — liveblocks.config.ts Storage updated to `{ nodes: LiveMap<string, LiveblocksNode<CanvasNode>>; edges: LiveMap<string, LiveblocksEdge<CanvasEdge>> }`. types/canvas.ts defines CanvasNodeData (label, color, shape) and typed CanvasNode/CanvasEdge. components/editor/canvas/canvas-room.tsx wraps LiveblocksProvider + RoomProvider (initialPresence cursor:null/isThinking:false, initialStorage with empty node/edge maps) + ClientSideSuspense. components/editor/canvas/canvas-editor.tsx uses useLiveblocksFlow with suspense:true, renders ReactFlow with ConnectionMode.Loose, fitView, dot Background, and MiniMap. EditorWorkspaceClient now accepts roomId prop and renders CanvasRoom in place of the old placeholder. `npm run build` passes.
- Feature 12: Shape Panel — types/canvas.ts expanded with NODE_SHAPES (6 shapes), NODE_COLORS (8 pairs), SHAPE_DEFAULTS (per-shape width/height). canvas-node.tsx renders canvasNode type as a bordered rectangle with centered label and 4 connection handles. shape-panel.tsx is a floating pill toolbar at bottom-center of canvas with 6 draggable shape buttons; drag payload is JSON containing shape name and default size. canvas-room.tsx wraps CanvasEditor with ReactFlowProvider so useReactFlow is available in canvas-editor.tsx. canvas-editor.tsx registers canvasNode, uses useReactFlow for screenToFlowPosition, uses useMutation to write new nodes into Liveblocks storage on drop, and renders ShapePanel inside ReactFlow. `npm run build` passes.

## In Progress

- None.

## Next Up
- Feature 13 (TBD)

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
- @liveblocks/node installed alongside existing @liveblocks/client, @liveblocks/react, @liveblocks/react-flow, @liveblocks/react-ui. Liveblocks client uses lazy init (getLiveblocks()) to avoid key validation errors at build time.
- Prisma 7.8.0 — generated client goes to app/generated/prisma/; import PrismaClient from @/app/generated/prisma/client (no index.ts in v7). Constructor always requires { adapter } argument. @prisma/adapter-pg used for all connections.
- prisma.config.ts uses schema: "prisma/" (multi-file schema) and reads DATABASE_URL from .env via dotenv.
