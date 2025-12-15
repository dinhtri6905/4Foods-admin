// src-modern/scripts/utils/services/users.service.js

import { apiClient } from '../api.client.js';
import { ENDPOINTS } from '../api.js';

export class UsersService {
    // ========== 1. GET SUMMARY ==========
    static async getSummary() {
        try {
            console.log('🌐 [UsersService] Calling getSummary');
            return await apiClient.get(ENDPOINTS.USERS.SUMMARY);
        } catch (error) {
            console.error('❌ UsersService.getSummary error:', error);
            throw error;
        }
    }

    // ========== 2. GET GROWTH CHART ==========
    static async getGrowthChart(period = '7days') {
        try {
            console.log('🌐 [UsersService] Calling getGrowthChart with period:', period);
            return await apiClient.get(ENDPOINTS.USERS.GROWTH_CHART, { period });
        } catch (error) {
            console.error('❌ UsersService.getGrowthChart error:', error);
            throw error;
        }
    }

    // ========== 3. GET RECENT ACTIVITIES ==========
    static async getRecentActivities(limit = 20) {
        try {
            console.log('🌐 [UsersService] Calling getRecentActivities with limit:', limit);
            const response = await apiClient.get(ENDPOINTS.USERS.RECENT_ACTIVITIES, { limit });
            
            console.log('📡 [UsersService] Recent activities response:', response);
            console.log('📡 [UsersService] Response type:', typeof response);
            console.log('📡 [UsersService] Is Array?', Array.isArray(response));

            // ✅ XỬ LÝ RESPONSE - QUAN TRỌNG!
            if (Array.isArray(response)) {
                console.log('✅ [UsersService] Direct array response');
                return response;
            } else if (response && Array.isArray(response.data)) {
                console.log('✅ [UsersService] Found array in response.data');
                return response.data;
            } else if (response && Array.isArray(response.activities)) {
                console.log('✅ [UsersService] Found array in response.activities');
                return response.activities;
            } else if (response && Array.isArray(response.recentActivities)) {
                console.log('✅ [UsersService] Found array in response.recentActivities');
                return response.recentActivities;
            } else {
                console.warn('⚠️ [UsersService] Unknown response format, returning empty array');
                console.warn('⚠️ [UsersService] Response keys:', response ? Object.keys(response) : 'null');
                return [];
            }
        } catch (error) {
            console.error('❌ UsersService.getRecentActivities error:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            // Return empty array thay vì throw để UI không crash
            return [];
        }
    }

    // ========== 4. GET DIRECTORY ==========
    static async getDirectory(params = {}) {
        try {
            console.log('🌐 [UsersService] Calling getDirectory with params:', params);
            return await apiClient.get(ENDPOINTS.USERS.DIRECTORY, params);
        } catch (error) {
            console.error('❌ UsersService.getDirectory error:', error);
            throw error;
        }
    }

    // ========== 5. BULK ACTION ==========
    static async bulkAction(action, userIds) {
        try {
            console.log('🌐 [UsersService] Calling bulkAction:', { action, userIds });
            return await apiClient.post(ENDPOINTS.USERS.BULK_ACTION, { 
                action, 
                userIds 
            });
        } catch (error) {
            console.error('❌ UsersService.bulkAction error:', error);
            throw error;
        }
    }

    // ========== 6. GET USER DETAIL ==========
    static async getUserDetail(id) {
        try {
            console.log('🌐 [UsersService] Calling getUserDetail:', id);
            return await apiClient.get(`/api/webadmin/users/${id}`);
        } catch (error) {
            console.error('❌ UsersService.getUserDetail error:', error);
            throw error;
        }
    }

    // ========== 7. UPDATE USER ==========
    static async updateUser(id, data) {
        try {
            console.log('🌐 [UsersService] Calling updateUser:', id, data);
            return await apiClient.put(`/api/webadmin/users/${id}`, data);
        } catch (error) {
            console.error('❌ UsersService.updateUser error:', error);
            throw error;
        }
    }

    // ========== 8. DELETE USER ==========
    static async deleteUser(id) {
        try {
            console.log('🌐 [UsersService] Calling deleteUser:', id);
            return await apiClient.delete(`/api/webadmin/users/${id}`);
        } catch (error) {
            console.error('❌ UsersService.deleteUser error:', error);
            throw error;
        }
    }
}
