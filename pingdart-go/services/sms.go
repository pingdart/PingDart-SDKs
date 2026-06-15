package services

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type SmsService struct {
	http    *http.Client
	apiKey  string
	baseURL string
}

func NewSmsService(client *http.Client, apiKey, baseURL string) *SmsService {
	return &SmsService{
		http:    client,
		apiKey:  apiKey,
		baseURL: baseURL,
	}
}

func (s *SmsService) SendSms(to, text, templateID, route, unicode string) (interface{}, error) {
	data := map[string]interface{}{
		"to":         to,
		"text":       text,
		"templateId": templateID,
		"route":      route,
		"unicode":    unicode,
	}
	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequest("POST", s.baseURL+"/email/send-sms", bytes.NewBuffer(jsonData))
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
