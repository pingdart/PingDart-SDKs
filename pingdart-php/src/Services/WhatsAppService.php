<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class WhatsAppService {
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function initialize(string $clientId, string $phoneNumber) {
        try {
            $response = $this->http->post('whatsapp/initialize-whatsapp', [
                'json' => ['clientId' => $clientId, 'phoneNumber' => $phoneNumber]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to initialize WhatsApp: " . $e->getMessage());
        }
    }

    public function sendMessage(array $params) {
        if (!isset($params['clientId'], $params['to']) || (!isset($params['message']) && !isset($params['mediaData']))) {
            throw new \InvalidArgumentException("clientId, to, and message/mediaData are required");
        }

        try {
            $response = $this->http->post('whatsapp/send-message', [
                'json' => [
                    'clientId' => $params['clientId'],
                    'phoneNumber' => $params['to'],
                    'message' => $params['message'] ?? null,
                    'type' => $params['type'] ?? 'text',
                    'mediaData' => $params['mediaData'] ?? null,
                    'mimetype' => $params['mimetype'] ?? null,
                    'filename' => $params['filename'] ?? null
                ]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to send WhatsApp message: " . $e->getMessage());
        }
    }

    public function checkStatus(string $clientId) {
        try {
            $response = $this->http->post('whatsapp/check-status', [
                'json' => ['clientId' => $clientId]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to check WhatsApp status: " . $e->getMessage());
        }
    }
}
