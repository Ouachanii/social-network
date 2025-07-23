package handlers

import (
	"net/http"
)

// HomeHandler redirects to /home and displays app content
func HomeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/home" {
		http.Redirect(w, r, "/home", http.StatusSeeOther)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`
		
	`))
}
