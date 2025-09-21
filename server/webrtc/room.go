package webrtc

import (
	"sync"
	"time"
)

// Room maintains the set of active clients and broadcasts messages to the clients.
type Room struct {
	// Room ID
	ID        string
	StartTime time.Time
	// Registered clients.
	clients map[string]*Client

	mutex sync.RWMutex

	// Inbound messages from the clients.
	broadcast chan *Message

	// register requests from the clients.
	register chan *Client

	// unregister requests from clients.
	unregister chan *Client

	close chan struct{}
}

// newRoom creates a new room
func newRoom(id string) *Room {
	return &Room{
		ID:         id,
		broadcast:  make(chan *Message, 100), // Buffered channel
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]*Client),
		close:      make(chan struct{}),
		StartTime:  time.Now(),
	}
}

func (r *Room) FindClient(clientId string) *Client {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	targetClient, _ := r.clients[clientId]

	return targetClient
}

func (r *Room) AllClients() []string {
	var ids []string
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	for id := range r.clients {
		ids = append(ids, id)
	}

	return ids
}

// Run starts the room's main loop
func (r *Room) Run() {
	for {
		select {
		case client := <-r.register:
			client.room = r
			client.handleJoin()
			r.mutex.Lock()
			if c, ok := r.clients[client.ID]; ok {
				c.handleLeave()
				c.handleKick()
				c.room = nil
			}
			r.clients[client.ID] = client
			r.mutex.Unlock()
		case client := <-r.unregister:
			r.mutex.Lock()
			client.handleLeave()
			if _, ok := r.clients[client.ID]; ok {
				delete(r.clients, client.ID)
				//close(client.send)
			}
			r.mutex.Unlock()
		case msg := <-r.broadcast:
			if msg.From == nil {
				continue
			}
			r.mutex.RLock()
			for _, c := range r.clients {
				// Don't send message back to sender
				if c.ID != msg.From.ID {
					c.Send(msg)
				}
			}
			r.mutex.RUnlock()
		case <-r.close:
			// todo 是否需要关闭通道
			close(r.register)
			close(r.unregister)
			close(r.broadcast)
			close(r.close)
			return
		}
	}
}

func (r *Room) RegisterClient(client *Client) {
	r.register <- client
}

func (r *Room) UnregisterClient(client *Client) {
	r.unregister <- client
}

func (r *Room) Close() {
	r.close <- struct{}{}
}
