// src-modern/scripts/utils/services/products.service.js
import { apiClient } from '../api.client.js';
import { ENDPOINTS } from '../api.js';

export const ProductsService = {
    async getSummary() {
        return await apiClient.get(ENDPOINTS.PRODUCTS.SUMMARY);
    },

    async getCategorySalesTimeline() {
        return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORY_SALES_TIMELINE);
    },

    async getTopSelling() {
        return await apiClient.get(ENDPOINTS.PRODUCTS.TOP_SELLING);
    },

    async getCategories() {
        return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORIES);
    },

    async getCategoryDistribution() {
        return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORY_DISTRIBUTION);
    },

    async getProductsList(params = {}) {
        return await apiClient.get(ENDPOINTS.PRODUCTS.LIST, params);
    },

    async bulkAction(action, productIds) {
        return await apiClient.post(ENDPOINTS.PRODUCTS.BULK_ACTION, { action, productIds });
    },

    async deleteProduct(productId) {
        return await apiClient.delete(`${ENDPOINTS.PRODUCTS.DELETE}/${productId}`);
    },

    async getProductDetail(id) {
        return await apiClient.get(`/products/${id}`); 
    }
};
