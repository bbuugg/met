package entity

import (
	"gorm.io/gorm"
	"time"
)

type Room struct {
	Id        uint           `gorm:"primarykey" json:"-"`
	Uuid      string         `gorm:"type:char(36);uniqueIndex;not null" json:"uuid"`
	Name      string         `gorm:"not null;default:'';size:100;charset:utf8mb4;collate:utf8mb4_unicode_ci" json:"name"`
	Password  string         `gorm:"size:255" json:"-"` // 房间密码，不返回给前端
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}
