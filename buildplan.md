# Build Plan — Collaborative Coding Platform

> **Timeline:** 6 weeks | **MVP Target:** Ship at end of Week 6  
> **Phases:** 3 — Foundation → Core → Polish  
> **Skipped for MVP:** Session recording (moved to v2)

---

## Phase 1 — Foundation: Room + Editor
**Weeks 1–2**

### 1.1 Room Creation & Slug System
**Effort:** ~1 day  
**Stack:** Go, Gin, GORM, Postgres

- [x] Build the Go WebSocket hub (Gorilla WebSocket + Gin)
- [x] Generate a unique slug per session
- [x] Store slug in Postgres via GORM
- [x] `GET /room/new` → redirect to `GET /room/:slug`
- [x] Share the slug URL with collaborators

---

### 1.2 Monaco Editor Integration
**Effort:** ~1 day  
**Stack:** Next.js, Monaco Editor

- [x] Embed Monaco in Next.js
- [x] Wire up language selector: Go, Python, C++, JavaScript
- [x] No sync yet — just editor rendering correctly with syntax highlighting

---

### 1.3 Go Hub: Yjs Message Relay
**Effort:** ~1 day  
**Stack:** Go, Gorilla WebSocket

> ⚠️ Must be done **before** 1.4 — the Yjs frontend provider can't connect until the hub speaks binary.

- [x] Wire the hub to handle **binary** WebSocket frames (Yjs uses binary, not JSON)
- [x] Broadcast received frames to all peers sharing the same room slug
- [x] No awareness of Yjs internals needed — pure dumb relay

---

### 1.4 Yjs + y-monaco Real-Time Sync
**Effort:** ~2–3 days  
**Stack:** Yjs, y-websocket, y-monaco, Monaco Editor

- [x] Add Yjs with `y-websocket` provider pointing at the Go hub (built in 1.3)
- [x] `y-monaco` binding syncs editor content and gives collaborator cursors for free
- [x] Test with two browser tabs before moving to Phase 2

---

### 1.5 Shared Focus Radio
**Effort:** ~1 day  
**Stack:** WebSocket (Relay), YouTube IFrame API

- [x] Integrated "Lo-Fi Radio" button in the room.
- [ ] Shared state: Play/Pause/Track synced across all peers via the Go Hub.
- [ ] Individual volume sliders (UI only — doesn't affect others).
- [ ] Adds a "premium vibe" for collaborative coding.

**Phase 1 Tech Stack:**
- Go + Gin
- Gorilla WebSocket
- Yjs + y-monaco
- Monaco Editor
- Next.js
- YouTube IFrame API

---

## Phase 2 — Core: Voice + Code Execution
**Weeks 3–4**

### 2.1 P2P WebRTC Voice (1-on-1)
**Effort:** ~2 days  
**Stack:** Browser WebRTC APIs, Go signaling server

- [x] Go signaling server handles offer/answer/ICE exchange
- [ ] Frontend uses browser WebRTC APIs
  - [ ] `getUserMedia` for mic access
  - [ ] `RTCPeerConnection` for the call
- [ ] No SFU needed for 2 people

---

### 2.2 Code Execution via Judge0
**Effort:** ~1 day  
**Stack:** Judge0 API, Go

- [x] Frontend sends language + code to Go backend
- [x] Go backend proxies request to Judge0 free API
- [x] Returns `stdout` / `stderr` to frontend
- [x] Display output in a panel below Monaco
- [x] Supports 40+ languages out of the box

---

### 2.3 Pion SFU for 3+ Participants
**Effort:** ~4–5 days  
**Stack:** Pion WebRTC (Go)

- [ ] Replace P2P with a Selective Forwarding Unit using Pion
- [ ] Each peer sends **one upstream track**; SFU routes it to all others
- [ ] Required for the **silent observer role** (e.g. hiring manager watching)
- This is the technically impressive part of the stack

---

### 2.4 Problem Statement Panel
**Effort:** ~1 day  
**Stack:** Yjs, Next.js

- [ ] Host pastes a problem description (Markdown) in a side panel
- [ ] Viewers see it read-only
- [ ] Simple CRDT doc synced via Yjs — same pattern as the editor
- [ ] Turns the room into an **interview-ready tool**

**Phase 2 Tech Stack:**
- Pion WebRTC
- Judge0 API
- Browser WebRTC APIs
- Yjs

---

## Phase 3 — Polish: Ship-Ready
**Weeks 5–6**

### 3.1 Auth (Optional for MVP)
**Effort:** ~1–2 days  
**Stack:** GitHub OAuth (optional)

- [x] Rooms are **ephemeral and anonymous** for MVP — this is fine
- [x] Add GitHub OAuth **only if** you want persistent history or user profiles
- [ ] **Skip if rushing to ship**

---

### 3.2 Room Roles: Host / Guest / Observer
**Effort:** ~1 day  
**Stack:** Go, Postgres

- [ ] Host controls who can edit vs. watch
- [ ] **Observer role:** read-only on editor + audio only — key for interview use case
- [x] Roles stored per-session in Postgres

---

### 3.3 Deploy + Domain
**Effort:** ~1 day  
**Stack:** Railway / Fly.io, Vercel, Postgres (managed)

- [ ] Go backend on **Railway** or **Fly.io** (WebSocket-friendly)
- [ ] Next.js frontend on **Vercel**
- [ ] Postgres managed on Railway
- [ ] Get a domain, ship it, post to GDG community first

**Phase 3 Tech Stack:**
- Railway / Fly.io
- Vercel
- GitHub OAuth
- Postgres (managed)

---

## ⏭ Skipped for MVP — Session Recording (v2)

> Event-sourced keystroke replay, voice segment storage, scrubable timeline.  
> Ship v1 first, add this in v2 when users ask for it.  
> It's the real moat — but **don't build a moat before you have a castle.**

---

## Milestones

| # | Target | Done When | Status |
|---|--------|-----------|--------|
| ① | End of Week 1 | Two browser tabs editing the same Monaco instance in real time, cursors visible | ✅ Done |
| ② | End of Week 2 | Share a `/room/:slug` link, everyone editing in real time with shared Lo-Fi music | ⚠️ In Progress |
| ③ | End of Week 3 | Run code inside the room, output appears below the editor for both users | ⚠️ In Progress |
| ④ | End of Week 4 | Voice calls (1:1 and SFU) working — third person joins as silent observer | ⏳ Pending |
| ⑤ | End of Week 6 | Deployed, shareable URL, posted to GDG / dev communities. Real users. | ⏳ Pending |


---

## Full Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js |
| Editor | Monaco Editor |
| Real-time sync | Yjs, y-websocket, y-monaco |
| WebSocket server | Go + Gin + Gorilla WebSocket |
| Voice (1:1) | Browser WebRTC APIs |
| Voice (3+) | Pion SFU (Go) |
| Signaling | Go (existing hub) |
| Code execution | Judge0 API |
| Database | Postgres + GORM |
| Hosting (backend) | Railway or Fly.io |
| Hosting (frontend) | Vercel |
| Auth (optional) | GitHub OAuth |
