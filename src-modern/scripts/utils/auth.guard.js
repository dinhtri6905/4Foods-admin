// src-modern/scripts/utils/auth.guard.js

import { AuthService } from './services/auth.service.js';

/**
 * Auth Guard - Bảo vệ các trang admin
 */
export function initAuthGuard() {
    const currentPath = window.location.pathname;
    
    console.log('🔒 Auth Guard checking:', currentPath);

    // Danh sách trang public
    const publicPages = ['/login.html', '/login'];
    const isPublicPage = publicPages.some(page => 
        currentPath.endsWith(page) || currentPath === page
    );

    // Nếu đang ở trang Login
    if (isPublicPage) {
        if (AuthService.isAuthenticated()) {
            console.log('✅ Already authenticated, redirecting to dashboard...');
            window.location.href = '/index.html';
        }
        return;
    }

    // Nếu đang ở trang Admin (Protected)
    if (!AuthService.isAuthenticated()) {
        console.warn('⛔ Not authenticated! Redirecting to login...');
        AuthService.clearSession();
        window.location.href = '/login.html';
        return;
    }

    // Kiểm tra token hết hạn
    if (AuthService.isTokenExpired()) {
        console.warn('⏰ Token expired! Please login again.');
        AuthService.logout();
        return;
    }

    console.log('✅ Auth Guard passed');
}

/**
 * Setup nút logout
 */
export function setupLogoutButton() {
    // Tìm tất cả element có data-action="logout"
    const logoutButtons = document.querySelectorAll('[data-action="logout"], .logout-btn, #logoutBtn');
    
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                AuthService.logout();
            }
        });
    });

    console.log(`🔓 Setup ${logoutButtons.length} logout button(s)`);
}

/**
 * Hiển thị thông tin user
 */
export function displayUserInfo() {
    const user = AuthService.getUser();
    
    // Tên user
    const userNameElements = document.querySelectorAll('[data-user-name], .user-name');
    userNameElements.forEach(el => {
        el.textContent = user.name || user.email || 'Admin';
    });

    // Avatar
    const userAvatarElements = document.querySelectorAll('[data-user-avatar], .user-avatar');
    userAvatarElements.forEach(el => {
        if (user.avatar) {
            el.src = user.avatar;
        }
    });

    // Email
    const userEmailElements = document.querySelectorAll('[data-user-email], .user-email');
    userEmailElements.forEach(el => {
        el.textContent = user.email || '';
    });

    console.log('👤 User info displayed:', user.name || user.email);
}
