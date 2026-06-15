package services

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type AiService struct {
	http    *http.Client
	apiKey  string
	baseURL string
}

func NewAiService(client *http.Client, apiKey, baseURL string) *AiService {
	return &AiService{
		http:    client,
		apiKey:  apiKey,
		baseURL: baseURL,
	}
}

func (s *AiService) CallAiApi(message string, onProgress func(string), model string, options map[string]interface{}) (string, error) {
	data := map[string]interface{}{
		"message": message,
		"stream":  true,
		"model":   model,
	}
	for k, v := range options {
		data[k] = v
	}

	jsonData, _ := json.Marshal(data)
	req, _ := http.NewRequest("POST", s.baseURL+"/ai/chinuai-chat", bytes.NewBuffer(jsonData))
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var fullResult strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data: ") {
			dataStr := strings.TrimSpace(line[6:])
			if dataStr == "" {
				continue
			}

			var parsed map[string]interface{}
			if err := json.Unmarshal([]byte(dataStr), &parsed); err == nil {
				if chunk, ok := parsed["chunk"].(string); ok {
					fullResult.WriteString(chunk)
					if onProgress != nil {
						onProgress(chunk)
					}
				}
				if done, ok := parsed["done"].(bool); ok && done {
					break
				}
			}
		}
	}

	return fullResult.String(), nil
}

