<?php

return [
    /**
     * PingDart API Key
     * Get this from your PingDart dashboard.
     */
    'api_key' => env('PINGDART_API_KEY'),

    /**
     * PingDart Database ID
     * The unique ID of the database you want to interact with.
     */
    'database_id' => env('PINGDART_DATABASE_ID'),

    /**
     * PingDart Base URL
     * Default: https://cloudapi.pingdart.com/api
     */
    'base_url' => env('PINGDART_BASE_URL', 'https://cloudapi.pingdart.com/api'),

    /**
     * Realtime Base URL
     * Usually derived from base_url.
     */
    'realtime_base_url' => env('PINGDART_REALTIME_BASE_URL'),
];
