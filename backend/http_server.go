package gobridge

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"
	"time"
)

// JSONRPCRequest represents a JSON-RPC 2.0 request
type JSONRPCRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      interface{} `json:"id"`
}

// JSONRPCResponse represents a JSON-RPC 2.0 response
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   *JSONRPCError `json:"error,omitempty"`
	ID      interface{} `json:"id"`
}

// JSONRPCError represents a JSON-RPC 2.0 error
type JSONRPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// HTTPServer manages the local HTTP server
type HTTPServer struct {
	server *http.Server
	port   int
	mu     sync.RWMutex
}

var (
	globalServer *HTTPServer
	serverMu     sync.Mutex
)

// NewHTTPServer creates a new HTTP server instance
func NewHTTPServer() *HTTPServer {
	return &HTTPServer{}
}

// StartServer starts the HTTP server on an available port
func (s *HTTPServer) StartServer() (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server != nil {
		return s.port, fmt.Errorf("server already running on port %d", s.port)
	}

	// Find an available port
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return 0, fmt.Errorf("failed to find available port: %v", err)
	}
	s.port = listener.Addr().(*net.TCPAddr).Port
	listener.Close()

	// Create HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("/jsonrpc", s.handleJSONRPC)
	mux.HandleFunc("/health", s.handleHealth)

	s.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", s.port),
		Handler: mux,
	}

	// Start server in background
	go func() {
		log.Printf("Starting HTTP server on port %d", s.port)
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP server error: %v", err)
		}
	}()

	// Wait a moment for server to start
	time.Sleep(100 * time.Millisecond)

	return s.port, nil
}

// StopServer stops the HTTP server
func (s *HTTPServer) StopServer() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := s.server.Shutdown(ctx)
	s.server = nil
	s.port = 0

	return err
}

// GetPort returns the current server port
func (s *HTTPServer) GetPort() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.port
}

// handleHealth provides a simple health check endpoint
func (s *HTTPServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"port":   fmt.Sprintf("%d", s.port),
	})
}

// handleJSONRPC handles JSON-RPC requests
func (s *HTTPServer) handleJSONRPC(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		s.writeError(w, nil, -32600, "Invalid Request")
		return
	}

	var req JSONRPCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, nil, -32700, "Parse error")
		return
	}

	response := s.processRequest(req)
	json.NewEncoder(w).Encode(response)
}

// processRequest processes a JSON-RPC request
func (s *HTTPServer) processRequest(req JSONRPCRequest) JSONRPCResponse {
	if req.JSONRPC != "2.0" {
		return JSONRPCResponse{
			JSONRPC: "2.0",
			Error:   &JSONRPCError{Code: -32600, Message: "Invalid Request"},
			ID:      req.ID,
		}
	}

	switch req.Method {
	case "getGreeting":
		params, ok := req.Params.(map[string]interface{})
		if !ok {
			return s.errorResponse(req.ID, -32602, "Invalid params")
		}
		name, ok := params["name"].(string)
		if !ok {
			return s.errorResponse(req.ID, -32602, "Missing or invalid 'name' parameter")
		}
		result := fmt.Sprintf("Hello %s from Go!", name)
		return JSONRPCResponse{JSONRPC: "2.0", Result: result, ID: req.ID}

	case "getCurrentTime":
		result := time.Now().Format("2006-01-02 15:04:05")
		return JSONRPCResponse{JSONRPC: "2.0", Result: result, ID: req.ID}

	case "calculate":
		params, ok := req.Params.(map[string]interface{})
		if !ok {
			return s.errorResponse(req.ID, -32602, "Invalid params")
		}
		a, aOk := params["a"].(float64)
		b, bOk := params["b"].(float64)
		if !aOk || !bOk {
			return s.errorResponse(req.ID, -32602, "Missing or invalid 'a' or 'b' parameters")
		}
		result := int(a) + int(b)
		return JSONRPCResponse{JSONRPC: "2.0", Result: result, ID: req.ID}

	case "getSystemInfo":
		result := fmt.Sprintf("Go version: %s", "1.24")
		return JSONRPCResponse{JSONRPC: "2.0", Result: result, ID: req.ID}

	default:
		return s.errorResponse(req.ID, -32601, "Method not found")
	}
}

// errorResponse creates an error response
func (s *HTTPServer) errorResponse(id interface{}, code int, message string) JSONRPCResponse {
	return JSONRPCResponse{
		JSONRPC: "2.0",
		Error:   &JSONRPCError{Code: code, Message: message},
		ID:      id,
	}
}

// writeError writes an error response
func (s *HTTPServer) writeError(w http.ResponseWriter, id interface{}, code int, message string) {
	response := s.errorResponse(id, code, message)
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(response)
}

// Global functions for mobile API

// StartHTTPServer starts the global HTTP server
func StartHTTPServer() int {
	serverMu.Lock()
	defer serverMu.Unlock()

	if globalServer != nil {
		return globalServer.GetPort()
	}

	globalServer = NewHTTPServer()
	port, err := globalServer.StartServer()
	if err != nil {
		log.Printf("Failed to start server: %v", err)
		return 0
	}

	return port
}

// StopHTTPServer stops the global HTTP server
func StopHTTPServer() {
	serverMu.Lock()
	defer serverMu.Unlock()

	if globalServer != nil {
		globalServer.StopServer()
		globalServer = nil
	}
}

// GetHTTPServerPort returns the current server port
func GetHTTPServerPort() int {
	serverMu.Lock()
	defer serverMu.Unlock()

	if globalServer == nil {
		return 0
	}

	return globalServer.GetPort()
}