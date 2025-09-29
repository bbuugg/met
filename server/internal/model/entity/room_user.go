package entity

import (
	"gorm.io/gorm"
	"math"
	"time"
)

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

type Role uint8

const (
	RoleMaster Role = iota + 1
	RoleUser
)

const RoleAll Role = math.MaxUint8

// TableName 指定表名
func (RoomUser) TableName() string {
	return "room_users"
}

// IsAdmin 判断是否为管理员
func (ru *RoomUser) IsAdmin() bool {
	return ru.Role == RoleMaster
}

// IsBlocked 判断是否被拉黑
func (ru *RoomUser) IsBlocked() bool {
	return ru.Blocked
}
