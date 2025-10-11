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
	case MessageTypeChat:
		c.handleChat(message)
	case MessageTypeWebRTCEvent:
		c.handleWebRTCEvent(message)
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
	c.room.Broadcast(message)
}

func (c *Client) handleAllClients(message *Message) {
	c.Send(c.newMessage(MessageTypeAllClients, c.room.AllClients(), nil))
}

func (c *Client) handleWebRTCEvent(message *Message) {
	targetClient := c.room.FindClient(message.To.Id)
	if targetClient == nil {
		log.Printf("Target client %s not found for offer", message.To.Id)
		return
	}
	targetClient.Send(message)
}
