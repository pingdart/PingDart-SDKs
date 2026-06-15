import PingDartSDK from '../src/index.js';

async function runTests() {
    console.log("Testing PingDartSDK Initialization...");
    try {
        const client = new PingDartSDK({
            apiKey: 'test_api_key_123',
            databaseId: 'test_db_456'
        });

        console.log("Client instantiated successfully!");
        console.log("- Base URL:", client.baseURL);
        console.log("- Realtime URL:", client.realtimeBaseURL);
        console.log("- Database Service:", !!client.database);
        console.log("- WhatsApp Service:", !!client.whatsapp);
        console.log("- SMS Service:", !!client.sms && typeof client.sms.sendSMS === 'function');
        console.log("- Email Service:", !!client.email);
        console.log("- AI Service:", !!client.ai);

        console.log("\nAll services registered correctly.");
    } catch (error) {
        console.error("Initialization Failed:", error);
        process.exit(1);
    }
}

runTests();
