package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	Id        uint           `gorm:"primarykey" json:"-"`
	Uuid      string         `gorm:"type:char(36);uniqueIndex;not null" json:"uuid"`
	Name      string         `gorm:"uniqueIndex;not null;size:100;charset:utf8mb4;collate:utf8mb4_unicode_ci" json:"name"`
	Email     string         `gorm:"uniqueIndex;not null;size:255;charset:utf8mb4;collate:utf8mb4_unicode_ci" json:"email"`
	Password  string         `gorm:"not null;size:255" json:"-"`
	Avatar    string         `gorm:"size:500" json:"avatar"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"`
}
