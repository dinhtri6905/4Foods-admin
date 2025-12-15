// src-modern/scripts/utils/services/users.service.js
import { apiClient } from '../api.client.js';
import { ENDPOINTS } from '../api.js';

export const UsersService = {
    async getSummary() {
        return await apiClient.get(ENDPOINTS.USERS.SUMMARY);
    },

    async getGrowthChart(period = '7days') {
        return await apiClient.get(ENDPOINTS.USERS.GROWTH_CHART, { period });
    },

    async getRecentActivities(limit = 20) {
        return await apiClient.get(ENDPOINTS.USERS.RECENT_ACTIVITIES, { limit });
    },

    async getDirectory(params = {}) {
        return await apiClient.get(ENDPOINTS.USERS.DIRECTORY, params);
    },

    async bulkAction(action, userIds) {
        return await apiClient.post(ENDPOINTS.USERS.BULK_ACTION, { action, userIds });
    },

    async getUserDetail(id) {
        return await apiClient.get(`/api/webadmin/users/${id}`);
    }
};
