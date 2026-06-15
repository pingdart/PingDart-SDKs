import PingDart from "../src/index.js";

describe("PingDart SDK Client", () => {
    const config = {
        apiKey: "test-key",
        databaseId: "test-db"
    };

    test("should initialize successfully", () => {
        const sdk = new PingDart(config);
        expect(sdk).toBeDefined();
        expect(sdk.apiKey).toBe(config.apiKey);
        expect(sdk.databaseId).toBe(config.databaseId);
    });

    test("should have all services mounted", () => {
        const sdk = new PingDart(config);
        expect(sdk.database).toBeDefined();
        expect(sdk.whatsapp).toBeDefined();
        expect(sdk.sms).toBeDefined();
        expect(sdk.email).toBeDefined();
        expect(sdk.ai).toBeDefined();
        expect(sdk.calls).toBeDefined();
        expect(sdk.storage).toBeDefined();
    });

    test("should throw error if apiKey is missing", () => {
        expect(() => new PingDart({})).toThrow("PingDart SDK: API Key is required");
    });
});
