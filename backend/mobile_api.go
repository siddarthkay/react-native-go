package gobridge

// MobileAPI is the main struct exposed to mobile apps
// Only used for JSON-RPC server management
type MobileAPI struct{}

// NewMobileAPI creates a new instance of MobileAPI
func NewMobileAPI() *MobileAPI {
	return &MobileAPI{}
}

// StartServer starts the HTTP JSON-RPC server and returns the port
func (m *MobileAPI) StartServer() int {
	return StartHTTPServer()
}

// StopServer stops the HTTP JSON-RPC server
func (m *MobileAPI) StopServer() {
	StopHTTPServer()
}

// GetServerPort returns the current JSON-RPC server port
func (m *MobileAPI) GetServerPort() int {
	return GetHTTPServerPort()
}