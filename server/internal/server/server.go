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
	r.GET("logout", controller.AuthHandler.Logout)
	r.GET("/api/websocket", s.webrtcServer.HandleWebSocket)

	p := r.Group("")
	p.Use(middleware.Authentication())
	{
		p.GET("/api/info", controller.AuthHandler.Info)
		p.GET("/api/user/center", controller.AuthHandler.UserCenter)
		p.GET("/api/signature", s.webrtcServer.GenerateSignature)
		p.GET("/api/room/:id", s.webrtcServer.GetRoomInfo)
		p.GET("/api/rooms", s.webrtcServer.GetRoomList)            // 添加获取房间列表接口
		p.POST("/api/room", s.webrtcServer.CreateRoom)             // 添加创建房间接口
		p.DELETE("/api/room/:id", s.webrtcServer.DeleteRoom)       // 修改为使用 :id
		p.GET("/api/monitoring", s.webrtcServer.GetMonitoringData) // 添加监控接口路由

		// 房间管理接口 - 使用不同的路径避免冲突
		p.POST("/api/rooms/:id/join", s.webrtcServer.JoinRoom)         // 加入房间
		p.PUT("/api/rooms/:id/update", s.webrtcServer.UpdateRoom)      // 更新房间信息
		p.POST("/api/rooms/:id/kick", s.webrtcServer.KickUser)         // 踢出用户
		p.POST("/api/rooms/:id/block", s.webrtcServer.BlockUser)       // 拉黑用户
		p.GET("/api/rooms/:id/members", s.webrtcServer.GetRoomMembers) // 获取房间成员
	}

	s.httpServer = r
	return s
}

func (s *Server) Run(port uint16) error {
	return s.httpServer.Run(fmt.Sprintf(":%d", port))
}
