package handlers

import (
	"log"
	"net/http"

	"github.com/codespace-app/backend/internal/ws"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	// Allow all origins in development; restrict in production via config.
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub *ws.Hub
}

func NewWSHandler(hub *ws.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

// GET /ws/:slug — upgrades the HTTP connection to WebSocket and registers
// the client with the hub under the given room slug.
func (h *WSHandler) ServeWS(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := ws.NewClient(h.hub, conn, slug)
	h.hub.Register(client)

	// Run read/write pumps in separate goroutines.
	go client.WritePump()
	go client.ReadPump()
}
