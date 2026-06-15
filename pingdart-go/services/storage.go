package services

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type StorageService struct {
	http    *http.Client
	apiKey  string
	baseURL string
}

func NewStorageService(client *http.Client, apiKey, baseURL string) *StorageService {
	return &StorageService{
		http:    client,
		apiKey:  apiKey,
		baseURL: baseURL,
	}
}

func (s *StorageService) GetStats() (interface{}, error) {
	req, _ := http.NewRequest("POST", s.baseURL+"/files/stats", nil)
	req.Header.Set("x-api-key", s.apiKey)
	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}

// ... other storage methods ...
