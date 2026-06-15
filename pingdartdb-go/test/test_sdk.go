package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/pingdart/pingdartdb-go"
)

func generateValidKey() string {
	secretKey := "PingDartSuperSecretKey2026!@#$"
	hash := sha256.Sum256([]byte(secretKey))
	encodedHash := base64.StdEncoding.EncodeToString(hash[:])
	key := []byte(encodedHash[:32])

	iv := make([]byte, 16)
	rand.Read(iv)

	payload := map[string]string{"tier": "free", "createdAt": time.Now().Format(time.RFC3339)}
	jsonData, _ := json.Marshal(payload)

	// PKCS7 Padding
	padding := 16 - len(jsonData)%16
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	jsonData = append(jsonData, padtext...)

	block, _ := aes.NewCipher(key)
	mode := cipher.NewCBCEncrypter(block, iv)

	encrypted := make([]byte, len(jsonData))
	mode.CryptBlocks(encrypted, jsonData)

	return "pd_" + hex.EncodeToString(iv) + "." + hex.EncodeToString(encrypted)
}

func main() {
	fmt.Println("1. Generated Local Go Offline API Key")
	apiKey := generateValidKey()

	config := pingdartdb.DBConfig{
		Host:     "94.136.190.60",
		User:     "pingdart_ravi",
		Password: "Ravindra12@",
		Database: "pingdart_test",
		Type:     "mysql",
	}

	db, err := pingdartdb.NewPingDartDB(apiKey, config)
	if err != nil {
		fmt.Printf("❌ Go Test failed: %v\n", err)
		return
	}

	err = db.Connect()
	if err != nil {
		fmt.Printf("❌ Go Test failed: %v\n", err)
		return
	}
	defer db.Close()
	fmt.Println("2. Connection successful.")

	options := map[string]interface{}{
		"conditions": map[string]interface{}{
			"status": "active",
		},
	}

	res, err := db.Table("test_users").Read(options)
	if err != nil {
		fmt.Printf("❌ Go Test failed during read: %v\n", err)
		return
	}

	fmt.Printf("3. Basic Read test returned %v rows.\n", res["totalCount"])
	fmt.Println("\n✅ Go SDK Connection Test passed successfully!")
}
