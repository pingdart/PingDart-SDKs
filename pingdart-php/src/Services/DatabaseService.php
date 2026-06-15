<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class DatabaseService {
    private $http;
    private $databaseId;

    public function __construct(Client $http, string $databaseId = null) {
        $this->http = $http;
        $this->databaseId = $databaseId;
    }

    private function post(string $endpoint, array $data) {
        if (!isset($data['databaseid'])) {
            $data['databaseid'] = $this->databaseId;
        }

        try {
            $response = $this->http->post($endpoint, [
                'json' => $data
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function create(string $schema, string $table, array $data, array $conditions = []) {
        return $this->post('dynamicCreate', [
            'tableSchema' => $schema,
            'tableName' => $table,
            'data' => $data,
            'conditions' => $conditions
        ]);
    }

    public function read(string $schema, string $table, array $conditions = [], array $options = []) {
        return $this->post('dynamicRead', array_merge([
            'tableSchema' => $schema,
            'tableName' => $table,
            'conditions' => $conditions
        ], $options));
    }

    public function update(string $schema, string $table, array $data, array $condition) {
        return $this->post('dynamicUpdate', [
            'tableSchema' => $schema,
            'tableName' => $table,
            'data' => $data,
            'condition' => $condition
        ]);
    }

    public function delete(string $schema, string $table, array $condition) {
        return $this->post('dynamicDelete', [
            'tableSchema' => $schema,
            'tableName' => $table,
            'condition' => $condition
        ]);
    }

    public function count(string $schema, string $table, array $conditions = []) {
        return $this->post('dynamicCount', [
            'tableSchema' => $schema,
            'tableName' => $table,
            'conditions' => $conditions
        ]);
    }
}
