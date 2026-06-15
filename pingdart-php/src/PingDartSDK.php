<?php

namespace PingDart\SDK;

use GuzzleHttp\Client;
use PingDart\SDK\Services\DatabaseService;
use PingDart\SDK\Services\WhatsAppService;
use PingDart\SDK\Services\SmsService;
use PingDart\SDK\Services\EmailService;
use PingDart\SDK\Services\AiService;
use PingDart\SDK\Services\CallsService;
use PingDart\SDK\Services\StorageService;

class PingDartSDK {
    public $database;
    public $whatsapp;
    public $sms;
    public $email;
    public $ai;
    public $calls;
    public $storage;

    private $apiKey;
    private $databaseId;
    private $baseUrl;
    private $realtimeBaseUrl;

    public function __construct(array $config) {
        $this->apiKey = $config['apiKey'] ?? null;
        if (!$this->apiKey) {
            throw new \Exception("PingDart SDK: API Key is required");
        }

        $this->databaseId = $config['databaseId'] ?? null;
        $this->baseUrl = rtrim($config['baseUrl'] ?? 'https://cloudapi.pingdart.com/api', '/');
        $this->realtimeBaseUrl = $config['realtimeBaseUrl'] ?? str_replace('/api', '', $this->baseUrl) . '/api/realtime/';

        $client = new Client([
            'base_uri' => $this->baseUrl . '/',
            'headers' => [
                'x-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'X-SDK-Source' => 'PingDart-PHP-SDK'
            ]
        ]);

        $realtimeClient = new Client([
            'base_uri' => $this->realtimeBaseUrl,
            'headers' => [
                'x-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
                'X-SDK-Source' => 'PingDart-PHP-SDK'
            ]
        ]);

        $this->database = new DatabaseService($realtimeClient, $this->databaseId);
        $this->whatsapp = new WhatsAppService($client);
        $this->sms = new SmsService($client);
        $this->email = new EmailService($client);
        $this->ai = new AiService($client);
        $this->calls = new CallsService($client);
        $this->storage = new StorageService($client);
    }
}
