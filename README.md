<img width="1354" height="631" alt="Screenshot 2026-09-05 173951" src="https://github.com/user-attachments/assets/24d50368-9153-468c-aae1-cc92d08fc506" /># Cursor & Comma

### Real-Time Collaborative Code Editor & Secure Code Execution Platform

Cursor & Comma is a web-based collaborative IDE that allows multiple users to write and edit code together in real time, while also providing secure server-side code execution inside isolated Docker containers.

The project combines a modern browser-based code editor with real-time collaboration, multi-file workspaces, WebSocket synchronization, and sandboxed code execution.

---

## 📸 Snapshots

### 1. Landing Page

<img width="1354" height="631" alt="Screenshot 2026-09-05 173951" src="https://github.com/user-attachments/assets/2fc9108f-60a8-4c27-bc52-deda725e4fae" />


### 2. Collaborative Editor

<img width="1365" height="643" alt="Screenshot 2026-09-05 174222" src="https://github.com/user-attachments/assets/14d0a1e6-9143-460d-a76f-cbc080e4bf80" />


---

## ✨ Features

- 🧑‍💻 **Monaco Code Editor**
  - VS Code-style editing experience directly in the browser.
  - Syntax highlighting and modern editor features.

- 🤝 **Real-Time Collaboration**
  - Multiple users can work inside the same session.
  - Changes are synchronized instantly using **Yjs CRDTs**.
  - Remote cursor and presence awareness.

- 📁 **Multi-File Workspace**
  - Create files.
  - Switch between files.
  - Delete files.
  - Workspace changes are synchronized between connected users.

- ⚡ **Code Execution**
  - Execute supported programming languages directly from the IDE.
  - Code runs inside isolated Docker containers.
  - Execution results are returned to the frontend.

- 🔒 **Sandboxed Execution**
  - Containers run as non-root users.
  - Network access is disabled.
  - Linux capabilities are dropped.
  - Memory, CPU and process limits are applied.
  - Execution has a hard timeout.
  - Containers are destroyed after execution.

- 🚦 **Execution Queue**
  - Local development uses an in-memory concurrency limiter.
  - Redis + BullMQ can be enabled for scalable execution workloads.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────────┐
                    │       Web Browser       │
                    │                         │
                    │  Next.js + React        │
                    │  Monaco Editor          │
                    │  Yjs / y-monaco         │
                    └────────────┬────────────┘
                                 │
                    WebSocket / HTTP API
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       Node Server       │
                    │                         │
                    │  Express API            │
                    │  WebSocket Server       │
                    │  Yjs Synchronization    │
                    │  Execution Queue        │
                    └────────────┬────────────┘
                                 │
                         Docker Execution
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Isolated Container   │
                    │                         │
                    │  Python / Node / Go / C │
                    │  No Network Access      │
                    │  Resource Limits        │
                    └─────────────────────────┘

                         Optional
                             │
                             ▼
                    ┌─────────────────────────┐
                    │      Redis + BullMQ     │
                    │   Scalable Job Queue    │
                    └─────────────────────────┘
```

---

## 📂 Project Structure

```text
collab-ide/
│
├── web/                         # Next.js frontend
│   ├── app/                     # Application routes & pages
│   ├── components/              # UI components
│   ├── hooks/                   # React hooks
│   ├── lib/                     # Client-side utilities
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

### Frontend

| Technology | Purpose |
|---|---|
| Next.js | Web application framework |
| React | UI |
| TypeScript | Type-safe development |
| Monaco Editor | Code editor |
| Yjs | CRDT-based collaboration |
| y-monaco | Monaco + Yjs integration |
| y-websocket | Real-time synchronization |
| Tailwind CSS | Styling |
| Lucide React | Icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | REST API |
| WebSocket | Real-time communication |
| Yjs | Collaborative document synchronization |
| Dockerode | Docker container management |
| BullMQ | Job queue |
| Redis | Distributed queue backend |
| dotenv | Environment configuration |

---

## 🔄 How Collaboration Works

Each collaborative session is represented by a shared Yjs document.

```text
User A
  │
  │ Edit
  ▼
Monaco Editor
  │
  ▼
Yjs Document
  │
  │ WebSocket
  ▼
Collaboration Server
  │
  ▼
Yjs Document
  │
  ├──────────────► User B
  │
  └──────────────► User C
```

Yjs handles conflict-free synchronization, allowing multiple users to edit the same files simultaneously without requiring traditional server-side merge logic.

---

## 🐳 Secure Code Execution

User code is executed inside temporary Docker containers rather than directly on the host machine.

The execution environment applies multiple restrictions, including:

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

This provides a safer environment for running user-submitted code.

> **Security Notice:** Container isolation is intended as a baseline for development, demonstration and portfolio use. A production service executing arbitrary code from untrusted users should use stronger isolation technologies such as gVisor or Firecracker.

---

## 💻 Supported Languages

The execution backend is designed around isolated language-specific Docker runtimes.

Current runtime configurations include:

```text
Python
Node.js
Go
C / GCC
```

Docker images are pulled when required by the execution environment.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js 20+
- npm
- Docker Desktop / Docker Engine
- Git

Redis is optional for local development.

---

### 1. Clone the repository

```bash
git clone https://github.com/karankr-singh/collab-ide.git
cd collab-ide
```

---

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

The backend will start on:

```text
http://localhost:4000
```

---

### 3. Start the frontend

Open another terminal:

```bash
cd web
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Environment files are intentionally excluded from the repository.

Create the required environment files locally.

Example:

```text
.env
.env.local
```

Never commit API keys, database credentials, Redis credentials or other secrets to GitHub.

For contributors, an `.env.example` file can be used as a template without containing real credentials.

---

## ⚡ Optional Redis Setup

For scalable execution queueing, run Redis locally:

```bash
docker run -p 6379:6379 redis:7-alpine
```

Then configure:

```env
REDIS_URL=redis://localhost:6379
```

The backend can use BullMQ + Redis to distribute execution jobs across multiple server instances.

---

## 🧪 Development

### Frontend

```bash
cd web
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

### Production build

```bash
cd web
npm run build
npm start
```

Backend:

```bash
cd server
npm start
```

---

## 📌 Current Project Status

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

### Planned / Future Improvements

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

## 🎯 Project Goals

Cursor & Comma aims to provide a lightweight alternative to traditional online coding platforms by combining:

```text
Collaborative Editing
        +
Real-Time Synchronization
        +
Multi-File Development
        +
Secure Code Execution
        +
Scalable Job Processing
```

The goal is to make collaborative programming possible directly from the browser without requiring every participant to configure the same local development environment.

---

## 👨‍💻 Development

This project is actively under development.

Contributions, suggestions and improvements are welcome.
