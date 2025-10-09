package entity

import (
	"gorm.io/gorm"
	"math"
	"time"
)

type Role uint8

// RoomUser 房间用户关联表
type RoomUser struct {
	Id        uint           `gorm:"primarykey" json:"-"`
	RoomId    uint           `gorm:"not null;index" json:"room_id"`
	UserId    uint           `gorm:"not null;index" json:"user_id"`
	Role      Role           `gorm:"type:varchar(20);not null;default:2" json:"role"`
	Blocked   bool           `gorm:"type:varchar(20);not null;default:false" json:"blocked"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`

	// 关联关系
	Room *Room `gorm:"foreignKey:RoomId" json:"room,omitempty"`
	User *User `gorm:"foreignKey:UserId" json:"user,omitempty"`
}

const (
	RoleHost Role = iota + 1
	RoleUser
	RoleAll = math.MaxUint8
)

// TableName 指定表名
func (ru *RoomUser) TableName() string {
	return "room_users"
}

// IsHost 判断是否为房主
func (ru *RoomUser) IsHost() bool {
	return ru.HasRole(RoleHost)
}

func (ru *RoomUser) HasRole(role Role) bool {
	return (ru.Role & role) != 0
}

// IsBlocked 判断是否被拉黑
func (ru *RoomUser) IsBlocked() bool {
	return ru.Blocked
}
