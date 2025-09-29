package webrtc

import "meeting/internal/model/entity"

type MessageType string

const (
	MessageTypePing        MessageType = "ping"
	MessageTypePong        MessageType = "pong"
	MessageTypeJoin        MessageType = "join"
	MessageTypeLeave       MessageType = "leave"
	MessageTypeAllClients  MessageType = "all-clients" // 客户端id列表
	MessageTypeWebRTCEvent MessageType = "webrtc-event"
	MessageTypeKick        MessageType = "kick" // 被踢了
)

// Message represents a message to be sent to clients
type Message struct {
	Type     MessageType `json:"type"`
	From     *Client     `json:"from"`
	To       *Client     `json:"to,omitempty"` // todo 这里需要修改，不一定只是发送给一个人
	Data     any         `json:"data,omitempty"`
	receiver Receiver
}

type Receiver interface {
	Can(c *Client) bool
}

type RoleReceiver struct {
	Role entity.Role
}

func (r *RoleReceiver) Can(c *Client) bool {
	return c.HasRole(r.Role)
}
