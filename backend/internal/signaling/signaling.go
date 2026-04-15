package signaling

// Signaling handles WebRTC offer/answer/ICE candidate exchange over WebSocket.
// Phase 2 implementation — wired into the existing WS hub under a JSON envelope.
//
// Message format (JSON, sent over the same WebSocket connection as Yjs):
//
//	{
//	  "type": "offer" | "answer" | "ice-candidate",
//	  "from": "<client-id>",
//	  "to":   "<client-id>",        // targeted delivery
//	  "data": "<SDP or candidate>"
//	}
//
// The hub remains a dumb relay; targeted delivery is handled here by
// inspecting the "to" field and routing only to the matching peer.

import "encoding/json"

// SignalMessage is the envelope for WebRTC signaling payloads.
type SignalMessage struct {
	Type string          `json:"type"` // offer | answer | ice-candidate
	From string          `json:"from"`
	To   string          `json:"to"`
	Data json.RawMessage `json:"data"`
}

// IsSignal returns true if the raw payload is a JSON signaling message
// (not a binary Yjs frame). Used by the hub to route differently.
func IsSignal(payload []byte) bool {
	if len(payload) == 0 || payload[0] != '{' {
		return false // binary Yjs frame
	}
	var msg SignalMessage
	return json.Unmarshal(payload, &msg) == nil && msg.Type != ""
}

// Parse decodes a raw payload into a SignalMessage.
func Parse(payload []byte) (*SignalMessage, error) {
	var msg SignalMessage
	if err := json.Unmarshal(payload, &msg); err != nil {
		return nil, err
	}
	return &msg, nil
}
