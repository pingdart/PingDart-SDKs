<?php

namespace PingDart\SDK\Laravel\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \PingDart\SDK\PingDartSDK
 * 
 * @method static \PingDart\SDK\Services\DatabaseService database()
 * @method static \PingDart\SDK\Services\WhatsAppService whatsapp()
 * @method static \PingDart\SDK\Services\SmsService sms()
 * @method static \PingDart\SDK\Services\EmailService email()
 * @method static \PingDart\SDK\Services\AiService ai()
 * @method static \PingDart\SDK\Services\CallsService calls()
 * @method static \PingDart\SDK\Services\StorageService storage()
 */
class PingDart extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor()
    {
        return 'pingdart';
    }
}
