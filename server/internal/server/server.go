package server

import (
	"fmt"
	"meeting/internal/server/controller"
	"meeting/internal/server/middleware"
	"meeting/internal/webrtc"

	"github.com/gin-contrib/pprof"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

type Server struct {
	webrtcServer *webrtc.Server
	httpServer   *gin.Engine
}

func NewServer() *Server {
	s := &Server{
		webrtcServer: webrtc.NewServer(),
	}

	r := gin.Default()
	r.MaxMultipartMemory = 8 << 20 // 8MiB
	r.UseH2C = true                // gin.UseH2C 开启http2
	pprof.Register(r)
	// r.LoadHTMLGlob("./storage/views/*")
	//r.StaticFS("/swagger", http.Dir("public/swagger"))
	//r.StaticFile("/swagger.json", "./public/swagger.json")

	store := cookie.NewStore([]byte("secret"))
	// store.Options(sessions.Options{
	// 	SameSite: config.GetConfig().Session.SamesiteMode,
	// 	Secure:   config.GetConfig().Session.Secure,
	// })
	r.Use(sessions.Sessions("session", store))
	r.Use(middleware.CORS())

	r.GET("login", controller.AuthHandler.Login)
	r.GET("login/callback", controller.AuthHandler.LoginCallback)
	r.GET("/api/websocket", s.webrtcServer.HandleWebSocket)

	p := r.Group("")
	p.Use(middleware.Authentication())
	{
		p.GET("/api/info", controller.AuthHandler.Info)
		p.GET("/api/signature", s.webrtcServer.GenerateSignature)
		p.GET("/api/monitoring", s.webrtcServer.GetMonitoringData) // 添加监控接口路由
	}

	s.httpServer = r
	return s
}

func (s *Server) Run(port uint16) error {
	return s.httpServer.Run(fmt.Sprintf(":%d", port))
}
