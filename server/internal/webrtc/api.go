package webrtc

import (
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
)

// RoomInfo represents the information of a room for monitoring
type RoomInfo struct {
	ID          string    `json:"id"`
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
			ID:          room.ID,
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

	c.JSON(http.StatusOK, rooms)
}

func (s *Server) GenerateSignature(c *gin.Context) {
	var req SignatureRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sign, err := GenerateSignature(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sign)
}
