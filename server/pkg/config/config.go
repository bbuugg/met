package config

import (
	"errors"
	"github.com/BurntSushi/toml"
	"os"
	"sync"
)

// 保持向后兼容的全局函数
var globalConfig TomlConfig
var configOnce sync.Once

type TomlConfig struct {
	App struct {
		Port uint16
	}
	Mysql struct {
		DSN string
	}
	Passport struct {
		URL          string
		ClientID     string
		ClientSecret string
		RedirectURI  string
		ResponseType string
		Scope        []string
		GrantType    string
	}
}

func InitializeConfig(filepath string) {
	configOnce.Do(func() {
		initializeConfig(filepath)
	})
}

func initializeConfig(filepath string) {
	if _, err := toml.DecodeFile(filepath, &globalConfig); err != nil && !errors.Is(err, os.ErrNotExist) {
		panic(err)
	}

	initializeWithDefaults()
}

func initializeWithDefaults() {
	if globalConfig.App.Port == 0 {
		globalConfig.App.Port = 8080
	}
	if globalConfig.Mysql.DSN == "" {
		globalConfig.Mysql.DSN = "root:root@tcp(127.0.0.1:3306)/met?charset=utf8mb4&parseTime=True&loc=Local"
	}
}

func GetConfig() TomlConfig {
	return globalConfig
}
