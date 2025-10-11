package config

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/BurntSushi/toml"
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
	Session struct {
		SameSite     string
		SameSiteMode http.SameSite
		Secure       bool
	}
	Passport struct {
		URL          string
		ClientId     string
		ClientSecret string
		RedirectURI  string
		ResponseType string
		Scope        []string
		GrantType    string
	}
}

func InitializeConfig(filepath string) {
	configOnce.Do(func() {
		if _, err := toml.DecodeFile(filepath, &globalConfig); err != nil && !errors.Is(err, os.ErrNotExist) {
			panic(err)
		}

		initializeWithDefaults()
	})
}

func initializeWithDefaults() {
	if globalConfig.App.Port == 0 {
		globalConfig.App.Port = 8080
	}
	if globalConfig.Mysql.DSN == "" {
		globalConfig.Mysql.DSN = "root:root@tcp(127.0.0.1:3306)/met?charset=utf8mb4&parseTime=True&loc=Local"
	}
	switch strings.ToLower(globalConfig.Session.SameSite) {
	case "lax":
		globalConfig.Session.SameSiteMode = http.SameSiteLaxMode
	case "strict":
		globalConfig.Session.SameSiteMode = http.SameSiteStrictMode
	case "none":
		globalConfig.Session.SameSiteMode = http.SameSiteNoneMode
	default:
		globalConfig.Session.SameSiteMode = http.SameSiteDefaultMode
	}
}

func GetConfig() TomlConfig {
	return globalConfig
}
