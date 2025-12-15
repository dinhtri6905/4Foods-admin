// src-modern/scripts/components/login.js

import { AuthService } from '../utils/services/auth.service.js';

class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.alert = document.getElementById('loginAlert');
        this.alertMessage = document.getElementById('loginMessage');
        this.togglePassword = document.getElementById('togglePassword');

        this.init();
    }

    init() {
        console.log('🔐 Login Manager Initialized');
        
        // Event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Auto focus
        this.emailInput.focus();
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        this.togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
    }

    async handleSubmit(e) {
        e.preventDefault();

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        // Validation
        if (!email || !password) {
            this.showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Email không hợp lệ');
            return;
        }

        // Start loading
        this.setLoading(true);
        this.hideError();

        try {
            // Call API
            await AuthService.login(email, password);

            // Success
            this.showSuccess();

            // Redirect
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 500);

        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.loginBtn.disabled = loading;
        
        if (loading) {
            this.loginBtn.innerHTML = `
                <span class="spinner"></span>
                <span>Đang xử lý...</span>
            `;
        } else {
            this.loginBtn.innerHTML = '<span>Đăng nhập</span>';
        }
    }

    showSuccess() {
        this.loginBtn.style.background = 'linear-gradient(135deg, #198754 0%, #146c43 100%)';
        this.loginBtn.innerHTML = '<span>✓ Đăng nhập thành công!</span>';
    }

    showError(message) {
        this.alertMessage.textContent = message;
        this.alert.classList.remove('d-none');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.alert.classList.add('d-none');
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
