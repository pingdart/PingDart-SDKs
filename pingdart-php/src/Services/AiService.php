namespace PingDart\SDK\Services;

use GuzzleHttp\Client;

class AiService {
    /** @var Client */
    private $http;

    public function __construct(Client $http) {
        $this->http = $http;
    }

    public function callAiApi(string $message, callable $onProgress = null, string $model = 'chinnuai:1.1', array $options = []) {
        $payload = array_merge([
            'message' => $message,
            'stream' => true,
            'model' => $model
        ], $options);

        try {
            $response = $this->http->post('ai/chinuai-chat', [
                'json' => $payload,
                'stream' => true
            ]);

            $body = $response->getBody();
            $fullResult = "";

            while (!$body->eof()) {
                $line = $this->readLine($body);
                if (strpos($line, 'data: ') === 0) {
                    $jsonStr = substr($line, 6);
                    if (empty(trim($jsonStr))) continue;

                    $parsed = json_decode($jsonStr, true);
                    if (isset($parsed['chunk'])) {
                        $fullResult .= $parsed['chunk'];
                        if ($onProgress) {
                            $onProgress($parsed['chunk']);
                        }
                    }
                    if (isset($parsed['done']) && $parsed['done']) {
                        break;
                    }
                }
            }

            return $fullResult;
        } catch (\Exception $e) {
            throw new \Exception("AI API Error: " . $e->getMessage());
        }
    }

    private function readLine($stream) {
        $buffer = "";
        while (!$stream->eof()) {
            $char = $stream->read(1);
            if ($char === "\n") break;
            $buffer .= $char;
        }
        return trim($buffer);
    }
}
