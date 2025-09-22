package webrtc

import (
	"meeting/pkg/api"
	"meeting/pkg/auth"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
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
