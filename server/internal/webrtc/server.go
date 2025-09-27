package webrtc

import (
	"errors"
	"log"
	"meeting/internal/model/entity"
	"meeting/pkg/api"
	"meeting/pkg/database"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
func (s *Server) startRoom(id string) *Room {
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

func (s *Server) RemoveRoom(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, id)
}

func (s *Server) HandleWebSocket(c *gin.Context) {
	var req SignatureResponse
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	if err := ValidateSignature(req); err != nil {
		c.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage(err.Error())))
		return
	}

	var user entity.User
	if tx := database.DB(c).Where("uuid = ?", req.UserId).Find(&user); tx.Error != nil && errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage("User not found")))
		return
	}
	if user.Id == 0 {
		c.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage("Unauthorized")))
		return
	}

	var room entity.Room
	if tx := database.DB(c).Where("uuid = ?", req.RoomId).Find(&room); tx.Error != nil && errors.Is(tx.Error, gorm.ErrRecordNotFound) || room.Id == 0 {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage("Room not found")))
		return
	}

	log.Printf("%v", room)
	var role = RoleUser
	if room.UserId == user.Id {
		role = RoleMaster
	}

	r := s.startRoom(req.RoomId)
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// Create client with Role and add to room
	client := newClient(conn, &User{
		Id:     user.Uuid,
		Name:   user.Name,
		Avatar: user.Avatar,
		Role:   role,
	})
	r.RegisterClient(client)

	// Start client message handling
	go client.readPump()
	go client.writePump()
}
