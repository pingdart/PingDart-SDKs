package com.pingdart.sdk;

import org.junit.Test;
import static org.junit.Assert.*;

public class PingDartSDKTest {

    @Test
    public void testSDKInitialization() {
        String apiKey = "test-key";
        String dbId = "test-db";
        PingDartSDK sdk = new PingDartSDK(apiKey, dbId, null, null);

        assertNotNull("SDK should be initialized", sdk);
        assertNotNull("Database service should be mounted", sdk.database);
        assertNotNull("WhatsApp service should be mounted", sdk.whatsapp);
        assertNotNull("Calls service should be mounted", sdk.calls);
        assertNotNull("Storage service should be mounted", sdk.storage);
        assertNotNull("Email service should be mounted", sdk.email);
        assertNotNull("SMS service should be mounted", sdk.sms);
        assertNotNull("AI service should be mounted", sdk.ai);
    }
}
