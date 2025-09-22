package webrtc

import (
	"sync"
	"time"
)

// Room maintains the set of active clients and broadcasts messages to the clients.
type Room struct {
	// Room Id
	Id        string
	StartTime time.Time
	MaxOnline int

	// 用来存储房间最后一次检测的时间
	lastAlive time.Time
	// Registered clients.
	clients map[string]*Client

	server *Server

	mu sync.RWMutex

	// Inbound messages from the clients.
	broadcast chan *Message

	// register requests from the clients.
	register chan *Client

	// unregister requests from clients.
	unregister chan *Client

	close chan struct{}
}

func (r *Room) FindClient(clientId string) *Client {
	r.mu.RLock()
	defer r.mu.RUnlock()
	targetClient, _ := r.clients[clientId]

	return targetClient
}

func (r *Room) AllClients() []string {
	var ids []string
	r.mu.RLock()
	defer r.mu.RUnlock()
	for id := range r.clients {
		ids = append(ids, id)
	}

	return ids
}

// Run starts the room's main loop
func (r *Room) Run() {
	ticker := time.NewTicker(10 * time.Second)
	defer func() {
		ticker.Stop()
	}()
	for {
		select {
		case client := <-r.register:
			client.room = r
			r.mu.Lock()
			if c, ok := r.clients[client.Id]; ok {
				c.handleLeave()
				c.handleKick()
				c.room = nil
			}
			r.clients[client.Id] = client
			clientsCount := len(r.clients)
			if clientsCount > r.MaxOnline {
				r.MaxOnline = clientsCount
			}
			client.handleJoin()
			r.mu.Unlock()
		case client := <-r.unregister:
			r.mu.Lock()
			client.handleLeave()
			if _, ok := r.clients[client.Id]; ok {
				delete(r.clients, client.Id)
				//close(client.send)
			}
			r.mu.Unlock()
		case msg := <-r.broadcast:
			if msg.From == nil {
				continue
			}
			r.mu.RLock()
			for _, c := range r.clients {
				// Don't send message back to sender
				if c.Id != msg.From.Id {
					c.Send(msg)
				}
			}
			r.mu.RUnlock()
		case <-ticker.C:
			r.mu.RLock()
			if len(r.clients) > 0 {
				r.lastAlive = time.Now()
			}
			r.mu.RUnlock()
			if r.lastAlive.Add(time.Minute * 5).Before(time.Now()) {
				r.server.RemoveRoom(r.Id)
				return
			}
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
