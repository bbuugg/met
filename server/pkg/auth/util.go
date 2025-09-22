package auth

import (
	"github.com/gin-gonic/gin"
	"meeting/internal/model/entity"
	"meeting/internal/server/constants"
)

func UserFromCtx(ctx *gin.Context) *entity.User {
	user, exists := ctx.Get(constants.UserKey)
	if !exists {
		return nil
	}

	if user, ok := user.(*entity.User); ok && user != nil {
		return user
	}

	return nil
}

func MustGetUserFromCtx(ctx *gin.Context) *entity.User {
	user := UserFromCtx(ctx)
	if user == nil {
		panic("user not found")
	}

	return user
}
