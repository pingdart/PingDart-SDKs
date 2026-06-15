class StorageService {
    constructor(http, config, apiKey) {
        this.http = http;
        this.apiKey = apiKey;
    }

    /**
     * Get storage statistics.
     */
    async getStats() {
        try {
            const response = await this.http.post("files/stats", { 
                api_key: this.apiKey 
            });
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
            const response = await this.http.post("files/get-buckets", {
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list buckets: ${error.message}`);
        }
    }

    /**
     * Create a new bucket.
     * @param {string} name - The name of the bucket.
     */
    async createBucket(name) {
        try {
            const response = await this.http.post("files/create-bucket", { 
                name,
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create bucket: ${error.message}`);
        }
    }

    /**
     * Delete a bucket.
     * @param {string|number} bucketId - The database ID of the bucket.
     */
    async deleteBucket(bucketId) {
        try {
            const response = await this.http.post("files/delete-bucket", { 
                id: bucketId,
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete bucket: ${error.message}`);
        }
    }

    /**
     * Create a folder within a bucket.
     * @param {string} name - The name of the folder.
     * @param {Object} [options={}] - Additional folder options.
     * @param {string|number} [options.bucketId] - The ID of the parent bucket.
     * @param {string|number} [options.parentFolderId] - The ID of the parent folder.
     * @param {string} [options.root=""] - The root path.
     */
    async createFolder(name, options = {}) {
        try {
            const response = await this.http.post("files/create-folder", {
                foldername: name,
                Bucket_idold: options.bucketId,
                parentFolderId: options.parentFolderId,
                root: options.root || "",
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }

    /**
     * List items (files and folders) within a bucket or folder.
     * @param {Object} [options={}] - Listing options.
     * @param {string} [options.folderName] - The name of the folder to list contents from.
     * @param {number} [options.page=1] - Pagination page number.
     */
    async listItems(options = {}) {
        try {
            const response = await this.http.post("files/cloud-storage", {
                foldername: options.folderName,
                page: options.page || 1,
                api_key: this.apiKey,
                login_token: options.loginToken || "" // Fallback for legacy
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to list storage items: ${error.message}`);
        }
    }

    /**
     * Upload a file.
     * @param {FormData} formData - The form data containing the file and metadata.
     * @param {Object} [options={}] - Optional metadata overrides.
     * @param {string|number} [options.bucketId] - Explicitly set the bucket ID.
     * @param {string|number} [options.folderId] - Explicitly set the parent folder ID.
     */
    async uploadFile(formData, options = {}) {
        try {
            // Ensure api_key is in the formData if not already there
            if (typeof formData.append === 'function' && !formData.has('api_key')) {
                formData.append('api_key', this.apiKey);
            }

            // Append optional bucket or folder IDs if provided in options
            if (options.bucketId) formData.append('Bucket_idold', options.bucketId);
            if (options.folderId) formData.append('folderId', options.folderId);

            const response = await this.http.post("files/upload", formData, {
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
     * @param {string|number} id - The database ID of the file.
     */
    async deleteFile(id) {
        try {
            const response = await this.http.post("files/deleteFile", { 
                id,
                api_key: this.apiKey
            });
            return response.data;
        } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
}

export default StorageService;
