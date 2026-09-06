# Cursor & Comma

> A real-time collaborative browser IDE with CRDT-based editing and isolated Docker code execution.

[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-blue)](https://yjs.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

Cursor & Comma is a full-stack collaborative development environment that lets multiple users edit code in the same browser workspace while synchronizing changes in real time. It also provides server-side execution of supported languages inside temporary, resource-limited Docker containers.

The project is designed as a systems-focused portfolio project exploring **real-time collaboration, distributed state synchronization, WebSockets, container isolation, and asynchronous job processing**.

---

## 📸 Screenshots

### Landing Page

<img width="1354" height="631" alt="Cursor & Comma landing page" src="https://github.com/user-attachments/assets/2fc9108f-60a8-4c27-bc52-deda725e4fae" />

### Collaborative Editor

<img width="1365" height="643" alt="Cursor & Comma collaborative editor" src="https://github.com/user-attachments/assets/14d0a1e6-9143-460d-a76f-cbc080e4bf80" />

---

## ✨ Key Features

- **Monaco Editor** — VS Code-style browser editing experience.
- **Real-time collaboration** — multiple users edit the same workspace through Yjs CRDT synchronization.
- **Presence awareness** — remote users and cursors are visible during collaboration.
- **Multi-file workspaces** — create, edit, switch between, and delete files.
- **WebSocket synchronization** — low-latency communication between clients and the collaboration server.
- **Isolated code execution** — submitted programs run in temporary Docker containers.
- **Execution safeguards** — non-root execution, disabled networking, dropped capabilities, resource limits, process limits, and hard timeouts.
- **Execution queue** — local in-memory concurrency control with optional Redis + BullMQ support for distributed workloads.

---

## 🏗️ Architecture

```text
                         ┌──────────────────────────┐
                         │        Web Browser       │
                         │                          │
                         │  Next.js + React         │
                         │  Monaco Editor           │
                         │  Yjs / y-monaco         │
                         └────────────┬─────────────┘
                                      │
                              HTTP / WebSocket
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       Node.js Server     │
                         │                          │
                         │  Express REST API        │
                         │  WebSocket Server       │
                         │  Yjs Synchronization    │
                         │  Execution Queue        │
                         └────────────┬─────────────┘
                                      │
                              Docker Execution
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     Temporary Sandbox    │
                         │                          │
                         │ Python / Node / Go / C  │
                         │ No Network Access       │
                         │ CPU / Memory / PID Caps │
                         └──────────────────────────┘

                                  Optional
                                     │
                                     ▼
                         ┌──────────────────────────┐
                         │      Redis + BullMQ      │
                         │   Distributed Job Queue  │
                         └──────────────────────────┘
```

### Collaboration flow

```text
User A ──► Monaco ──► Yjs ──► WebSocket Server ──► User B
                                  │
                                  └───────────────► User C
```

Each session is backed by a shared Yjs document. Yjs provides conflict-free state synchronization, allowing concurrent edits without implementing traditional server-side merge logic.

---

## 🐳 Code Execution & Isolation

User-submitted code is executed in temporary Docker containers rather than directly on the host machine.

The current execution baseline includes:

- Non-root execution
- Disabled network access
- Dropped Linux capabilities
- `no-new-privileges`
- Memory limits
- CPU limits
- Process limits
- Hard execution timeout
- Temporary containers
- No host filesystem mounts for submitted code

> **Security notice:** This is a development/demo/portfolio sandbox, not a production-grade arbitrary-code execution environment. A production service should use stronger isolation such as gVisor, Firecracker, or another hardened execution architecture.

---

## 💻 Supported Languages

The execution backend currently supports language-specific Docker runtimes for:

- Python
- Node.js
- Go
- C / GCC

---

## 📂 Project Structure

```text
collab-ide/
├── web/                         # Next.js frontend
│   ├── app/                     # Routes and pages
│   ├── components/              # UI components
│   ├── hooks/                   # React hooks
│   ├── lib/                     # Client utilities
│   ├── public/                  # Static assets
│   └── package.json
│
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── api.js              # REST API
│   │   ├── dockerRunner.js     # Docker sandbox execution
│   │   ├── executionQueue.js   # Execution queue
│   │   ├── index.js            # Server entry point
│   │   └── wsServer.js         # WebSocket / Yjs server
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Editor | Monaco Editor |
| Collaboration | Yjs, y-monaco, y-websocket |
| Backend | Node.js, Express, WebSocket |
| Containers | Docker, Dockerode |
| Queue | BullMQ, Redis |
| Tooling | Git, GitHub, npm |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker Desktop / Docker Engine
- Git

Redis is optional for local development.

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

Backend:

```text
http://localhost:4000
```

### 3. Start the frontend

Open another terminal:

```bash
cd web
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

### 4. Optional Redis

For the distributed execution queue:

```bash
docker run -p 6379:6379 redis:7-alpine
```

Then configure:

```env
REDIS_URL=redis://localhost:6379
```

---

## 🔐 Environment Variables

Environment files are intentionally excluded from the repository.

Create the required files locally, for example:

```text
.env
.env.local
```

Never commit API keys, database credentials, Redis credentials, or other secrets.

An `.env.example` file can be used for contributor configuration without containing real credentials.

---

## 📌 Project Status

### Implemented

- [x] Browser-based Monaco editor
- [x] Real-time collaborative editing
- [x] Yjs CRDT synchronization
- [x] Remote user presence
- [x] Multi-file workspace
- [x] File creation and deletion
- [x] WebSocket collaboration server
- [x] REST execution API
- [x] Docker-based code execution
- [x] Execution resource limits
- [x] Execution timeout
- [x] Redis/BullMQ execution queue support

### Planned

- [ ] User authentication
- [ ] Persistent workspaces
- [ ] PostgreSQL integration
- [ ] User accounts and profiles
- [ ] Shareable read-only sessions
- [ ] Session history
- [ ] Improved execution monitoring
- [ ] Production-grade sandbox isolation
- [ ] Multi-node deployment
- [ ] Kubernetes deployment

---

## 🎯 Why This Project?

Cursor & Comma combines several systems problems that are easy to demonstrate poorly but interesting to solve well:

```text
Real-Time Collaboration
        +
CRDT State Synchronization
        +
Multi-File Editing
        +
Containerized Code Execution
        +
Asynchronous Job Processing
```

The project is primarily a learning and engineering exercise in building a collaborative developer tool while dealing with concurrency, distributed state, resource isolation, and backend execution workloads.

---

## ⚠️ Limitations

This project is still under active development. The current sandbox should **not** be treated as sufficient isolation for an internet-facing service that executes arbitrary untrusted code.

Some production concerns still require additional work, including hardened isolation, authentication, persistent storage, observability, multi-node coordination, and stronger resource governance.

---

## 👨‍💻 Author

**Karan Kumar Singh**

Built as a systems-oriented full-stack project exploring collaborative development environments, distributed synchronization, and secure code execution.
