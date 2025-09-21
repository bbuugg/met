package main

import (
	"fmt"
	"log"
	"meeting/webrtc"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
)

var (
	port uint16
)

func init() {
	rootCmd.PersistentFlags().Uint16VarP(&port, "port", "p", 8080, "server port")
}

var rootCmd = &cobra.Command{
	Use: "webrtc-signal",
	RunE: func(cmd *cobra.Command, args []string) error {
		runtime.SetMutexProfileFraction(1) // (非必需)开启对锁调用的跟踪
		runtime.SetBlockProfileRate(1)     // (非必需)开启对阻塞操作的跟踪

		r := gin.Default()
		r.MaxMultipartMemory = 8 << 20 // 8MiB
		r.UseH2C = true                // gin.UseH2C 开启http2
		pprof.Register(r)
		// r.LoadHTMLGlob("./storage/views/*")
		//r.StaticFS("/swagger", http.Dir("public/swagger"))
		//r.StaticFile("/swagger.json", "./public/swagger.json")

		r.Use(webrtc.CORS())
		s := webrtc.NewServer()
		r.GET("/api/signature", s.GenerateSignature)
		r.GET("/api/websocket", s.HandleWebSocket)
		r.GET("/api/monitoring", s.GetMonitoringData) // 添加监控接口路由

		go func() {
			log.Fatalln(r.Run(fmt.Sprintf(":%d", port)))
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

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
