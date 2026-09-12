# Cursor & Comma 🖥️

> A real-time collaborative browser IDE with CRDT-based editing and isolated Docker code execution.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-7C3AED)](https://yjs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-Optional-DC382D?logo=redis&logoColor=white)](https://redis.io/)

Cursor & Comma is a systems-focused **collaborative coding environment**: users open a shared room, edit the same files in real time, see remote presence, and execute supported languages inside short-lived Docker containers.

The project is built to explore **real-time distributed state, WebSockets, browser-based code editing, asynchronous execution, and sandboxed workloads** in one end-to-end application.

## ✨ Why this project is interesting

Instead of building only a code editor or only a collaboration demo, this project connects both:

```text
Browser Editor
     │
     ├── Monaco Editor
     ├── Yjs CRDT state
     └── WebSocket presence/sync
              │
              ▼
        Node.js Backend
              │
       ┌──────┴──────┐
       │             │
   Collaboration   Execution
       │             │
       │       Redis / BullMQ
       │             │
       │        Docker sandbox
       │             │
       └──────┬──────┘
              ▼
        Program output
```

## 🚀 Core features

- **Real-time collaborative editing** with Yjs CRDT synchronization.
- **Monaco Editor** for a VS Code-style browser editing experience.
- **Presence awareness** so collaborators can see who is in a room.
- **Room-based sharing** — create a room or join using a room code.
- **Multi-file workspaces** for creating, switching, editing, and deleting files.
- **WebSocket synchronization** for low-latency shared state.
- **Docker-backed code execution** for Python, JavaScript, Go, and C++.
- **Execution controls** including rate limiting, resource caps, process limits, output limits, and hard timeouts.
- **Optional Redis + BullMQ execution queue** with a local in-memory fallback for easier development.

## 📸 Screenshots

### Landing page

<img width="1354" height="631" alt="Cursor & Comma landing page" src="https://github.com/user-attachments/assets/2fc9108f-60a8-4c27-bc52-deda725e4fae" />

### Collaborative editor

<img width="1365" height="643" alt="Cursor & Comma collaborative editor" src="https://github.com/user-attachments/assets/14d0a1e6-9143-460d-a76f-cbc080e4bf80" />

## 🧠 Collaboration model

Each room is backed by shared Yjs state. Instead of sending full-file replacements, clients exchange CRDT updates over the collaboration server. This lets concurrent edits converge without relying on a traditional last-write-wins merge flow.

```text
User A                    Collaboration Server                 User B
  │                              │                                │
  │ Monaco edit                  │                                │
  ├────────── Yjs update ───────►│                                │
  │                              ├──────── Yjs update ────────────►│
  │                              │                                │
  │◄──────── remote update ──────┤                                │
```

## 🐳 Execution architecture

Code execution is separated from the host application. Submitted source is copied into a temporary container and executed with multiple restrictions.

Current baseline controls include:

- non-root container user
- disabled network access
- dropped Linux capabilities
- `no-new-privileges`
- memory and CPU limits
- PID limits
- hard execution timeout
- bounded output collection
- explicit container cleanup
- API-side request-size and execution-rate limits

The execution worker can run directly for local development or through **BullMQ + Redis** for queued workloads.

> **Security notice:** this is a development/demo sandbox, not a production-grade arbitrary-code execution service. A public multi-tenant product would need stronger isolation, image hardening, observability, authentication, and infrastructure-level controls such as gVisor, Firecracker, or equivalent isolation.

## 💻 Supported languages

| Language | Runtime |
|---|---|
| Python | Python 3.12 slim |
| JavaScript | Node.js 20 slim |
| Go | Go 1.22 Alpine |
| C++ | GCC 13 |

## 🛠️ Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Editor | Monaco Editor |
| Collaboration | Yjs, y-monaco, WebSockets |
| Backend | Node.js, Express, WebSocket |
| Execution | Docker, Dockerode |
| Queue | BullMQ, Redis |
| Tooling | Git, GitHub, npm |

## 📂 Repository structure

```text
collab-ide/
├── web/
│   ├── app/                 # Next.js routes and pages
│   ├── components/          # UI components
│   ├── hooks/               # Collaboration/editor hooks
│   ├── lib/                 # Client utilities
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── api.js           # REST endpoints + validation/rate limiting
│   │   ├── dockerRunner.js  # Containerized code execution
│   │   ├── executionQueue.js# Redis/BullMQ + local fallback
│   │   ├── index.js         # HTTP server bootstrap
│   │   └── wsServer.js      # WebSocket/Yjs collaboration server
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚡ Getting started

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop / Docker Engine
- Git
- Redis 7+ *(optional for queued execution)*

### 1. Clone

```bash
git clone https://github.com/karankr-singh/collab-ide.git
cd collab-ide
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

Backend health endpoint:

```text
http://localhost:4000/api/health
```

### 3. Start the frontend

Open a second terminal:

```bash
cd web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### 4. Optional: enable Redis + BullMQ

```bash
docker run --name collab-ide-redis -p 6379:6379 redis:7-alpine
```

Then set:

```env
REDIS_URL=redis://localhost:6379
EXEC_CONCURRENCY=4
```

Without Redis, the server automatically falls back to a bounded in-memory execution path for local demos.

## 🔐 Environment variables

Keep local secrets out of Git. Create environment files locally as needed and use an `.env.example` file for contributor-safe configuration.

Never commit API keys, database credentials, Redis credentials, cloud credentials, or private tokens.

## 📌 Project status

### Implemented

- [x] Browser-based Monaco editor
- [x] Real-time collaborative editing
- [x] Yjs CRDT synchronization
- [x] Remote presence
- [x] Multi-file workspace
- [x] Room creation and joining
- [x] REST execution API
- [x] Docker-based execution
- [x] Resource/time/output limits
- [x] Execution rate limiting
- [x] Redis/BullMQ queue support
- [x] Local execution fallback without Redis

### Next milestones

- [ ] Authentication and user accounts
- [ ] Persistent workspaces (PostgreSQL)
- [ ] Shareable read-only sessions
- [ ] Session history and replay
- [ ] Better execution telemetry
- [ ] Stronger sandbox isolation
- [ ] Multi-node collaboration deployment
- [ ] Kubernetes deployment
- [ ] Automated integration tests

## 🎯 Engineering takeaways

This project is primarily an engineering exercise around problems that appear in real developer infrastructure:

```text
Concurrent edits
      ↓
Distributed shared state
      ↓
WebSocket synchronization
      ↓
Queued workloads
      ↓
Resource-constrained execution
      ↓
Isolation + cleanup
```

It intentionally keeps the implementation understandable while leaving a clear path toward production concerns such as authentication, persistence, observability, stronger isolation, and horizontal scaling.

## 🤝 Contributing

Pull requests and focused improvements are welcome. For larger changes, open an issue first so the design can be discussed before implementation.

## 👨‍💻 Author

**Karan Kumar Singh**

Built as a systems-oriented full-stack project exploring collaborative development environments, distributed synchronization, and secure code-execution architecture.
