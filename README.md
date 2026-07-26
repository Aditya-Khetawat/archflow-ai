# ArchFlow AI

ArchFlow AI is a real-time collaborative system design workspace. Users describe a system in plain English, an AI agent maps that system onto a shared canvas, collaborators refine the architecture, and the app generates a technical specification from the resulting graph.

---

## Key Features

- **Authentication & Multi-tenant Projects**: Protected routes and multi-user project access powered by Clerk. Create, rename, delete, and share projects seamlessly.
- **Real-Time Collaborative Canvas**: Shared system design workspace powered by React Flow and Liveblocks. Collaborative node/edge drawing, resizing, customized shapes (rectangles, circles, pills, diamonds, hexagons, cylinders), color toolbar selectors, and custom edge routing.
- **Collaborator Presence**: Real-time cursor tracking and avatar stacks showing who is active in the current workspace.
- **AI Architecture Generation**: Chat with an AI Architect agent powered by Gemini (via SDK) and Trigger.dev background tasks to automatically add, modify, or layout components and connections on the live canvas.
- **Technical Specification Generator**: Turn visual graphs and project chat logs into comprehensive Markdown technical specification documents. Preview specifications in the browser via custom Markdown rendering or stream download them.
- **Starter Template Library**: A curated selection of prebuilt template canvas designs (Monolith/Microservices, Event-Driven, CI/CD Pipeline) that can be imported to kickstart your project.
- **Autosave Canvas Sync**: Debounced workspace canvas snapshots persisted directly to Vercel Blob and linked via Prisma metadata.

---

## Tech Stack & Architecture

ArchFlow AI is built on a modern full-stack TypeScript architecture:

| Layer | Technology | Role / Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack) | Server and Client components, API routes, and page routing. |
| **UI Styling** | Tailwind CSS v4 + shadcn/ui | Dark-themed, glassmorphic technical design system. |
| **Authentication** | Clerk Auth | User session control, registration, and project collaborator metadata. |
| **Database ORM** | Prisma + PostgreSQL | Relational metadata storage (projects, collaborators, spec registry, tasks). |
| **Realtime Canvas** | Liveblocks + React Flow | Multiplayer state synchronization (cursors, presence, node/edge state storage). |
| **Background Tasks** | Trigger.dev v3 | Durable, scalable backend workflow engine for Gemini AI generation tasks. |
| **AI Engine** | Google Gemini (Gemini Flash) | Structured design generation and markdown documentation generation. |
| **Storage Layer** | Vercel Blob | Large canvas snapshot JSON and generated Markdown spec file storage. |

### Storage Model

ArchFlow AI splits storage concerns across two distinct layers:
1. **PostgreSQL Relational DB**: Stores structured metadata, ownership rules, collaborator lists, and task run states.
2. **Vercel Blob Storage**: Stores large, unstructured or semi-structured artifacts (`canvas/{projectId}.json` and `specs/{projectId}/{specId}.md`). The blob URLs are stored inside PostgreSQL records for quick retrieval.

---

## Environment Setup

To run ArchFlow AI locally, create a `.env.local` file in the root directory and configure the following variables:

```bash
# Next.js App Base
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-read-write-token"

# Liveblocks Collaboration
LIVEBLOCKS_SECRET_KEY="your-liveblocks-secret-key"
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="your-liveblocks-public-key"

# Trigger.dev Background Tasks
TRIGGER_SECRET_KEY="your-trigger-secret-key"
TRIGGER_PROJECT_REF="your-trigger-project-ref"

# Gemini AI (Google Generative AI)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

---

## Local Development Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Migrate DB
Apply migrations and compile the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 3. Run Trigger.dev Development Environment
To run the background workers locally for AI design agent and spec generation tasks:
```bash
npx trigger.dev@latest dev
```

### 4. Start Next.js Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Project Structure

```bash
├── app/
│   ├── api/                     # Next.js API Routes (auth, projects, specifications, canvas sync)
│   ├── editor/                  # Editor page layouts and workspaces
│   ├── sign-in/                 # Clerk Custom Sign-in
│   ├── sign-up/                 # Clerk Custom Sign-up
│   ├── layout.tsx               # Root Layout & Provider configuration
│   └── page.tsx                 # Entry/Redirect logic
├── components/
│   ├── editor/                  # Navbar, Sidebar, Shape panels, Canvas, and AI Sidebar
│   └── ui/                      # shadcn/ui foundations (Buttons, Dialogs, Inputs, etc.)
├── context/
│   ├── feature-specs/           # Development specifications for iterative features
│   └── *-context.md             # Architecture, Code Standards, and Progress tracking files
├── hooks/                       # Custom React hooks (dialogs, canvas autosave, keybindings)
├── lib/                         # Infrastructure Singletons (Prisma, Liveblocks client helpers)
├── prisma/
│   └── models/                  # Prisma schema models (Project, TaskRun, ProjectSpec)
├── trigger/                     # Trigger.dev background worker tasks (Gemini design agent & specs)
├── types/                       # Shared canvas types, schema shapes, and task definitions
├── liveblocks.config.ts         # Liveblocks presence, storage, and events types declaration
├── next.config.ts               # Next.js build config
└── trigger.config.ts            # Trigger.dev build config
```
