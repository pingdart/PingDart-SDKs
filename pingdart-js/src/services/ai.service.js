import axios from 'axios';

class AiService {
    constructor(http, config, realtimeHttp) {
        this.http = http;
        // Using the main HTTP client to ensure API Key is attached if present
    }

    async callAiApi(message, onProgress, options = {}) {
        try {
            const payload = {
                message: message,
                stream: true,
                model: options.model || "chinnuai:1.1",
                chinuai: options.chinuai || "chinnuai:1.1",
                user_id: options.userId || "default", // Can be overridden
                ...options
            };

            // If running in a Node.js environment or standard browser
            if (typeof fetch === 'function' && !this.http.defaults.adapter) { // Checking if we're not strictly forced into axios node adapter
                // Fallback to fetch if available and preferred for streams in some environments
                // But since we use Axios from PingDartSDK, we should use the configured axios instance
                // We'll proceed to the Axios route below as primary since it has the x-api-key setup
            }

            // Using the configured Axios client (this.http) ensuring headers (`x-api-key`) are passed
            const response = await this.http({
                method: 'post',
                url: '/api/ai/chinuai-chat',
                data: payload,
                responseType: 'stream', // Important for node.js axios streaming
                // if run in browser, axios responseType: 'stream' might not work directly, but since this is Node.js SDK, it's fine.
            });

            return new Promise((resolve, reject) => {
                let fullResult = "";

                // Node.js Axios stream handling
                if (response.data && typeof response.data.on === 'function') {
                    response.data.on('data', (chunk) => {
                        try {
                            // The backend sends Server-Sent Events (SSE) format: 'data: {"chunk": "...", "done": false}\n\n'
                            const lines = chunk.toString().split('\n').filter(line => line.trim());

                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const jsonStr = line.replace('data: ', '').trim();
                                    if (!jsonStr) continue;

                                    const parsed = JSON.parse(jsonStr);

                                    if (parsed.chunk) {
                                        fullResult += parsed.chunk;
                                        if (onProgress) onProgress(parsed.chunk);
                                    }

                                    if (parsed.done) {
                                        resolve(fullResult);
                                    }
                                }
                            }
                        } catch (e) {
                            // Sometimes chunks might be fragmented, standard error handling might misinterpret
                            // For raw text streams fallback:
                            const strChunk = chunk.toString();
                            if (!strChunk.includes('data: {')) {
                                fullResult += strChunk;
                                if (onProgress) onProgress(strChunk);
                            }
                        }
                    });

                    response.data.on('end', () => resolve(fullResult));
                    response.data.on('error', reject);
                } else if (response.data) {
                    // Fallback if not a true stream (e.g. browser polyfill or stream config failed)
                    // If the backend sent a full JSON response instead
                    if (response.data.reply) {
                        const replyStr = typeof response.data.reply === 'string' ? response.data.reply : JSON.stringify(response.data.reply);
                        if (onProgress) onProgress(replyStr);
                        resolve(replyStr);
                    } else {
                        resolve(response.data);
                    }
                } else {
                    resolve(fullResult);
                }
            });

        } catch (error) {
            throw new Error(`AI API Error: ${error.message}`);
        }
    }
}

export default AiService;
