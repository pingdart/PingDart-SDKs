package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type CallsService struct {
	http    *http.Client
	apiKey  string
	baseURL string
}

func NewCallsService(client *http.Client, apiKey, baseURL string) *CallsService {
	return &CallsService{
		http:    client,
		apiKey:  apiKey,
		baseURL: baseURL,
	}
}

func (s *CallsService) ListApps() (interface{}, error) {
	req, err := http.NewRequest("GET", s.baseURL+"/v1/calls/apps", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("X-SDK-Source", "PingDart-Go-SDK")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

func (s *CallsService) CreateApp(name, appType string) (interface{}, error) {
	data := map[string]string{"name": name, "type": appType}
	jsonData, _ := json.Marshal(data)

	req, err := http.NewRequest("POST", s.baseURL+"/v1/calls/apps", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

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
