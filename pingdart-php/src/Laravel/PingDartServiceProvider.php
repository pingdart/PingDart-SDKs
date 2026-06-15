<?php

namespace PingDart\SDK\Laravel;

use Illuminate\Support\ServiceProvider;
use PingDart\SDK\PingDartSDK;

class PingDartServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/pingdart.php', 'pingdart');

        $this->app->singleton(PingDartSDK::class, function ($app) {
            $config = config('pingdart');
            
            return new PingDartSDK([
                'apiKey' => $config['api_key'],
                'databaseId' => $config['database_id'],
                'baseUrl' => $config['base_url'],
                'realtimeBaseUrl' => $config['realtime_base_url'] ?? null,
            ]);
        });

        $this->app->alias(PingDartSDK::class, 'pingdart');
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot()
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/pingdart.php' => config_path('pingdart.php'),
            ], 'pingdart-config');
        }
    }
}
