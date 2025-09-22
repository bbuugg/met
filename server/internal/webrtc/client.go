package webrtc

import (
	"bytes"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 102400
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  102400,
	WriteBufferSize: 102400,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from any origin
	},
}

type Role uint8

const (
	RoleMaster Role = iota + 1
	RoleUser
)

const RoleAll Role = math.MaxUint8

type User struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	// Client Role (bitmap)
	Role Role `json:"role"`
}

// Client is a middleman between the websocket connection and the room.
type Client struct {
	*User

	joinTime time.Time
	// We'll use an interface to avoid import cycles
	room *Room

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan *Message

	lastMessageTime time.Time
}

// newClient creates a new client with a specific Role
func newClient(conn *websocket.Conn, user *User) *Client {
	return &Client{
		User:            user,
		conn:            conn,
		send:            make(chan *Message, 256),
		lastMessageTime: time.Now(),
	}
}

func (c *Client) handleJoin() {
	// broadcast join message to all other clients
	joinMsg := c.newMessage(MessageTypeJoin, nil, nil)
	c.room.broadcast <- joinMsg
}

func (c *Client) handleLeave() {
	// broadcast leave message to all other clients
	leaveMsg := c.newMessage(MessageTypeLeave, nil, nil)
	c.room.broadcast <- leaveMsg
}

func (c *Client) handleKick() {
	c.send <- c.newMessage(MessageTypeKick, nil, nil)
}

// Send sends a message to the client
func (c *Client) Send(msg *Message) {
	c.send <- msg
}

func (c *Client) HasRole(role Role) bool {
	return (c.Role & role) != 0
}

func (c *Client) newMessage(t MessageType, data any, receiver Receiver) *Message {
	if receiver == nil {
		receiver = &RoleReceiver{Role: RoleAll}
	}
	return &Message{
		Type:     t,
		Data:     data,
		From:     c,
		receiver: receiver,
	}
}

// readPump pumps messages from the websocket connection to the room.
func (c *Client) readPump() {
	defer func() {
		if c.room != nil && c.conn != nil {
			c.room.UnregisterClient(c)
			c.conn.Close()
		}
	}()

	if c.conn == nil {
		return
	}

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf("websocket conn closed err: %v", err)
			}
			break
		}

		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
		var msg *Message
		if err = json.Unmarshal(message, &msg); err != nil {
			break
		}

		msg.From = c
		c.handleMessage(msg)
	}
}

// writePump pumps messages from the room to the websocket connection.
func (c *Client) writePump() {
	if c.conn == nil {
		return
	}

	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				// The room closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			message, err := json.Marshal(msg)
			if err != nil {
				log.Printf("Error marshalling message: %v", err)
				return
			}
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				msg = <-c.send
				message, err = json.Marshal(msg)
				if err != nil {
					log.Printf("Error marshalling message: %v", err)
					continue
				}
				w.Write(newline)
				w.Write(message)
			}
			c.lastMessageTime = time.Now()
			if err = w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
