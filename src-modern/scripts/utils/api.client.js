// src-modern/scripts/utils/api.client.js

import { API_CONFIG } from './api.js';

/**
 * HTTP Client để gọi API
 */
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    // ==================== GET ====================
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        
        // Thêm query params nếu có
        Object.keys(params).forEach(key =>
            url.searchParams.append(key, params[key])
        );

        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm token nếu có
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            });

            // Xử lý 401 - Token hết hạn
            if (response.status === 401) {
                console.warn('⚠️ Unauthorized! Redirecting to login...');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('loginTime');
                window.location.href = '/login.html';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Request Failed:', error);
            throw error;
        }
    }

    // ==================== POST ====================
    async post(endpoint, data = {}) {
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm token nếu có
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });

            // Xử lý 401 - Token hết hạn
            if (response.status === 401) {
                console.warn('⚠️ Unauthorized! Redirecting to login...');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('loginTime');
                window.location.href = '/login.html';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API Request Failed:', error);
            throw error;
        }
    }

    // ==================== PUT ====================
    async put(endpoint, data = {}) {
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm token nếu có
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });

            // Xử lý 401 - Token hết hạn
            if (response.status === 401) {
                console.warn('⚠️ Unauthorized! Redirecting to login...');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('loginTime');
                window.location.href = '/login.html';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API PUT Request Failed:', error);
            throw error;
        }
    }

    // ==================== DELETE ====================
    async delete(endpoint) {
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('adminToken');
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    // Thêm token nếu có
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
            });

            // Xử lý 401 - Token hết hạn
            if (response.status === 401) {
                console.warn('⚠️ Unauthorized! Redirecting to login...');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                localStorage.removeItem('loginTime');
                window.location.href = '/login.html';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ API DELETE Request Failed:', error);
            throw error;
        }
    }
}

export const apiClient = new ApiClient(API_CONFIG.BASE_URL);
