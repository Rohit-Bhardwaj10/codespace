package ws

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB — enough for large Yjs state vectors
)

// Client is a single WebSocket connection tied to a room.
type Client struct {
	hub  *Hub
	conn *websocket.Conn
	room string
	send chan *Message // buffered channel of outbound messages
}

// OutboundMessage wraps the payload with its WebSocket type.
type OutboundMessage struct {
	Type    int
	Payload []byte
}


func NewClient(hub *Hub, conn *websocket.Conn, room string) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		room: room,
		send: make(chan *Message, 256),
	}
}


// ReadPump reads incoming frames from the WebSocket and broadcasts them.
// Must run in its own goroutine.
func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister(c)
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		// ReadMessage returns the message type (Text or Binary).
		messageType, payload, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[client] unexpected close: %v", err)
			}
			break
		}

		c.hub.Broadcast(&Message{
			room:    c.room,
			payload: payload,
			Type:    messageType,
			sender:  c,
		})
	} 
}


// WritePump writes outbound frames to the WebSocket.
// Must run in its own goroutine.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Forward with preserved message type.
			if err := c.conn.WriteMessage(msg.Type, msg.payload); err != nil {
				return
			}


		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
