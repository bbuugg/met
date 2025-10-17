package middleware

import (
	"errors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"meeting/internal/model/entity"
	"meeting/internal/server/constants"
	"meeting/pkg/api"
	"meeting/pkg/database"
	"net/http"
)

func Authentication() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		//var user *entity.User
		//database.DB(ctx).Where("name != ''").Order("rand()").Find(&user)
		//
		//ctx.Set(constants.UserKey, user)
		//ctx.Next()
		//return
		session := sessions.Default(ctx)
		userId, ok := session.Get(constants.UserIdKey).(uint)
		if !ok || userId == 0 {
			ctx.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage("Unauthorized")))
			ctx.Abort()
			return
		}

		var user *entity.User
		if tx := database.DB(ctx).Where("id=?", userId).Find(&user); tx.Error != nil && errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusUnauthorized, api.Fail(api.WithMessage("Unauthorized")))
			ctx.Abort()
			return
		}

		ctx.Set(constants.UserKey, user)
		ctx.Next()
	}
}
