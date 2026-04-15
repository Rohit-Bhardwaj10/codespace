// Package sfu provides a Selective Forwarding Unit for 3+ participant voice.
// Phase 2 — placeholder stub. Full Pion implementation added in Week 4.
//
// Architecture:
//   Each peer connects to the SFU via a dedicated WebSocket endpoint (/sfu/:slug).
//   Peers send ONE upstream audio track; the SFU forwards it to all other peers.
//   This removes the N*(N-1) mesh problem of pure P2P.
//
// Dependencies (add to go.mod when implementing):
//   github.com/pion/webrtc/v4
//   github.com/pion/ice/v3

package sfu

// SFU is the top-level Selective Forwarding Unit.
// Replace this stub with Pion logic in Phase 2 (Week 4).
type SFU struct {
	// rooms maps slug → Room
	rooms map[string]*Room
}

// Room holds all peer connections for a single coding session.
type Room struct {
	slug  string
	peers map[string]*Peer
}

// Peer represents one participant's WebRTC connection to the SFU.
type Peer struct {
	id   string
	room *Room
	// peerConnection *webrtc.PeerConnection  ← uncomment in Phase 2
}

func NewSFU() *SFU {
	return &SFU{rooms: make(map[string]*Room)}
}

// TODO (Phase 2 — Week 4):
//   1. Accept WebSocket upgrade on /sfu/:slug
//   2. Create pion/webrtc PeerConnection per peer
//   3. On track event, forward the track to all other peers in the room
//   4. Handle ICE, DTLS, and connection lifecycle
