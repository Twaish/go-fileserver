package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"
)

const (
	UploadDir = "./uploads"
	SharedDir = "./shared"
	Port      = ":8080"
)

func main() {
	if err := os.MkdirAll(UploadDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}
	if err := os.MkdirAll(SharedDir, os.ModePerm); err != nil {
		log.Fatalf("Failed to create shared directory: %v", err)
	}

	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/public/", http.StripPrefix("/public/", fs))

	sharedFs := http.FileServer(http.Dir(SharedDir))
	http.Handle("/shared/", http.StripPrefix("/shared/", sharedFs))

	http.HandleFunc("/", handleHome)
	http.HandleFunc("/upload", handleUpload)
	http.HandleFunc("/api/files", handleListFiles)

	fmt.Printf("🚀 Server running on http://localhost%s\n", Port)
	fmt.Printf("📥 Drop server-side files into: %s\n", SharedDir)
	log.Fatal(http.ListenAndServe(Port, nil))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, "./public/index.html")
}

func handleListFiles(w http.ResponseWriter, r *http.Request) {
	files, err := os.ReadDir(SharedDir)
	if err != nil {
		http.Error(w, "Unable to read shared directory", http.StatusInternalServerError)
		return
	}

	var fileList []string
	for _, file := range files {
		if !file.IsDir() {
			fileList = append(fileList, file.Name())
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fileList)
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	encodedFilename := r.Header.Get("X-File-Name")
	if encodedFilename == "" {
		http.Error(w, "Missing X-File-Name header", http.StatusBadRequest)
		return
	}

	filename, err := url.QueryUnescape(encodedFilename)
	if err != nil {
		http.Error(w, "Invalid filename encoding", http.StatusBadRequest)
		return
	}

	filename = filepath.Base(filename)
	uniqueFilename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filename)
	dstPath := filepath.Join(UploadDir, uniqueFilename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Failed to create local file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	buffer := make([]byte, 1024*1024)
	_, err = io.CopyBuffer(dst, r.Body, buffer)
	if err != nil {
		http.Error(w, "Failed during file streaming: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Upload complete!")
}
