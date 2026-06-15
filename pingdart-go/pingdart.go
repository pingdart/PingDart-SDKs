package pingdart

import (
	"net/http"
	"pingdart-go/services"
	"strings"
)

type PingDartSDK struct {
	Database *services.DatabaseService
	Calls    *services.CallsService
	Storage  *services.StorageService
	Email    *services.EmailService
	Sms      *services.SmsService
	Ai       *services.AiService
}

func NewPingDartSDK(apiKey, databaseID, baseURL string) *PingDartSDK {
	if baseURL == "" {
		baseURL = "https://cloudapi.pingdart.com/api"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	realtimeBaseURL := strings.Replace(baseURL, "/api", "", 1) + "/api/realtime/"

	client := &http.Client{}

	return &PingDartSDK{
		Database: services.NewDatabaseService(client, apiKey, realtimeBaseURL, databaseID),
		Calls:    services.NewCallsService(client, apiKey, baseURL),
		Storage:  services.NewStorageService(client, apiKey, baseURL),
		Email:    services.NewEmailService(client, apiKey, baseURL),
		Sms:      services.NewSmsService(client, apiKey, baseURL),
		Ai:       services.NewAiService(client, apiKey, baseURL),
	}
}
