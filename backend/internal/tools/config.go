package tools

var SecretKey = []byte("mihit-kerzazi")

type ErrorApi struct {
	ErrorMessage string `json:"error_message"`
	ErrorCode    int    `json:"error_code"`
}
