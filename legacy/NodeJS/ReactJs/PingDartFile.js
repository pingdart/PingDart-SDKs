"use client";

import axios from 'axios';
import { debugLog } from '../utils/debug';  
const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cloudapi.pingdart.com';

const API_BASE_URL = `${url}/api/realtime/`;
const API_URL = `${url}/api`;

const API_key = process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS || process.env.NEXT_PUBLIC_API_KEY_PINGDART || (() => {
  console.error('API Key is missing! Please add NEXT_PUBLIC_API_KEY_PINGDART to your .env file.');
  return 'defaultApiKey';
})();

// Debug environment variables
console.log('Environment variables check:');
console.log('NEXT_PUBLIC_API_KEY_ONEKLICKS:', process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS);
console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('API_key:', API_key);

class PingDartFileSDK {
  constructor() {
    this.userapikey = process.env.NEXT_PUBLIC_API_KEY_ONEKLICKS;
  }

  async uploadFile(root, status, file) {
    const formData = new FormData();
    
    // Fix status value - ensure it's a valid enum value
    let validStatus = 'public';
    if (status === 'public' || status === 'publish' || status === 'published') {
      validStatus = 'public';
    } else if (status === 'private' || status === 'draft') {
      validStatus = 'private';
    } else {
      validStatus = 'public'; // default to public
    }
    
    formData.append('userapikey', this.userapikey);
    formData.append('root', root);
    formData.append('status', validStatus);
    formData.append('file', file);

    // Debug logging
    console.log('Uploading file with:');
    console.log('userapikey:', this.userapikey);
    console.log('root:', root);
    console.log('status:', status);
    console.log('file:', file);
    console.log('API_URL:', API_URL);
    console.log('API_key:', API_key);

    try {
      const response = await axios.post(`${API_URL}/files/uploads`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-api-key': API_key,
        }
      });

      debugLog('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error response:', error.response?.data);
      return { error: error.response?.data?.error || 'Upload failed' };
    }
  }
  

  async getfile(id) {
    try {
      const response = await axios.post(`${API_URL}/files/getfileurl`, {
        api_key: this.userapikey,
        id: id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_key,
        }
      });
    //   responce
    //   {
    //     "success": true,
    //     "message": "File URL retrieved successfully!",
    //     "fileUrl": "https://apis.oneklicks.com/uploads/3/sfdsf/1746667580082_STOFA RENEWAL_page-0001.jpg",
    //     "fileName": "1746667580082_STOFA RENEWAL_page-0001.jpg",
    //     "createdAt": "2025-05-08 06:56:20",
    //     "updatedAt": "2025-05-08 06:56:20"
    // }
      debugLog('Get file response:', response.data);  
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error);
      return { error: error.response?.data?.error || 'Get file failed' };
    }
  }

  async deleteFile(id) {
    try {
      const response = await axios.post(`${API_URL}/files/deleteFile`, {
        api_key: this.userapikey,
        id: id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_key,
        }
      });
      debugLog('Get file response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error);
      return { error: error.response?.data?.error || 'Get file failed' };
    }
  }
  
  
  async uploadFileFromUrl(root, status, url) {
    debugLog(root, status, url);
    try {
      const response = await axios.post(`${API_URL}/files/uploadFileFromUrl`, {
        userapikey: this.userapikey,
        root: root,
        status: status,
        fileUrl: url
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_key,
        }
      });
      debugLog('Get file response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error);
      return { error: error.response?.data?.error || 'Get file failed' };
    }
  }
}
export const pingDartFile = new PingDartFileSDK();
