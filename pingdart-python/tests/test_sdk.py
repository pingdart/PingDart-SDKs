import pytest
from pingdart_sdk import PingDartSDK

def test_sdk_initialization():
    sdk = PingDartSDK(api_key="test-key", database_id="test-db")
    assert sdk is not None
    assert sdk.http.api_key == "test-key"
    assert sdk.database.database_id == "test-db"

def test_services_mounting():
    sdk = PingDartSDK(api_key="test-key")
    assert hasattr(sdk, 'database')
    assert hasattr(sdk, 'whatsapp')
    assert hasattr(sdk, 'sms')
    assert hasattr(sdk, 'email')
    assert hasattr(sdk, 'ai')
    assert hasattr(sdk, 'calls')
    assert hasattr(sdk, 'storage')

def test_missing_api_key():
    with pytest.raises(ValueError, match="PingDart SDK: API Key is required"):
        PingDartSDK(api_key=None)
