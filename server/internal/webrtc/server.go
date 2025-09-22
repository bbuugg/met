package webrtc

import (
	"github.com/google/uuid"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type Server struct {
	rooms map[string]*Room
	mu    sync.RWMutex
}

func NewServer() *Server {
	s := &Server{
		rooms: make(map[string]*Room),
	}

	return s
}

// startRoom find or create a new room
func (s *Server) startRoom(id string) (*Room, bool) {
	var isNew bool
	s.mu.Lock()
	defer s.mu.Unlock()
	r, exists := s.rooms[id]
	if !exists {
		r = &Room{
			ID:         id,
			server:     s,
			broadcast:  make(chan *Message, 100), // Buffered channel
			register:   make(chan *Client),
			unregister: make(chan *Client),
			clients:    make(map[string]*Client),
			close:      make(chan struct{}),
			StartTime:  time.Now(),
			lastAlive:  time.Now(),
		}
		s.rooms[r.ID] = r
		isNew = true
		go r.Run()
	}

	return r, isNew
}

func (s *Server) RemoveRoom(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, id)
}

func (s *Server) HandleWebSocket(c *gin.Context) {
	//var req SignatureResponse
	//if err := c.ShouldBindQuery(&req); err != nil {
	//	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	//	return
	//}
	//
	//if err := ValidateSignature(req); err != nil {
	//	c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
	//	return
	//}

	clientId := c.Query("client_id")
	if clientId == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	roomID := c.Query("rid")
	if roomID == "" {
		roomID = uuid.New().String()[:8]
	}

	role := RoleUser
	r, isNew := s.startRoom(roomID)
	if isNew {
		role = RoleMaster
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// Create client with Role and add to room
	client := newClient(conn, clientId, role)
	r.RegisterClient(client)

	// Start client message handling
	go client.readPump()
	go client.writePump()
}
