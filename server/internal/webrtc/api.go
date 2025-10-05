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
	Name        string    `json:"name"`
	ClientCount int       `json:"clientCount"`
	StartTime   time.Time `json:"startTime"`
	MaxOnline   int       `json:"maxOnline"`
	LastActive  time.Time `json:"lastActive"`
	Clients     []*Client `json:"clients"`
}

// CreateRoomRequest represents the request structure for creating a room
type CreateRoomRequest struct {
	Name     string `json:"name" binding:"required"`
	Password string `json:"password,omitempty"` // 可选的房间密码
}

// CreateRoomResponse represents the response structure for creating a room
type CreateRoomResponse struct {
	Uuid string `json:"uuid"`
	Name string `json:"name"`
}

// RoomListItem represents a room in the room list
type RoomListItem struct {
	Uuid        string    `json:"uuid"`
	Name        string    `json:"name"`
	CreatedAt   time.Time `json:"createdAt"`
	HasPassword bool      `json:"hasPassword"` // 是否有密码
}

// JoinRoomRequest represents the request structure for joining a room
type JoinRoomRequest struct {
	Password string `json:"password,omitempty"` // 房间密码
}

// UpdateRoomRequest represents the request structure for updating room info
type UpdateRoomRequest struct {
	Name     string `json:"name,omitempty"`
	Password string `json:"password,omitempty"`
}

// KickUserRequest represents the request structure for kicking a user
type KickUserRequest struct {
	UserId uint `json:"userId" binding:"required"`
}

// BlockUserRequest represents the request structure for blocking a user
type BlockUserRequest struct {
	UserId uint `json:"userId" binding:"required"`
}

// RoomMemberInfo represents room member information
type RoomMemberInfo struct {
	UserId   uint   `json:"userId"`
	UserName string `json:"userName"`
	Role     string `json:"role"`
	Blocked  bool   `json:"blocked"`
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
	var userRooms = make([]entity.RoomUser, 0)
	if err := database.DB(c).Where("user_id", user.Id).Find(&userRooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to fetch user rooms")))
		return
	}

	var roomIds = make([]uint, 0)
	for _, roomUser := range userRooms {
		roomIds = append(roomIds, roomUser.RoomId)
	}

	if err := database.DB(c).Where("id in ?", roomIds).Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to fetch room list")))
		return
	}

	// 转换为RoomListItem格式
	roomList := make([]RoomListItem, len(rooms))
	for i, room := range rooms {
		roomList[i] = RoomListItem{
			Uuid:        room.Uuid,
			Name:        room.Name,
			CreatedAt:   room.CreatedAt,
			HasPassword: room.Password != "",
		}
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(roomList)))
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
		room.Name = req.Name
		room.Password = req.Password // 设置房间密码
		if err := database.DB(c).Create(&room).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to create room")))
			return
		}

		// 创建房间时，创建者自动成为管理员
		roomUser := entity.RoomUser{
			RoomId:  room.Id,
			UserId:  user.Id,
			Role:    entity.RoleMaster,
			Blocked: false,
		}
		if err := database.DB(c).Create(&roomUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to create room user")))
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
	uuid := c.Param("id")
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

	// 收集所有房间ID用于IN查询
	roomIds := make([]string, 0, len(s.rooms))
	for _, room := range s.rooms {
		roomIds = append(roomIds, room.Id)
	}

	// 使用IN查询一次性获取所有房间信息
	var roomEntities []entity.Room
	if len(roomIds) > 0 {
		database.DB(context.Background()).Where("uuid IN ?", roomIds).Find(&roomEntities)
	}

	// 创建房间ID到房间名称的映射
	roomNameMap := make(map[string]string)
	for _, roomEntity := range roomEntities {
		roomNameMap[roomEntity.Uuid] = roomEntity.Name
	}

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
			Name:        roomNameMap[room.Id],
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
	var room entity.Room
	if database.DB(c).Where("uuid=?", req.RoomId).Find(&room); room.Id == 0 {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage("room not found")))
		return
	}

	// 检查用户在房间中的角色
	var roomUser entity.RoomUser
	var role = entity.RoleUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&roomUser).Error; err == nil {
		if roomUser.IsAdmin() {
			role = entity.RoleMaster
		}
		// 检查用户是否被拉黑
		if roomUser.IsBlocked() {
			c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("You are blocked from this room")))
			return
		}
	}

	req.Role = role
	req.Timestamp = time.Now().UnixMilli()
	sign, err := GenerateSignature(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage(err.Error())))
		return
	}

	sign.RoomName = room.Name
	sign.Name = user.Name
	sign.Avatar = user.Avatar
	// 只有房间管理员才能获取房间密码
	if role == entity.RoleMaster {
		sign.RoomPassword = room.Password
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(sign)))
}

// JoinRoom handles joining a room with password verification
func (s *Server) JoinRoom(c *gin.Context) {
	roomUuid := c.Param("id")
	var req JoinRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	// 查找房间
	var room entity.Room
	if err := database.DB(c).Where("uuid = ?", roomUuid).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	// 验证密码
	if room.Password != "" && room.Password != req.Password {
		c.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage("Invalid password")))
		return
	}

	// 检查用户是否已在房间中
	var existingRoomUser entity.RoomUser
	database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&existingRoomUser)

	if existingRoomUser.Id == 0 {
		// 用户不在房间中，创建新的关联记录
		roomUser := entity.RoomUser{
			RoomId:  room.Id,
			UserId:  user.Id,
			Role:    entity.RoleUser,
			Blocked: false,
		}
		if err := database.DB(c).Create(&roomUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to join room")))
			return
		}
	} else if existingRoomUser.IsBlocked() {
		// 用户被拉黑
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("You are blocked from this room")))
		return
	}

	c.JSON(http.StatusOK, api.Okay(api.WithMessage("Successfully joined room")))
}

// UpdateRoom updates room information (admin only)
func (s *Server) UpdateRoom(c *gin.Context) {
	roomUuid := c.Param("id")
	var req UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	// 查找房间
	var room entity.Room
	if err := database.DB(c).Where("uuid = ?", roomUuid).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	// 检查用户是否为房间管理员
	var roomUser entity.RoomUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&roomUser).Error; err != nil {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Access denied")))
		return
	}

	if !roomUser.IsAdmin() {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Only room admin can update room")))
		return
	}

	// 更新房间信息
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Password != "" {
		updates["password"] = req.Password
	}

	if len(updates) > 0 {
		if err := database.DB(c).Model(&room).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to update room")))
			return
		}
	}

	c.JSON(http.StatusOK, api.Okay(api.WithMessage("Room updated successfully")))
}

// KickUser kicks a user from the room (admin only)
func (s *Server) KickUser(c *gin.Context) {
	roomUuid := c.Param("id")
	var req KickUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	// 查找房间
	var room entity.Room
	if err := database.DB(c).Where("uuid = ?", roomUuid).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	// 检查用户是否为房间管理员
	var adminRoomUser entity.RoomUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&adminRoomUser).Error; err != nil {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Access denied")))
		return
	}

	if !adminRoomUser.IsAdmin() {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Only room admin can kick users")))
		return
	}

	// 查找要踢出的用户
	var targetUser entity.User
	if err := database.DB(c).Where("id = ?", req.UserId).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("User not found")))
		return
	}

	// 不能踢出自己
	if req.UserId == user.Id {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage("Cannot kick yourself")))
		return
	}

	// 踢出用户（从房间用户表中删除记录）
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, req.UserId).Delete(&entity.RoomUser{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to kick user")))
		return
	}

	// 如果用户在线，发送踢出消息
	if activeRoom := s.FindRoom(room.Uuid); activeRoom != nil {
		if client := activeRoom.FindClient(targetUser.Uuid); client != nil {
			client.Send(&Message{
				Type: MessageTypeKick,
				From: nil,
				Data: "You have been kicked from the room",
			})
		}
	}

	c.JSON(http.StatusOK, api.Okay(api.WithMessage("User kicked successfully")))
}

// BlockUser blocks a user from the room (admin only)
func (s *Server) BlockUser(c *gin.Context) {
	roomUuid := c.Param("id")
	var req BlockUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage(err.Error())))
		return
	}

	user := auth.MustGetUserFromCtx(c)

	// 查找房间
	var room entity.Room
	if err := database.DB(c).Where("uuid = ?", roomUuid).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	// 检查用户是否为房间管理员
	var adminRoomUser entity.RoomUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&adminRoomUser).Error; err != nil {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Access denied")))
		return
	}

	if !adminRoomUser.IsAdmin() {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Only room admin can block users")))
		return
	}

	// 查找要拉黑的用户
	var targetUser entity.User
	if err := database.DB(c).Where("id = ?", req.UserId).First(&targetUser).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("User not found")))
		return
	}

	// 不能拉黑自己
	if req.UserId == user.Id {
		c.JSON(http.StatusBadRequest, api.Fail(api.WithMessage("Cannot block yourself")))
		return
	}

	// 查找或创建房间用户记录
	var targetRoomUser entity.RoomUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, req.UserId).First(&targetRoomUser).Error; err != nil {
		// 如果用户不在房间中，创建一个被拉黑的记录
		targetRoomUser = entity.RoomUser{
			RoomId:  room.Id,
			UserId:  req.UserId,
			Role:    entity.RoleMaster,
			Blocked: true,
		}
		if err := database.DB(c).Create(&targetRoomUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to block user")))
			return
		}
	} else {
		// 更新用户状态为被拉黑
		if err := database.DB(c).Model(&targetRoomUser).Update("blocked", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to block user")))
			return
		}
	}

	// 如果用户在线，踢出并发送拉黑消息
	if activeRoom := s.FindRoom(room.Uuid); activeRoom != nil {
		if client := activeRoom.FindClient(targetUser.Uuid); client != nil {
			client.Send(&Message{
				Type: MessageTypeKick,
				From: nil,
				Data: "You have been blocked from the room",
			})
		}
	}

	c.JSON(http.StatusOK, api.Okay(api.WithMessage("User blocked successfully")))
}

// GetRoomMembers gets the list of room members (admin only)
func (s *Server) GetRoomMembers(c *gin.Context) {
	roomUuid := c.Param("id")
	user := auth.MustGetUserFromCtx(c)

	// 查找房间
	var room entity.Room
	if err := database.DB(c).Where("uuid = ?", roomUuid).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Fail(api.WithMessage("Room not found")))
		return
	}

	// 检查用户是否为房间管理员
	var adminRoomUser entity.RoomUser
	if err := database.DB(c).Where("room_id = ? AND user_id = ?", room.Id, user.Id).First(&adminRoomUser).Error; err != nil {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Access denied")))
		return
	}

	if !adminRoomUser.IsAdmin() {
		c.JSON(http.StatusForbidden, api.Fail(api.WithMessage("Only room admin can view members")))
		return
	}

	// 获取房间成员列表
	var roomUsers []entity.RoomUser
	if err := database.DB(c).Preload("User").Where("room_id = ?", room.Id).Find(&roomUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, api.Fail(api.WithMessage("Failed to fetch room members")))
		return
	}

	// 转换为响应格式
	members := make([]RoomMemberInfo, len(roomUsers))
	for i, ru := range roomUsers {
		members[i] = RoomMemberInfo{
			UserId:   ru.UserId,
			UserName: ru.User.Name,
			Role:     string(ru.Role),
			Blocked:  ru.Blocked,
		}
	}

	c.JSON(http.StatusOK, api.Okay(api.WithData(members)))
}
