// src-modern/scripts/utils/services/auth.service.js

import { apiClient } from '../api.client.js';

/**
 * Authentication Service
 * Quản lý đăng nhập, đăng xuất và session
 */
export const AuthService = {
    /**
     * Đăng nhập Admin
     */
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', { 
                email, 
                password 
            });

            // Kiểm tra role admin
            if (response.user.role !== 'admin') {
                throw new Error('Tài khoản không có quyền truy cập quản trị');
            }

            // Lưu session
            this.setSession(response);
            
            console.log('✅ Login successful:', response.user.email);
            return response;

        } catch (error) {
            console.error('❌ Login failed:', error);
            throw error;
        }
    },

    /**
     * Đăng xuất
     */
    logout() {
        console.log('🚪 Logging out...');
        this.clearSession();
        window.location.href = '/login.html';
    },

    /**
     * Lưu token và user info
     */
    setSession(data) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.user));
        localStorage.setItem('loginTime', Date.now().toString());
    },

    /**
     * Xóa session
     */
    clearSession() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('loginTime');
    },

    /**
     * Lấy token
     */
    getToken() {
        return localStorage.getItem('adminToken');
    },

    /**
     * Lấy thông tin user
     */
    getUser() {
        try {
            const userStr = localStorage.getItem('adminInfo');
            return userStr ? JSON.parse(userStr) : {};
        } catch (error) {
            console.error('Error parsing user info:', error);
            return {};
        }
    },

    /**
     * Kiểm tra đã đăng nhập chưa
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        
        // Phải có token VÀ role là admin
        return !!token && user.role === 'admin';
    },

    /**
     * Kiểm tra token hết hạn (7 ngày)
     */
    isTokenExpired() {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return true;

        const now = Date.now();
        const elapsed = now - parseInt(loginTime);
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        return elapsed > SEVEN_DAYS;
    }
};

export default AuthService;
