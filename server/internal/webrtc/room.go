package webrtc

import (
	"sort"
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
	return r.clients[clientId]
}

func (r *Room) AllClients() []*Client {
	var clients = make([]*Client, 0)
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, client := range r.clients {
		clients = append(clients, client)
	}

	sort.Slice(clients, func(i, j int) bool {
		return clients[i].joinTime.Before(clients[j].joinTime)
	})

	return clients
}

func (r *Room) KickAllUser() {
	for _, client := range r.AllClients() {
		client.handleKick()
		r.UnregisterClient(client)
	}
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
			client.joinTime = time.Now()
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
			delete(r.clients, client.Id)
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
			if r.lastAlive.Add(time.Minute * 30).Before(time.Now()) {
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
