<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class EmailService {
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function sendEmail(string $email, string $subject, string $text, array $smtpConfig = null) {
        $payload = [
            'email' => $email,
            'subject' => $subject,
            'text' => $text
        ];
        if ($smtpConfig) {
            $payload['smtpConfig'] = $smtpConfig;
        }

        try {
            $response = $this->http->post('email/send-email', [
                'json' => $payload
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Email sending error: " . $e->getMessage());
        }
    }

    public function bulkSend(array $data, array $smtpConfig = null) {
        $payload = ['data' => $data];
        if ($smtpConfig) {
            $payload['smtpConfig'] = $smtpConfig;
        }

        try {
            $response = $this->http->post('email/bulk-send', [
                'json' => $payload
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Bulk email sending error: " . $e->getMessage());
        }
    }
}
