package webrtc

import (
	"log"
	"time"
)

// handleMessage processes messages from clients
func (c *Client) handleMessage(message *Message) {
	defer func() {
		if err := recover(); err != nil {
			log.Printf("Error processing message from client %s: %v", c.Id, err)
		}
	}()
	switch message.Type {
	case MessageTypePing:
		c.handlePing()
	case MessageTypeAllClients:
		c.handleAllClients(message)
	case MessageTypeWebRTCEvent:
		c.handleWebRTCEvent(message)
	case MessageTypeChat:
		c.handleChat(message)
	default:
		log.Printf("Unknown message type received from client %s: %s", c.Id, message.Type)
	}
}

func (c *Client) handlePing() {
	if time.Since(c.lastMessageTime) < time.Second*9 {
		return
	}
	c.Send(c.newMessage(MessageTypePong, nil, nil))
}

func (c *Client) handleChat(message *Message) {
	c.room.broadcast <- c.newMessage(MessageTypeChat, message.Data, nil)
}

func (c *Client) handleAllClients(message *Message) {
	// Send all existing clients to the new client (excluding self)
	allClients := c.room.AllClients()
	var otherClients []string
	for _, clientId := range allClients {
		if clientId != c.Id {
			otherClients = append(otherClients, clientId)
		}
	}
	c.Send(c.newMessage(MessageTypeAllClients, otherClients, nil))
}

func (c *Client) handleWebRTCEvent(message *Message) {
	targetClient := c.room.FindClient(message.To.Id)
	if targetClient == nil {
		log.Printf("Target client %s not found for offer", message.To.Id)
		return
	}

	targetClient.Send(message)
}
