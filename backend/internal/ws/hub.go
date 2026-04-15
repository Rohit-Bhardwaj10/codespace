package ws

import (
	"log"
	"sync"
)

// Hub maintains all active rooms and their connected clients.
// It acts as a dumb binary relay — no awareness of Yjs internals.
type Hub struct {
	// rooms maps slug → set of clients
	rooms map[string]map[*Client]bool

	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message

	mu sync.RWMutex
}

type Message struct {
	room    string
	payload []byte
	Type    int // websocket.BinaryMessage or websocket.TextMessage
	sender  *Client
}


func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

// Register adds a client to its room.
func (h *Hub) Register(c *Client) {
	h.register <- c
}

// Unregister removes a client from its room.
func (h *Hub) Unregister(c *Client) {
	h.unregister <- c
}

// Broadcast queues a message to be sent to all peers in the room.
func (h *Hub) Broadcast(msg *Message) {
	h.broadcast <- msg
}

// Run is the hub's event loop — must be called in its own goroutine.
func (h *Hub) Run() {
	for {
		select {

		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.rooms[client.room]; !ok {
				h.rooms[client.room] = make(map[*Client]bool)
			}
			h.rooms[client.room][client] = true
			h.mu.Unlock()
			log.Printf("[hub] client joined room=%s  total=%d", client.room, len(h.rooms[client.room]))

		case client := <-h.unregister:
			h.mu.Lock()
			if peers, ok := h.rooms[client.room]; ok {
				delete(peers, client)
				close(client.send)
				if len(peers) == 0 {
					delete(h.rooms, client.room)
					log.Printf("[hub] room=%s is now empty — removed", client.room)
				}
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			peers := h.rooms[msg.room]
			for client := range peers {
				if client == msg.sender {
					continue // don't echo back to sender
				}
				select {
				case client.send <- msg:

				default:
					// Client send buffer full — drop and unregister
					close(client.send)
					delete(peers, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}
