package passport

import (
	"context"
	"encoding/json"
	"io"
	"meeting/pkg/api"
	"meeting/pkg/config"
	"net/http"
	"time"

	"golang.org/x/oauth2"
)

type UserInfo struct {
	Uuid            string
	Name            string
	Nickname        string
	Gender          uint8
	Email           string
	EmailVerifiedAt time.Time
	Avatar          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func oauthConfig() *oauth2.Config {
	c := config.GetConfig()
	return &oauth2.Config{
		ClientID:     c.Passport.ClientId,
		ClientSecret: c.Passport.ClientSecret,
		Scopes:       c.Passport.Scope,
		Endpoint: oauth2.Endpoint{
			AuthURL:  c.Passport.URL + "/oauth/authorize",
			TokenURL: c.Passport.URL + "/oauth/token",
		},
		RedirectURL: c.Passport.RedirectURI,
	}
}

func Redirect(state string) string {
	return oauthConfig().AuthCodeURL(state, oauth2.AccessTypeOnline)
}

func Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	return oauthConfig().Exchange(ctx, code)
}

func GetUserInfo(token *oauth2.Token) (*UserInfo, error) {
	c := config.GetConfig()
	// todo 处理接口请求失败的报错
	req, _ := http.NewRequest(http.MethodGet, c.Passport.URL+"/api/v1/user/profile", nil)
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Authorization", "Bearer "+token.AccessToken)
	res, err := http.DefaultClient.Do(req)
	defer res.Body.Close()
	if err != nil {
		return nil, err
	}
	data, _ := io.ReadAll(res.Body)
	var response api.Response[*UserInfo]
	json.Unmarshal(data, &response)

	return response.Data, err
}

func Logout(redirectURI string) string {
	return config.GetConfig().Passport.URL + "/logout?redirect_uri=" + redirectURI
}

func UserCenter(redirectURI string) string {
	return config.GetConfig().Passport.URL + "/user/center?redirect_uri=" + redirectURI
}
