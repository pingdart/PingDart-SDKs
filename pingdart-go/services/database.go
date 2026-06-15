package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type DatabaseService struct {
	http       *http.Client
	apiKey     string
	baseURL    string
	databaseID string
}

func NewDatabaseService(client *http.Client, apiKey, baseURL, databaseID string) *DatabaseService {
	return &DatabaseService{
		http:       client,
		apiKey:     apiKey,
		baseURL:    baseURL,
		databaseID: databaseID,
	}
}

func (s *DatabaseService) postRequest(endpoint string, data map[string]interface{}) (map[string]interface{}, error) {
	if _, ok := data["databaseid"]; !ok {
		data["databaseid"] = s.databaseID
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", s.baseURL+endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-SDK-Source", "PingDart-Go-SDK")

	resp, err := s.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func (s *DatabaseService) Create(schema, table string, data map[string]interface{}, conditions map[string]interface{}) (map[string]interface{}, error) {
	return s.postRequest("dynamicCreate", map[string]interface{}{
		"tableSchema": schema,
		"tableName":   table,
		"data":        data,
		"conditions":  conditions,
	})
}

func (s *DatabaseService) Read(schema, table string, conditions map[string]interface{}) (map[string]interface{}, error) {
	return s.postRequest("dynamicRead", map[string]interface{}{
		"tableSchema": schema,
		"tableName":   table,
		"conditions":  conditions,
	})
}

// ... other methods ...
