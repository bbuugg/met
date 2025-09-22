package database

import (
	"context"
	"log"
	"meeting/pkg/config"
	"os"
	"sync"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// 保持向后兼容的全局变量和函数
var globalDB *gorm.DB
var once sync.Once

func initMysql() {
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second, // 慢 SQL 阈值
			LogLevel:                  logger.Info, // 日志级别
			IgnoreRecordNotFoundError: true,        // 忽略ErrRecordNotFound（记录未找到）错误
			Colorful:                  false,       // 禁用彩色打印
		},
	)
	var err error
	if globalDB, err = gorm.Open(mysql.Open(config.GetConfig().Mysql.DSN), &gorm.Config{
		Logger: newLogger,
	}); err != nil {
		panic(err)
	}
}

func InitializeDB() {
	once.Do(initMysql)
}

func DB(ctx context.Context) *gorm.DB {
	return globalDB.WithContext(ctx)
}
