package pingdartdb

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type DBConfig struct {
	Host     string
	User     string
	Password string
	Database string
	Type     string
}

type PingDartDB struct {
	APIKey   string
	DBConfig DBConfig
	DB       *sql.DB
	License  map[string]interface{}
}

func NewPingDartDB(apiKey string, config DBConfig) (*PingDartDB, error) {
	if config.Type == "" {
		config.Type = "mysql"
	}

	if config.Type != "mysql" {
		return nil, errors.New("Unsupported database type. Currently only 'mysql' is fully implemented in Go driver.")
	}

	pd := &PingDartDB{
		APIKey:   apiKey,
		DBConfig: config,
	}

	err := pd.validateKey(apiKey)
	if err != nil {
		return nil, err
	}

	return pd, nil
}

func (p *PingDartDB) validateKey(apiKey string) error {
	if !strings.HasPrefix(apiKey, "pd_") {
		return errors.New("PingDart Authorization Failed: Invalid PingDart License Key format")
	}

	parts := strings.Split(strings.TrimPrefix(apiKey, "pd_"), ".")
	if len(parts) != 2 {
		return errors.New("PingDart Authorization Failed: Invalid PingDart License Key format")
	}

	iv, err := hex.DecodeString(parts[0])
	if err != nil {
		return err
	}

	encryptedText, err := hex.DecodeString(parts[1])
	if err != nil {
		return err
	}

	secretKey := "PingDartSuperSecretKey2026!@#$"
	hash := sha256.Sum256([]byte(secretKey))
	encodedHash := base64.StdEncoding.EncodeToString(hash[:])
	key := []byte(encodedHash[:32])

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	decrypted := make([]byte, len(encryptedText))
	mode.CryptBlocks(decrypted, encryptedText)

	// PKCS7 Unpadding
	paddingLen := int(decrypted[len(decrypted)-1])
	if paddingLen > len(decrypted) {
		return errors.New("Invalid padding")
	}
	decrypted = decrypted[:len(decrypted)-paddingLen]

	var payload map[string]interface{}
	err = json.Unmarshal(decrypted, &payload)
	if err != nil {
		return errors.New("License key is corrupted or tampered with")
	}

	p.License = payload
	return nil
}

func (p *PingDartDB) Connect() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true", 
		p.DBConfig.User, p.DBConfig.Password, p.DBConfig.Host, p.DBConfig.Database)

	db, err := sql.Open(p.DBConfig.Type, dsn)
	if err != nil {
		return err
	}

	err = db.Ping()
	if err != nil {
		return err
	}

	p.DB = db

	if tier, ok := p.License["tier"].(string); ok && tier != "free" {
		err = p.validateLiveServer()
		if err != nil {
			return err
		}
	}

	return nil
}

func (p *PingDartDB) validateLiveServer() error {
	payload := map[string]string{"apiKey": p.APIKey}
	jsonData, _ := json.Marshal(payload)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post("https://cloudapi.pingdart.com/api/realtime/validate-sdk", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return errors.New("PingDart Live Authorization Failed: Connection timeout")
	}
	defer resp.Body.Close()

	var res map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&res)

	if success, ok := res["success"].(bool); !ok || !success {
		return errors.New("PingDart Live Authorization Failed")
	}

	return nil
}

func (p *PingDartDB) Table(tableName string) *QueryBuilder {
	return NewQueryBuilder(tableName, p.DB, p.DBConfig.Type)
}

func (p *PingDartDB) Schema() *SchemaBuilder {
	return NewSchemaBuilder(p.DB, p.DBConfig.Type)
}

func (p *PingDartDB) Close() error {
	if p.DB != nil {
		return p.DB.Close()
	}
	return nil
}
