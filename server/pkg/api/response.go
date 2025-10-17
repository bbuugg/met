package api

import (
	"github.com/gin-gonic/gin"
	"strconv"
)

type Option func(r *Response[any])

func (o Option) applyTo(r *Response[any]) {
	o(r)
}

const (
	CodeOk = iota
	CodeFail
)

type Response[T any] struct {
	Data    T      `json:"data"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// WithData Functional Options Patter
func WithData[T any](data T) Option {
	return func(r *Response[any]) {
		r.Data = data
	}
}

func WithCode(code int) Option {
	return func(r *Response[any]) {
		r.Code = code
	}
}

func WithMessage(message string) Option {
	return func(r *Response[any]) {
		r.Message = message
	}
}

func Okay(options ...Option) *Response[any] {
	r := &Response[any]{Code: CodeOk, Message: "ok"}
	for _, f := range options {
		if f != nil {
			f.applyTo(r)
		}
	}
	if r.Code != 0 {
		panic("ok response code must be zero")
	}

	return r
}

func Fail(options ...Option) *Response[any] {
	r := &Response[any]{Code: CodeFail, Message: "fail"}
	for k := range options {
		options[k].applyTo(r)
	}

	if r.Code == 0 {
		panic("fail response code must not be zero")
	}

	return r
}

func PageList[T any](total int64, items []T, page, perPage int) gin.H {
	return gin.H{
		"data":        items,
		"total":       total,
		"page":        page,
		"perPage":     perPage,
		"currentSize": len(items),
	}
}

const (
	DefaultMaxPageSize = 1000
)

func PageParamsFromCtx(ctx *gin.Context, defaultPageSize, maxPageSize int) (page, offset, limit int) {
	pageStr, pageSize := ctx.Query("page"), ctx.Query("pageSize")
	page, err := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	limit, err = strconv.Atoi(pageSize)
	if err != nil || limit == 0 {
		limit = defaultPageSize
	}
	if maxPageSize == 0 {
		maxPageSize = DefaultMaxPageSize
	}
	if limit > maxPageSize {
		limit = maxPageSize
	}
	offset = (page - 1) * limit
	return
}
