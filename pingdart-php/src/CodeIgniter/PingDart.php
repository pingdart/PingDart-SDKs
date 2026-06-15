<?php

namespace PingDart\SDK\CodeIgniter;

use PingDart\SDK\PingDartSDK;

class PingDart
{
    /**
     * Get the PingDart SDK instance.
     * Use this in your CI4 Services.
     *
     * @return PingDartSDK
     */
    public static function instance()
    {
        return new PingDartSDK([
            'apiKey' => env('PINGDART_API_KEY'),
            'databaseId' => env('PINGDART_DATABASE_ID'),
            'baseUrl' => env('PINGDART_BASE_URL', 'https://cloudapi.pingdart.com/api'),
        ]);
    }
}
