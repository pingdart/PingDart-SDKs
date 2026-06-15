package pingdart

import (
	"testing"
)

func TestSDKInitialization(t *testing.T) {
	apiKey := "test-key"
	dbID := "test-db"
	sdk := NewPingDartSDK(apiKey, dbID, "")

	if sdk == nil {
		t.Fatal("Expected SDK to be initialized")
	}

	if sdk.Database == nil {
		t.Error("Expected Database service to be mounted")
	}

	if sdk.Calls == nil {
		t.Error("Expected Calls service to be mounted")
	}
}
