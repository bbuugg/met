package controller

import (
	"context"
	"errors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"meeting/internal/model/entity"
	"meeting/internal/server/constants"
	"meeting/pkg/api"
	"meeting/pkg/auth"
	"meeting/pkg/database"
	"meeting/pkg/passport"
	"net/http"
)

type authHandler struct{}

var AuthHandler = &authHandler{}

func (a *authHandler) Login(ctx *gin.Context) {
	session := sessions.Default(ctx)
	session.Set(constants.RedirectURIKey, ctx.Query("redirect_uri"))
	_ = session.Save()
	ctx.Redirect(http.StatusFound, passport.Redirect("state"))
}

func (a *authHandler) LoginCallback(ctx *gin.Context) {
	session := sessions.Default(ctx)
	redirectURI := "/"
	if r := session.Get(constants.RedirectURIKey); r != nil {
		redirectURI = r.(string)
	}
	session.Delete(constants.RedirectURIKey)
	code := ctx.Query("code")
	if code == "" {
		_ = session.Save()
		ctx.Redirect(http.StatusFound, redirectURI)
		return
	}

	token, err := passport.Exchange(context.Background(), code)
	if err != nil {
		_ = session.Save()
		ctx.Redirect(http.StatusFound, redirectURI)
		return
	}

	info, err := passport.GetUserInfo(token)
	if err != nil || info.Uuid == "" {
		_ = session.Save()
		ctx.JSON(http.StatusBadRequest, err)
		return
	}

	var u entity.User
	if tx := database.DB(context.Background()).Where("uuid=?", info.Uuid).Find(&u); tx.Error != nil && errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		_ = session.Save()
		ctx.Redirect(http.StatusFound, redirectURI)
		return
	}

	u.Uuid = info.Uuid
	u.Avatar = info.Avatar
	u.Email = info.Email
	u.Name = info.Nickname

	if tx := database.DB(context.Background()).Save(&u); tx.Error != nil {
		_ = session.Save()
		ctx.Redirect(http.StatusFound, redirectURI)
		return
	}

	// 设置Session
	session.Set(constants.UserIdKey, u.Id)
	_ = session.Save()
	ctx.Redirect(http.StatusFound, redirectURI)
}

func (a *authHandler) Logout(ctx *gin.Context) {
	r := ctx.Query("redirect_uri")
	if r == "" {
		r = ctx.Request.Referer()
	}
	if r == "" {
		r = ctx.Request.URL.String()
	}
	session := sessions.Default(ctx)
	session.Clear()
	_ = session.Save()

	ctx.Redirect(http.StatusFound, passport.Logout(r))
}

func (a *authHandler) Info(ctx *gin.Context) {
	user := auth.MustGetUserFromCtx(ctx)
	ctx.JSON(http.StatusOK, api.Okay(api.WithData(user)))
}
