package main

import (
	"context"
	"log"
	"meeting/internal/cmd"
	"os"

	"github.com/urfave/cli/v3" // imports as package "cli"
)

func main() {
	c := &cli.Command{
		Name:     "met",
		Usage:    "met cli",
		Commands: []*cli.Command{cmd.Serve},
	}

	if err := c.Run(context.Background(), os.Args); err != nil {
		log.Fatal(err)
	}
}
