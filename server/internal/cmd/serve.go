package cmd

import (
	"context"
	"fmt"
	"log"
	"meeting/internal/controller"
	"meeting/internal/middleware"
	"meeting/internal/model/entity"
	"meeting/pkg/config"
	"meeting/pkg/database"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/gin-contrib/pprof"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/urfave/cli/v3"
)

var (
	cfgPath string
)

var Serve = &cli.Command{
	Name: "serve",
	Flags: []cli.Flag{
		&cli.StringFlag{
			Name:  "config",
			Value: "./config.toml",
			Usage: "config path",
		},
	},
	Action: func(ctx context.Context, cmd *cli.Command) error {
		runtime.SetMutexProfileFraction(1) // (非必需)开启对锁调用的跟踪
		runtime.SetBlockProfileRate(1)     // (非必需)开启对阻塞操作的跟踪
		config.InitializeConfig(cmd.String("config"))
		database.InitializeDB()

		database.DB(context.Background()).AutoMigrate(&entity.User{}, &entity.Room{}, &entity.RoomUser{})

		r := gin.Default()
		r.MaxMultipartMemory = 8 << 20 // 8MiB
		r.UseH2C = true                // gin.UseH2C 开启http2
		pprof.Register(r)
		// r.LoadHTMLGlob("./storage/views/*")
		//r.StaticFS("/swagger", http.Dir("public/swagger"))
		//r.StaticFile("/swagger.json", "./public/swagger.json")

		store := cookie.NewStore([]byte("secret"))
		// store.Options(sessions.Options{
		// 	SameSite: config.GetConfig().Session.SameSiteMode,
		// 	Secure:   config.GetConfig().Session.Secure,
		// })
		r.Use(sessions.Sessions("session", store))
		r.Use(middleware.CORS())

		r.GET("login", controller.AuthHandler.Login)
		r.GET("login/callback", controller.AuthHandler.LoginCallback)
		r.GET("logout", controller.AuthHandler.Logout)
		r.GET("/api/websocket", controller.HandleWebSocket)

		p := r.Group("")
		p.Use(middleware.Authentication())
		{
			p.GET("/api/info", controller.AuthHandler.Info)
			p.GET("/api/user/center", controller.AuthHandler.UserCenter)
			p.GET("/api/signature", controller.GenerateSignature)
			p.GET("/api/room/:id", controller.GetRoomInfo)
			p.GET("/api/rooms", controller.GetRoomList)            // 添加获取房间列表接口
			p.POST("/api/room", controller.CreateRoom)             // 添加创建房间接口
			p.DELETE("/api/room/:id", controller.DeleteRoom)       // 修改为使用 :id
			p.GET("/api/monitoring", controller.GetMonitoringData) // 添加监控接口路由

			// 房间管理接口 - 使用不同的路径避免冲突
			p.POST("/api/rooms/:id/join", controller.JoinRoom)         // 加入房间
			p.PUT("/api/rooms/:id/update", controller.UpdateRoom)      // 更新房间信息
			p.POST("/api/rooms/:id/kick", controller.KickUser)         // 踢出用户
			p.POST("/api/rooms/:id/block", controller.BlockUser)       // 拉黑用户
			p.GET("/api/rooms/:id/members", controller.GetRoomMembers) // 获取房间成员
		}
		go func() {
			log.Fatalln(r.Run(fmt.Sprintf(":%d", config.GetConfig().App.Port)))
		}()
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("Shutdown Server ...")

		return nil
		//创建超时上下文，Shutdown可以让未处理的连接在这个时间内关闭
		//ch, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		//defer cancel()
		//
		//return r.Server.Shutdown(ch)
	},
}
