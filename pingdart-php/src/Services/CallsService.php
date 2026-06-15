<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class CallsService {
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function listApps() {
        try {
            $response = $this->http->get('v1/calls/apps');
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to list call apps: " . $e->getMessage());
        }
    }

    public function createApp(string $name, string $type = 'Web') {
        try {
            $response = $this->http->post('v1/calls/apps', [
                'json' => ['name' => $name, 'type' => $type]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to create call app: " . $e->getMessage());
        }
    }

    public function deleteApp($id) {
        try {
            $response = $this->http->delete("v1/calls/apps/{$id}");
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to delete call app: " . $e->getMessage());
        }
    }
}
