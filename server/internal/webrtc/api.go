package webrtc

import (
	"meeting/internal/model/entity"
	"meeting/pkg/api"
	"meeting/pkg/auth"
	"meeting/pkg/database"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RoomInfo represents the information of a room for monitoring
type RoomInfo struct {
	Id          string    `json:"id"`
	ClientCount int       `json:"clientCount"`
	StartTime   time.Time `json:"startTime"`
	MaxOnline   int       `json:"maxOnline"`
	LastActive  time.Time `json:"lastActive"`
	Clients     []*Client `json:"clients"`
}

// CreateRoomRequest represents the request structure for creating a room
type CreateRoomRequest struct {
	Name string `json:"name" binding:"required"`
}

// CreateRoomResponse represents the response structure for creating a room
type CreateRoomResponse struct {
	Uuid string `json:"uuid"`
	Name string `json:"name"`
}

// CreateRoom creates a new room
func (s *Server) CreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	// Create room entity
	room := &entity.Room{
		Uuid:   uuid.New().String(),
		UserId: user.Id,
		Name:   req.Name,
	}

	// Save to database
	if err := database.DB(c).Create(room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to create room")))
		return
	}

	response := CreateRoomResponse{
		Uuid: room.Uuid,
		Name: room.Name,
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(response)))
}

// GetMonitoringData returns the monitoring data of all rooms
func (s *Server) GetMonitoringData(c *gin.Context) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var rooms = make([]RoomInfo, 0)
	for _, room := range s.rooms {
		room.mu.RLock()
		clientCount := len(room.clients)
		var clients = make([]*Client, 0)
		for _, client := range room.clients {
			clients = append(clients, client)
		}
		room.mu.RUnlock()

		rooms = append(rooms, RoomInfo{
			Id:          room.Id,
			ClientCount: clientCount,
			StartTime:   room.StartTime,
			MaxOnline:   room.MaxOnline,
			LastActive:  room.lastAlive,
			Clients:     clients,
		})
	}

	sort.Slice(rooms, func(i, j int) bool {
		return rooms[i].StartTime.Before(rooms[j].StartTime)
	})

	c.JSON(http.StatusOK, api.Okay(api.WithData(rooms)))
}

func (s *Server) GenerateSignature(c *gin.Context) {
	var req SignatureRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}
	user := auth.MustGetUserFromCtx(c)
	req.UserId = user.Uuid
	if req.Name == "" {
		req.Name = user.Name
	}
	sign, err := GenerateSignature(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage(err.Error())))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(sign)))
}
