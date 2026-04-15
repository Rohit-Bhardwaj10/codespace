backend/
├── cmd/server/main.go        # App entry point
├── internal/
│   ├── config/               # Env loader
│   ├── db/                   # Connection & migrations
│   ├── handlers/             # Room, Execute, WS, Auth handlers
│   ├── judge/                # Judge0 API client
│   ├── middleware/           # CORS, Logging, Auth stubs
│   ├── models/               # Room, User, Role structs
│   ├── repository/           # GORM database logic
│   ├── router/               # Gin route definitions
│   ├── sfu/                  # Pion SFU (Phase 2 placeholder)
│   ├── signaling/            # WebRTC signaling logic
│   └── ws/                   # WebSocket hub & client
└── pkg/slug/                 # Slug generator
