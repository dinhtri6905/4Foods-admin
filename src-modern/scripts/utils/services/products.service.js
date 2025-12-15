import { apiClient } from '../api.client.js';
import { ENDPOINTS } from '../api.js';

export class ProductsService {
    // ========== 1. GET SUMMARY ==========
    static async getSummary() {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.SUMMARY);
        } catch (error) {
            console.error('❌ ProductsService.getSummary error:', error);
            throw error;
        }
    }

    // ========== 2. GET CATEGORY SALES TIMELINE ==========
    static async getCategorySalesTimeline() {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORY_SALES_TIMELINE);
        } catch (error) {
            console.error('❌ ProductsService.getCategorySalesTimeline error:', error);
            throw error;
        }
    }

    // ========== 3. GET TOP SELLING ==========
    static async getTopSelling() {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.TOP_SELLING);
        } catch (error) {
            console.error('❌ ProductsService.getTopSelling error:', error);
            throw error;
        }
    }

    // ========== 4. GET CATEGORIES ==========
    static async getCategories() {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORIES);
        } catch (error) {
            console.error('❌ ProductsService.getCategories error:', error);
            throw error;
        }
    }

    // ========== 5. GET CATEGORY DISTRIBUTION ==========
    static async getCategoryDistribution() {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.CATEGORY_DISTRIBUTION);
        } catch (error) {
            console.error('❌ ProductsService.getCategoryDistribution error:', error);
            throw error;
        }
    }

    // ========== 6. GET PRODUCTS LIST ==========
    static async getProductsList(params) {
        try {
            return await apiClient.get(ENDPOINTS.PRODUCTS.LIST, params);
        } catch (error) {
            console.error('❌ ProductsService.getProductsList error:', error);
            throw error;
        }
    }

    // ========== 7. DELETE PRODUCT ==========
    static async deleteProduct(id) {
        try {
            // ✅ SỬA: Dùng trực tiếp đường dẫn thay vì BASE bị lỗi
            return await apiClient.delete(`/api/webadmin/products/${id}`);
        } catch (error) {
            console.error('❌ ProductsService.deleteProduct error:', error);
            throw error;
        }
    }

    // ========== 8. BULK ACTION ==========
    static async bulkAction(action, productIds) {
        try {
            return await apiClient.post(ENDPOINTS.PRODUCTS.BULK_ACTION, { 
                action, 
                productIds 
            });
        } catch (error) {
            console.error('❌ ProductsService.bulkAction error:', error);
            throw error;
        }
    }

    // ========== 9. GET PRODUCT DETAIL ==========
    static async getProductDetail(id) {
        try {
            console.log('🌐 [ProductsService] Calling API Detail:', id);
            return await apiClient.get(`/api/webadmin/products/${id}`);
        } catch (error) {
            console.error('❌ ProductsService.getProductDetail error:', error);
            throw error;
        }
    }
}
