package webrtc

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"meeting/internal/model/entity"
)

const Secret = "X8#kP2!9mQ5$zR7*3fT1&bY4%nH6@gS0"

var (
	ErrMissingRequiredFields = errors.New("missing required fields")
	ErrInvalidSignature      = errors.New("invalid signature")
)

// SignatureRequest represents the request structure for generating signatures
type SignatureRequest struct {
	RoomId    string      `json:"roomId"    form:"roomId"`
	UserId    string      `json:"userId"    form:"userId"`
	Role      entity.Role `json:"role"      form:"role"`
	Timestamp int         `json:"timestamp" form:"timestamp"`
}

// SignatureResponse represents the response structure for generating signatures
type SignatureResponse struct {
	SignatureRequest
	Name      string `json:"name"`
	Avatar    string `json:"avatar"`
	RoomName  string `json:"roomName"`
	Signature string `json:"signature" form:"signature"`
}

// GenerateSignature generates a signature for joining a room
func GenerateSignature(req SignatureRequest) (*SignatureResponse, error) {
	// Validate required fields
	if req.RoomId == "" || req.UserId == "" || req.Timestamp == 0 {
		return nil, ErrMissingRequiredFields
	}

	data := fmt.Sprintf("%s%s%d%d", req.RoomId, req.UserId, req.Role, req.Timestamp)
	// Create a new HMAC by defining the hash type and the key
	h := hmac.New(sha256.New, []byte(Secret))

	// Write the data to the HMAC
	h.Write([]byte(data))

	// Get the hexadecimal encoding of the HMAC
	signature := hex.EncodeToString(h.Sum(nil))

	response := &SignatureResponse{
		SignatureRequest: req,
		Signature:        signature,
	}

	return response, nil
}

// ValidateSignature validates a signature for joining a room
func ValidateSignature(req SignatureResponse) error {
	resp, err := GenerateSignature(req.SignatureRequest)

	if err != nil {
		return err
	}

	if !hmac.Equal([]byte(req.Signature), []byte(resp.Signature)) {
		return ErrInvalidSignature
	}

	return nil
}
