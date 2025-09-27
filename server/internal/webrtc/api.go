package webrtc

import (
	"context"
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

// RoomListItem represents a room in the room list
type RoomListItem struct {
	Uuid      string    `json:"uuid"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Server) GetRoomInfo(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room
	if database.DB(context.Background()).Where("uuid=?", id).Find(&room); room.Id == 0 {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(room)))
}

// GetRoomList returns the list of rooms created by the current user
func (s *Server) GetRoomList(c *gin.Context) {
	user := auth.MustGetUserFromCtx(c)

	var rooms = make([]entity.Room, 0)
	if err := database.DB(c).Where("user_id = ?", user.Id).Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to fetch room list")))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(rooms)))
}

// CreateRoom creates a new room
func (s *Server) CreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	var room entity.Room
	if database.DB(context.Background()).Where("user_id=?", user.Id).Where("name", req.Name).Find(&room); room.Id == 0 {
		room.Uuid = uuid.New().String()
		room.UserId = user.Id
		room.Name = req.Name
		if err := database.DB(c).Create(&room).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to create room")))
			return
		}
	}

	response := CreateRoomResponse{
		Uuid: room.Uuid,
		Name: room.Name,
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(response)))
}

// DeleteRoom deletes a room by its UUID
func (s *Server) DeleteRoom(c *gin.Context) {
	uuid := c.Param("uuid")
	user := auth.MustGetUserFromCtx(c)

	var room entity.Room
	if err := database.DB(c).Where("uuid = ? AND user_id = ?", uuid, user.Id).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	if err := database.DB(c).Delete(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to delete room")))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithMessage("Room deleted successfully")))
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

type SignRes struct {
	SignatureResponse
	RoomName string `json:"roomName"`
}

func (s *Server) GenerateSignature(c *gin.Context) {
	var req SignatureRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}
	user := auth.MustGetUserFromCtx(c)
	req.UserId = user.Uuid
	req.Name = user.Name
	req.Avatar = user.Avatar
	var room entity.Room
	if database.DB(c).Where("uuid=?", req.RoomId).Find(&room); room.Id == 0 {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage("room not found")))
		return
	}

	var role = RoleUser
	if room.UserId == user.Id {
		role = RoleMaster
	}

	req.Role = role

	sign, err := GenerateSignature(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage(err.Error())))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(&SignRes{
		SignatureResponse: *sign,
		RoomName:          room.Name,
	})))
}
