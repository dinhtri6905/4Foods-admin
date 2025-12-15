// src-modern/scripts/utils/api.js

export const API_CONFIG = {
    // BASE_URL: 'http://157.66.101.113:5000', 
    BASE_URL: 'https://admin.4foods.app/api',
    TIMEOUT: 10000,
};

export const ENDPOINTS = {
    // ==================== AUTH ====================
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify'
    },

    // ==================== DASHBOARD ====================
    DASHBOARD: {
        SUMMARY: '/api/webadmin/dashboard/summary',
        REVENUE: '/api/webadmin/dashboard/revenue-chart',
        ACTIVITY: '/api/webadmin/dashboard/activities',
        RECENT_ORDERS: '/api/webadmin/dashboard/recent-orders',
        ORDER_STATUS: '/api/webadmin/dashboard/order-status',
        USER_GROWTH: '/api/webadmin/dashboard/user-growth'
    },

    // ==================== ANALYTICS ====================
    ANALYTICS: {
        SUMMARY: '/api/webadmin/analytics/summary',
        REVENUE_DAILY: '/api/webadmin/analytics/revenue-daily'
    },

    // ==================== USERS ====================
    USERS: {
        SUMMARY: '/api/webadmin/users/summary',
        GROWTH_CHART: '/api/webadmin/users/growth-chart',
        RECENT_ACTIVITIES: '/api/webadmin/users/recent-activities',
        DIRECTORY: '/api/webadmin/users/directory',
        BULK_ACTION: '/api/webadmin/users/bulk-action'
    },

    // ==================== PRODUCTS ====================
    PRODUCTS: {
        SUMMARY: '/api/webadmin/products/summary',
        CATEGORY_SALES_TIMELINE: '/api/webadmin/products/category-sales-timeline',
        TOP_SELLING: '/api/webadmin/products/top-selling',
        CATEGORIES: '/api/webadmin/products/categories',
        CATEGORY_DISTRIBUTION: '/api/webadmin/products/category-distribution',
        LIST: '/api/webadmin/products/list',
        BULK_ACTION: '/api/webadmin/products/bulk-action',
        DELETE: '/api/webadmin/products'
    },

    // ==================== ORDERS ====================
    ORDERS: {
        STATS: '/api/webadmin/orders/stats',
        TRENDS: '/api/webadmin/orders/trends',
        STATUS_DISTRIBUTION: '/api/webadmin/orders/status-distribution',
        LIST: '/api/webadmin/orders/list',
        DETAIL: '/api/webadmin/orders/:id',
        UPDATE_STATUS: '/api/webadmin/orders/:id/status',
        BULK_UPDATE: '/api/webadmin/orders/bulk-update'
    }
};
