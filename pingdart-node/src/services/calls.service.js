class CallsService {
    constructor(http, config) {
        this.http = http;
    }

    /**
     * List all call applications for the authenticated user.
     * @returns {Promise<Object>} The server response containing the list of apps.
     */
    async listApps() {
        try {
            const response = await this.http.get("v1/calls/apps");
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list call apps: ${error.message}`);
        }
    }

    /**
     * Create a new call application.
     * @param {string} name - The name of the application.
     * @param {string} [type='Web'] - The type of application (e.g., Web, Mobile).
     * @returns {Promise<Object>} The server response containing the created app details.
     */
    async createApp(name, type = 'Web') {
        try {
            const response = await this.http.post("v1/calls/apps", { name, type });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create call app: ${error.message}`);
        }
    }

    /**
     * Delete a call application.
     * @param {number|string} id - The ID of the application to delete.
     * @returns {Promise<Object>} The server response.
     */
    async deleteApp(id) {
        try {
            const response = await this.http.delete(`v1/calls/apps/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete call app: ${error.message}`);
        }
    }
}

export default CallsService;
