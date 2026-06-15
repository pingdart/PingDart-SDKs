<?php

namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class StorageService {
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function getStats() {
        try {
            $response = $this->http->post('files/stats');
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to get storage stats: " . $e->getMessage());
        }
    }

    public function listBuckets() {
        try {
            $response = $this->http->post('files/get-buckets');
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to list buckets: " . $e->getMessage());
        }
    }

    public function createBucket(string $name) {
        try {
            $response = $this->http->post('files/create-bucket', [
                'json' => ['name' => $name]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to create bucket: " . $e->getMessage());
        }
    }

    public function deleteBucket($id) {
        try {
            $response = $this->http->post('files/delete-bucket', [
                'json' => ['id' => $id]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to delete bucket: " . $e->getMessage());
        }
    }

    public function uploadFile(string $filePath, string $bucketName = null, string $destination = null) {
        try {
            $multipart = [
                [
                    'name'     => 'file',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => basename($filePath)
                ]
            ];

            if ($bucketName) {
                $multipart[] = ['name' => 'bucket_name', 'contents' => $bucketName];
            }
            if ($destination) {
                $multipart[] = ['name' => 'destination', 'contents' => $destination];
            }

            $response = $this->http->post('files/upload', [
                'multipart' => $multipart
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to upload file: " . $e->getMessage());
        }
    }

    public function deleteFile(string $filePath) {
        try {
            $response = $this->http->post('files/deleteFile', [
                'json' => ['filePath' => $filePath]
            ]);
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            throw new \Exception("Failed to delete file: " . $e->getMessage());
        }
    }
}
