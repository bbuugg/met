package main

import (
	"context"
	"log"
	"meeting/internal/model/entity"
	"meeting/internal/server"
	"meeting/pkg/config"
	"meeting/pkg/database"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/spf13/cobra"
)

var (
	cfgPath string
)

func init() {
	rootCmd.PersistentFlags().StringVarP(&cfgPath, "config", "c", "./config.toml", "config path")
}

var rootCmd = &cobra.Command{
	Use: "webrtc-signal",
	RunE: func(cmd *cobra.Command, args []string) error {
		runtime.SetMutexProfileFraction(1) // (非必需)开启对锁调用的跟踪
		runtime.SetBlockProfileRate(1)     // (非必需)开启对阻塞操作的跟踪
		config.InitializeConfig(cfgPath)
		database.InitializeDB()

		database.DB(context.Background()).AutoMigrate(&entity.User{}, &entity.Room{})

		s := server.NewServer()

		go func() {
			log.Fatalln(s.Run(config.GetConfig().App.Port))
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
