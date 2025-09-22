package webrtc

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
)

const Secret = "secret"

var (
	ErrMissingRequiredFields = errors.New("missing required fields")
	ErrInvalidSignature      = errors.New("invalid signature")
)

// SignatureRequest represents the request structure for generating signatures
type SignatureRequest struct {
	RoomID    string `json:"room_id" form:"room_id"`
	UserID    string `json:"user_id" form:"user_id"`
	Name      string `json:"name"    form:"name"`
	Timestamp string `json:"timestamp" form:"timestamp"`
}

// SignatureResponse represents the response structure for generating signatures
type SignatureResponse struct {
	SignatureRequest
	Signature string `json:"signature"`
}

// GenerateSignature generates a signature for joining a room
func GenerateSignature(req SignatureRequest) (*SignatureResponse, error) {
	// Validate required fields
	if req.RoomID == "" || req.UserID == "" || req.Name == "" {
		return nil, ErrMissingRequiredFields
	}

	// Create the data to be signed
	data := req.RoomID + req.UserID + req.Name

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
