package server

import (
	"fmt"
	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
	"meeting/internal/webrtc"
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

	r.Use(webrtc.CORS())

	r.GET("/api/signature", s.webrtcServer.GenerateSignature)
	r.GET("/api/websocket", s.webrtcServer.HandleWebSocket)
	r.GET("/api/monitoring", s.webrtcServer.GetMonitoringData) // 添加监控接口路由

	s.httpServer = r
	return s
}

func (s *Server) Run(port uint16) error {
	return s.httpServer.Run(fmt.Sprintf(":%d", port))
}
