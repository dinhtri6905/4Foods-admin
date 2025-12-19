// src-modern/scripts/utils/services/dashboard.service.js
import { apiClient } from '../api.client.js';
import { ENDPOINTS } from '../api.js';

export default class DashboardService {
  static async getSummaryStats() {
    return await apiClient.get(ENDPOINTS.DASHBOARD.SUMMARY);
  }

  static async getRevenueChartData() {
    return await apiClient.get(ENDPOINTS.DASHBOARD.REVENUE);
  }

  static async getRecentActivities(limit = 10) {
    return await apiClient.get(ENDPOINTS.DASHBOARD.ACTIVITY, { limit });
  }

  static async getRecentOrders(limit = 7) {
    return await apiClient.get(ENDPOINTS.DASHBOARD.RECENT_ORDERS, { limit });
  }

  static async getOrderStatusDistribution() {
    return await apiClient.get(ENDPOINTS.DASHBOARD.ORDER_STATUS);
  }

  static async getUserGrowthData() {
    return await apiClient.get(ENDPOINTS.DASHBOARD.USER_GROWTH);
  }

  static async getPendingProducts() {
    return await apiClient.get(ENDPOINTS.DASHBOARD.PENDING_PRODUCTS);
  }

  static async reviewProduct(id, action) {
    return await apiClient.post(ENDPOINTS.DASHBOARD.REVIEW_PRODUCT, { id, action });
  }
} 
