<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class SmsService {
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function sendSms(string $to, string $text, string $templateId = null, string $route = 'pingdart', string $unicode = 'true') {
        try {
            $response = $this->http->post('email/send-sms', [
                'json' => [
                    'to' => $to,
                    'text' => $text,
                    'templateId' => $templateId,
                    'route' => $route,
                    'unicode' => $unicode
                ]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("SMS sending error: " . $e->getMessage());
        }
    }
}
