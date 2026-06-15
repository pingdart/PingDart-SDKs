/**
 * Service for handling email operations via the PingDart API.
 */
class EmailService {
    /**
     * @param {import("axios").AxiosInstance} http - Axios instance for making requests
     * @param {Object} config - SDK configuration
     * @param {string} config.apiKey - API key for authentication
     */
    constructor(http, config) {
        this.http = http;
        this.apiKey = config.apiKey;
    }

    /**
     * Sends an email using server-side SMTP with automatic fallback mechanisms.
     * 
     * @param {Object} options - Email options
     * @param {string} options.email - Recipient email address
     * @param {string} options.subject - Email subject line
     * @param {string} options.text - Email body content (plain text)
     * @param {Object} [options.smtpConfigOptions={}] - Optional custom SMTP configuration
     * @param {string} [options.smtpConfigOptions.host] - SMTP server host
     * @param {number|string} [options.smtpConfigOptions.port] - SMTP server port
     * @param {boolean|string} [options.smtpConfigOptions.secure] - Whether to use TLS/SSL
     * @param {string} [options.smtpConfigOptions.user] - SMTP auth username
     * @param {string} [options.smtpConfigOptions.pass] - SMTP auth password
     * @returns {Promise<Object>} - Server response data
     * @throws {Error} - If both primary and fallback attempts fail
     */
    async sendEmail({ email, subject, text, smtpConfigOptions = {} }) {
        // Build SMTP options to potentially allow pass-through custom smtp credentials
        // If undefined, let the backend use defaults or apply custom
        const host = smtpConfigOptions.host || process.env.SMTP_HOST || "mail.pingdart.com";
        const portEnv = smtpConfigOptions.port || process.env.SMTP_PORT || 465;
        const secureEnv = smtpConfigOptions.secure !== undefined ? smtpConfigOptions.secure : true;

        const resolvedPort = Number(portEnv);
        const resolvedSecure = typeof secureEnv === 'string' ? secureEnv.toLowerCase() === 'true' : secureEnv;

        const smtpConfigPrimary = {
            host,
            port: resolvedPort,
            secure: resolvedSecure,
            auth: {
                user: smtpConfigOptions.user || process.env.SMTP_USER || "info@pingdart.com",
                pass: smtpConfigOptions.pass || process.env.SMTP_PASS || ""
            }
        };

        // Fallback config (toggle between common ports)
        const smtpConfigFallback = resolvedPort === 465
            ? { ...smtpConfigPrimary, port: 587, secure: false }
            : { ...smtpConfigPrimary, port: 465, secure: true };

        try {
            const primaryResponse = await this.http.post("email/send-email", {
                smtpConfig: smtpConfigPrimary,
                email,
                subject,
                text,
                api_key: this.apiKey
            });

            if (primaryResponse.data && primaryResponse.data.success === true) {
                return primaryResponse.data;
            }

            // Fallback
            const fallbackResponse = await this.http.post("email/send-email", {
                smtpConfig: smtpConfigFallback,
                email,
                subject,
                text,
                api_key: this.apiKey
            });

            return fallbackResponse.data;
        } catch (error) {
            if (error.response) {
                // Return fallback behavior directly via fallback logic on axios error if possible, but
                // axios throws on non-2xx statuses. So we handle the fallback in the catch block if needed.
                const errData = error.response.data;
                const shouldFallback = typeof errData?.error === 'string' && /ECONNREFUSED|connect|timeout/i.test(errData.error);

                if (shouldFallback) {
                    try {
                        const fallbackFallbackResponse = await this.http.post("email/send-email", {
                            smtpConfig: smtpConfigFallback,
                            email,
                            subject,
                            text,
                            api_key: this.apiKey
                        });
                        return fallbackFallbackResponse.data;
                    } catch (fallbackError) {
                        throw new Error(`Email sending fallback error: ${fallbackError.message}`);
                    }
                }
            }
            throw new Error(`Email sending error: ${error.message}`);
        }
    }
}

export default EmailService;
