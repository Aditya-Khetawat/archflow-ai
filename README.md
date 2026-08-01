<div align="center">

# ⚡ ArchFlow AI

**Real-time collaborative AI system design — from plain English to production-ready architecture.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Liveblocks](https://img.shields.io/badge/Liveblocks-FF4154?style=for-the-badge&logo=liveblocks&logoColor=white)](https://liveblocks.io)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-7C3AED?style=for-the-badge&logo=lightning&logoColor=white)](https://trigger.dev)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

*Describe a system. Watch it appear on a live collaborative canvas. Generate a full technical spec — instantly.*

</div>

---

## 🚀 What is ArchFlow AI?

ArchFlow AI is a **real-time collaborative system design workspace**. Users describe a system in plain English, an AI agent maps that system onto a shared canvas, collaborators refine the architecture together, and the app generates a comprehensive technical specification from the resulting graph.

> Think Figma meets Miro — but for software architecture, powered by AI.

---

## ✨ Features

| Feature | Description |
|:--|:--|
| 🔐 **Auth & Multi-tenant Projects** | Protected routes and multi-user project access via Clerk. Create, rename, delete, and share projects. |
| 🖼️ **Real-Time Collaborative Canvas** | Shared workspace powered by React Flow + Liveblocks. Draw nodes/edges, resize, pick from custom shapes (rectangles, circles, pills, diamonds, hexagons, cylinders), and route edges with full colour control. |
| 👥 **Live Collaborator Presence** | Real-time cursor tracking and avatar stacks showing who is active in the room. |
| 🤖 **AI Architecture Generation** | Chat with an AI Architect agent (Gemini Flash via Trigger.dev) that automatically adds, modifies, and lays out components on the live canvas. Includes an intelligent model fallback chain for quota resilience. |
| 📄 **Technical Specification Generator** | Convert visual graphs and project conversations into comprehensive Markdown technical specs. Preview inline with custom rendering or download the `.md` file. |
| 📐 **Starter Template Library** | Prebuilt canvas designs (Monolith / Microservices, Event-Driven, CI/CD Pipeline) to kickstart any project. |
| 💾 **Autosave Canvas Sync** | Debounced canvas snapshots are persisted to Vercel Blob and linked via Prisma metadata — your work is never lost. |

---

## 🏗️ Tech Stack

> A modern, full-stack TypeScript architecture built for performance and scale.

| Layer | Technology | Purpose |
|:--|:--|:--|
| 🧩 **Framework** | Next.js 16 + Turbopack | Server & Client components, API routes, page routing |
| 🎨 **UI** | Tailwind CSS v4 + shadcn/ui | Dark-themed, glassmorphic design system |
| 🔑 **Auth** | Clerk | Sessions, registration, collaborator metadata |
| 🗄️ **Database** | Prisma + PostgreSQL | Relational metadata (projects, specs, task runs) |
| 🔴 **Realtime** | Liveblocks + React Flow | Multiplayer canvas sync — cursors, presence, storage |
| ⚙️ **Background Tasks** | Trigger.dev v3 | Durable workflow engine for AI generation tasks |
| 🧠 **AI Engine** | Google Gemini Flash | Structured design generation + Markdown spec authoring |
| 📦 **Storage** | Vercel Blob | Canvas snapshots and generated `.md` spec files |

### 🗂️ Storage Model

ArchFlow AI uses two distinct storage layers:

- **PostgreSQL** — Structured metadata: ownership, collaborator lists, spec registry, task run states.
- **Vercel Blob** — Large unstructured artifacts: `canvas/{projectId}.json` and `specs/{projectId}/{specId}.md`. Blob URLs are persisted in PostgreSQL records for fast retrieval.

---

## 🗺️ Architecture Diagram

```mermaid
flowchart TD
    Browser(["🌐 Browser\n(User / Collaborator)"])

    subgraph Next["⬛ Next.js 16 App (Vercel)"]
        direction TB
        Pages["Pages & Client Components\n(Editor, Canvas, Sidebar)"]
        API["API Routes\n/api/liveblocks-auth\n/api/ai/design\n/api/projects/..."]
    end

    subgraph Realtime["🔴 Liveblocks"]
        LBRoom["Room Storage\n(Canvas nodes, edges, chat)"]
        LBPresence["Presence\n(Cursors, avatars)"]
    end

    subgraph Background["⚙️ Trigger.dev Workers"]
        DesignAgent["design-agent\n(Canvas generation)"]
        SpecAgent["generate-spec\n(Spec authoring)"]
    end

    Gemini(["🧠 Google Gemini Flash\n(AI Engine)"])

    subgraph Storage["🗄️ Persistence"]
        PG[("PostgreSQL\n(Prisma)\nProjects · Specs · Tasks")]
        Blob["☁️ Vercel Blob\nCanvas JSON · Spec .md files"]
    end

    Clerk(["🔑 Clerk Auth\nSessions & User Identity"])

    Browser -->|"HTTPS requests"| Next
    Browser <-->|"WebSocket"| Realtime
    Next -->|"Auth token"| Clerk
    Next -->|"Room auth"| LBRoom
    Next -->|"Trigger task"| Background
    Next -->|"Read / Write"| PG
    DesignAgent -->|"generateObject"| Gemini
    SpecAgent -->|"generateText"| Gemini
    DesignAgent -->|"Write canvas JSON"| LBRoom
    DesignAgent -->|"Save snapshot"| Blob
    SpecAgent -->|"Upload .md"| Blob
    SpecAgent -->|"Register spec"| PG
    Blob -->|"URLs stored in"| PG
```

---



Create a `.env.local` file in the project root and populate the following variables:

```bash
# App Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-read-write-token"

# Liveblocks Realtime Collaboration
LIVEBLOCKS_SECRET_KEY="your-liveblocks-secret-key"
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="your-liveblocks-public-key"

# Trigger.dev Background Tasks
TRIGGER_SECRET_KEY="your-trigger-secret-key"
TRIGGER_PROJECT_REF="your-trigger-project-ref"

# Google Gemini AI
GOOGLE_AI_API_KEY="your-google-ai-api-key"
```

---

## 💻 Local Development

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Generate Prisma Client & Apply Migrations
```bash
npx prisma db push
npx prisma generate
```

### 3️⃣ Start Trigger.dev Local Worker
Required for AI design agent and spec generation tasks to run locally:
```bash
npx trigger.dev@latest dev
```

### 4️⃣ Start the Next.js Dev Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to view the app.

---

## 📁 Project Structure

```
archflow-ai/
├── app/
│   ├── api/                     # API Routes — auth, projects, specs, canvas sync
│   ├── editor/                  # Editor page layouts and workspaces
│   ├── sign-in/                 # Clerk custom sign-in page
│   ├── sign-up/                 # Clerk custom sign-up page
│   ├── layout.tsx               # Root layout & provider configuration
│   └── page.tsx                 # Entry / redirect logic
│
├── components/
│   ├── editor/                  # Navbar, Sidebar, Canvas, AI Sidebar, Shape panels
│   └── ui/                      # shadcn/ui foundations (Buttons, Dialogs, Inputs…)
│
├── context/
│   ├── feature-specs/           # Development specs for iterative features
│   └── *-context.md             # Architecture, code standards, and progress tracking
│
├── hooks/                       # Custom React hooks (dialogs, autosave, keybindings)
├── lib/                         # Singletons — Prisma client, Liveblocks helpers, Gemini
│
├── prisma/
│   └── models/                  # Schema models: Project, TaskRun, ProjectSpec
│
├── trigger/                     # Trigger.dev worker tasks (design agent & spec generator)
├── types/                       # Shared canvas types, schemas, and task definitions
│
├── liveblocks.config.ts         # Liveblocks presence, storage, and event type declarations
├── next.config.ts               # Next.js build configuration
└── trigger.config.ts            # Trigger.dev build configuration
```

---

<div align="center">

Built with ❤️ using Next.js, Liveblocks, Trigger.dev, and Google Gemini.

</div>
