<?php

use PHPUnit\Framework\TestCase;
use PingDart\SDK\PingDartSDK;

class SDKTest extends TestCase {
    public function testInitialization() {
        $sdk = new PingDartSDK([
            'apiKey' => 'test-key',
            'databaseId' => 'test-db'
        ]);
        $this->assertNotNull($sdk);
        $this->assertNotNull($sdk->database);
        $this->assertNotNull($sdk->whatsapp);
        $this->assertNotNull($sdk->sms);
        $this->assertNotNull($sdk->email);
        $this->assertNotNull($sdk->ai);
        $this->assertNotNull($sdk->calls);
        $this->assertNotNull($sdk->storage);
    }

    public function testMissingApiKey() {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("PingDart SDK: API Key is required");
        new PingDartSDK([]);
    }
}
