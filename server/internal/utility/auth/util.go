package auth

import (
	"meeting/internal/constants"
	"meeting/internal/model/entity"

	"github.com/gin-gonic/gin"
)

func UserFromCtx(ctx *gin.Context) *entity.User {
	user, exists := ctx.Get(constants.UserKey)
	if !exists {
		return nil
	}

	if ue, ok := user.(*entity.User); ok && ue != nil {
		return ue
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
