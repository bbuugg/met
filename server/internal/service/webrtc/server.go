package webrtc

import (
	"sync"
	"time"
)

var WsServer = &Server{
	rooms: make(map[string]*Room),
}

type RoomInfo struct {
	Id          string    `json:"id"`
	Name        string    `json:"name"`
	ClientCount int       `json:"clientCount"`
	StartTime   time.Time `json:"startTime"`
	MaxOnline   int       `json:"maxOnline"`
	LastActive  time.Time `json:"lastActive"`
	Clients     []*Client `json:"clients"`
}

type Server struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

// StartRoom find or create a new room
func (s *Server) StartRoom(id string) *Room {
	s.mu.Lock()
	defer s.mu.Unlock()
	r, exists := s.rooms[id]
	if !exists {
		r = &Room{
			Id:         id,
			server:     s,
			broadcast:  make(chan *Message, 100), // Buffered channel
			register:   make(chan *Client),
			unregister: make(chan *Client),
			clients:    make(map[string]*Client),
			close:      make(chan struct{}),
			StartTime:  time.Now(),
			lastAlive:  time.Now(),
		}
		s.rooms[r.Id] = r
		go r.Run()
	}

	return r
}

func (s *Server) FindRoom(id string) *Room {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.rooms[id]
}

func (s *Server) RemoveRoom(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, id)
}

func (s *Server) CloseRoom(id string) {
	r := s.FindRoom(id)
	if r != nil {
		r.KickAllUser()
		s.RemoveRoom(id)
	}
}

func (s *Server) GetRooms() []*RoomInfo {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var rooms = make([]*RoomInfo, 0)
	for _, v := range s.rooms {
		rooms = append(rooms, &RoomInfo{
			Id: v.Id,
		})
	}

	return rooms
}
