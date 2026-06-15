package services

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type EmailService struct {
	http    *http.Client
	apiKey  string
	baseURL string
}

func NewEmailService(client *http.Client, apiKey, baseURL string) *EmailService {
	return &EmailService{
		http:    client,
		apiKey:  apiKey,
		baseURL: baseURL,
	}
}

func (s *EmailService) SendEmail(email, subject, text string, smtpConfig interface{}) (interface{}, error) {
	data := map[string]interface{}{
		"email":   email,
		"subject": subject,
		"text":    text,
	}
	if smtpConfig != nil {
		data["smtpConfig"] = smtpConfig
	}
	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequest("POST", s.baseURL+"/email/send-email", bytes.NewBuffer(jsonData))
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
