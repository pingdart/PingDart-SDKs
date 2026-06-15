class StorageService {
    constructor(http, config) {
        this.http = http;
    }

    /**
     * Get storage statistics.
     */
    async getStats() {
        try {
            const response = await this.http.post("/files/stats");
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get storage stats: ${error.message}`);
        }
    }

    /**
     * List all buckets.
     */
    async listBuckets() {
        try {
            const response = await this.http.post("/files/get-buckets");
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list buckets: ${error.message}`);
        }
    }

    /**
     * Create a new bucket.
     */
    async createBucket(name) {
        try {
            const response = await this.http.post("/files/create-bucket", { name });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create bucket: ${error.message}`);
        }
    }

    /**
     * Delete a bucket.
     */
    async deleteBucket(bucketId) {
        try {
            const response = await this.http.post("/files/delete-bucket", { id: bucketId });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete bucket: ${error.message}`);
        }
    }

    /**
     * Upload a file.
     * @param {FormData} formData - The form data containing the file.
     */
    async uploadFile(formData) {
        try {
            const response = await this.http.post("/files/upload", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Delete a file.
     */
    async deleteFile(filePath) {
        try {
            const response = await this.http.post("/files/deleteFile", { filePath });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
}

export default StorageService;
