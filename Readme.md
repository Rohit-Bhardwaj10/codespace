# CodeSpace — Collaborative Real-Time Coding Platform

A premium, collaborative coding platform designed for technical interviews and pair programming. Features real-time code synchronization, 1:1 voice calls, and multi-language code execution.

## 🚀 Key Features

- **🏠 Collaborative Rooms**: Instant room creation with unique, human-readable slugs.
- **⚡ Real-Time Sync**: Multi-user editing powered by **Yjs** CRDTs and **Monaco Editor** (the engine behind VS Code).
- **🗣️ Integrated Voice**: Low-latency P2P and SFU-based audio calls via **WebRTC** (Pion).
- **🛠️ Multi-Language Execution**: Run code in 40+ languages directly in the browser via **Judge0**.
- **👥 Observer Mode**: Specialized read-only roles for interviewers or silent observers.

---

## 🏗️ Project Structure (Monorepo)

```text
codespace/
├── backend/             # Go + Gin + Gorilla WS + Pion
│   ├── cmd/server/      # Entry point
│   ├── internal/        # Core business logic (private)
│   ├── pkg/             # Reusable utilities
│   └── ws/              # Binary WebSocket relay for Yjs
├── frontend/            # Next.js + Monaco Editor + Yjs
│   ├── app/             # App Router pages
│   └── components/      # UI & Editor components
├── buildplan.md        # Detailed 6-week implementation road map
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
- **Language**: Go 1.23+
- **Framework**: [Gin](https://gin-gonic.com/)
- **WebSocket**: [Gorilla WebSocket](https://github.com/gorilla/websocket)
- **WebRTC**: [Pion](https://pion.ly/)
- **ORM**: [GORM](https://gorm.io/) with Postgres
- **Execution**: [Judge0 API](https://judge0.com/)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **State Sync**: [Yjs](https://yjs.dev/) + `y-websocket`
- **Styling**: Vanilla CSS (Premium Aesthetics)

---

## 🚦 Getting Started

### Prerequisites
- [Go](https://go.dev/doc/install) (1.23+)
- [Node.js](https://nodejs.org/) (v18+)
- [Postgres](https://www.postgresql.org/download/)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JUDGE0_API_KEY
go mod tidy
make run
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🗺️ Roadmap (Build Plan Highlights)

- **Phase 1 (Weeks 1-2)**: Foundation — Room system, Monaco integration, and Yjs real-time sync.
- **Phase 2 (Weeks 3-4)**: Core — WebRTC voice calls and Judge0 code execution.
- **Phase 3 (Weeks 5-6)**: Polish — Auth, observer roles, and production deployment (Vercel/Railway).

---

## 📄 License
MIT
