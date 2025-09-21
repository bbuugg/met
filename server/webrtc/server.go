package webrtc

import (
	"github.com/google/uuid"
	"log"
	"net/http"
	"sync"

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

	roomID := c.Query("room_id")
	if roomID == "" {
		roomID = "room_" + uuid.New().String()[:8]
	}

	role := RoleUser
	s.mu.Lock()
	r, exists := s.rooms[roomID]
	if !exists {
		role = RoleMaster
		r = newRoom(roomID)
		s.rooms[roomID] = r
		go r.Run()
	}
	s.mu.Unlock()

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
