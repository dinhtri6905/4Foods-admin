// src-modern/scripts/components/users.js
import ApexCharts from 'apexcharts';
import { UsersService } from '../utils/services/users.service.js';

export class UsersManager {
    constructor() {
        this.charts = {};
        this.data = {
            totalUsers: 0,
            activeUsers: 0,
            userDistribution: { users: 0, sellers: 0 },
            recentActivities: [],
            usersDirectory: [],
            pagination: null
        };
        this.selectedUsers = new Set();
        this.currentPeriod = '7days';
        this.filters = {
            search: '',
            role: '',
            accountType: '',
            loginMethod: ''
        };
        this.currentPage = 1;
        
        // Assign to window immediately
        window.usersManager = this;
        
        if (document.getElementById('total-users-count')) {
            this.init();
        }
    }

    async init() {
        console.log('🚀 Users Manager Initialized');
        
        try {
            await Promise.all([
                this.loadSummaryData().catch(e => console.error('Summary error:', e)),
                this.loadGrowthChart().catch(e => console.error('Growth chart error:', e)),
                this.loadRecentActivities().catch(e => console.error('Activities error:', e)),
                this.loadUsersDirectory().catch(e => console.error('Directory error:', e))
            ]);
            
            await this.$nextTick();
            this.renderUI();
            this.setupEventListeners();
            
            console.log('✅ Users page loaded successfully');
            
        } catch (error) {
            console.error('❌ Fatal error loading users:', error);
        }
    }

    $nextTick() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    async loadSummaryData() {
        try {
            const summary = await UsersService.getSummary();
            this.data = { ...this.data, ...summary };
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    async loadGrowthChart(period = '7days') {
        try {
            const chartData = await UsersService.getGrowthChart(period);
            this.renderGrowthChart(chartData);
        } catch (error) {
            console.error('Error loading growth chart:', error);
        }
    }

    async loadRecentActivities() {
        try {
            console.log('📊 Loading recent activities...');
            this.data.recentActivities = await UsersService.getRecentActivities(20);
            
            // Kiểm tra nếu API trả về dữ liệu hợp lệ
            if (!Array.isArray(this.data.recentActivities)) {
                console.warn('⚠️ API returned invalid data format');
                this.data.recentActivities = [];
            }
            
            console.log('✅ Loaded activities:', this.data.recentActivities.length);
        } catch (error) {
            console.error('❌ Error loading activities:', error);
            console.error('API Endpoint:', error.config?.url || 'Unknown');
            console.error('Status:', error.response?.status || 'Network Error');
            this.data.recentActivities = [];
        }
    }

    async loadUsersDirectory() {
        try {
            const params = {
                page: this.currentPage,
                limit: 10,
                ...this.filters
            };
            const response = await UsersService.getDirectory(params);
            this.data.usersDirectory = response.users;
            this.data.pagination = response.pagination;
        } catch (error) {
            console.error('Error loading directory:', error);
        }
    }

    renderUI() {
        this.renderSummaryStats();
        this.renderUserDistributionChart();
        this.renderRecentActivities();
        this.renderUsersDirectory();
    }

    renderSummaryStats() {
        this.setText('total-users-count', this.data.totalUsers.toLocaleString());
        this.setText('active-users-count', this.data.activeUsers.toLocaleString());
    }

    renderGrowthChart(data) {
        const chartEl = document.getElementById('userGrowthChart');
        if (!chartEl) return;
        if (this.charts.growth) this.charts.growth.destroy();

        const options = {
            series: [{ name: 'Người dùng mới', data: data.map(d => d.count) }],
            chart: { 
                type: 'bar', 
                height: 350, 
                toolbar: { show: false },
                background: 'transparent'
            },
            plotOptions: {
                bar: {
                    borderRadius: 6,
                    columnWidth: '60%',
                    distributed: false
                }
            },
            dataLabels: { enabled: false },
            colors: ['#0d6efd'],
            xaxis: {
                categories: data.map(d => d.label),
                labels: { 
                    rotate: -45, 
                    style: { fontSize: '11px', colors: '#6c757d' },
                    trim: false
                }
            },
            yaxis: {
                labels: { 
                    formatter: (val) => Math.round(val),
                    style: { colors: '#6c757d' }
                }
            },
            grid: { borderColor: '#2d3748' },
            tooltip: {
                y: { formatter: (val) => `${val} người dùng` },
                theme: 'dark'
            }
        };

        this.charts.growth = new ApexCharts(chartEl, options);
        this.charts.growth.render();
    }

    renderUserDistributionChart() {
        const chartEl = document.getElementById('userDistributionChart');
        if (!chartEl) return;
        if (this.charts.distribution) this.charts.distribution.destroy();

        const { users, sellers } = this.data.userDistribution;

        const options = {
            series: [users, sellers],
            chart: { type: 'donut', height: 300, background: 'transparent' },
            labels: ['Người dùng', 'Người bán'],
            colors: ['#0d6efd', '#fd7e14'],
            legend: { 
                position: 'bottom', 
                fontSize: '13px', 
                labels: { colors: '#fff' } 
            },
            dataLabels: { 
                enabled: true, 
                formatter: (val) => `${val.toFixed(1)}%`,
                style: { fontSize: '14px', fontWeight: 'bold', colors: ['#fff'] }
            },
            tooltip: {
                y: { formatter: (val) => `${val} tài khoản` },
                theme: 'dark'
            },
            plotOptions: {
                pie: { donut: { size: '65%' } }
            }
        };

        this.charts.distribution = new ApexCharts(chartEl, options);
        this.charts.distribution.render();
    }

    renderRecentActivities() {
        const container = document.getElementById('recent-activities-list');
        
        if (!container) {
            console.warn('⚠️ Container #recent-activities-list not found');
            return;
        }

        console.log('🎨 Rendering activities:', this.data.recentActivities?.length || 0);

        if (!Array.isArray(this.data.recentActivities) || this.data.recentActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    <p class="mb-0">Chưa có hoạt động nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.recentActivities.map(activity => `
            <div class="activity-item d-flex align-items-start p-3 border-bottom border-secondary">
                <div class="activity-icon me-3">
                    <div class="icon-circle bg-${activity.iconColor || 'primary'} bg-opacity-10 text-${activity.iconColor || 'primary'} rounded-circle d-flex align-items-center justify-content-center" 
                         style="width: 40px; height: 40px;">
                        <i class="bi bi-${activity.icon || 'circle-fill'}"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="fw-bold text-white">${activity.user || 'Unknown'}</span>
                            <span class="text-secondary ms-1">${activity.action || 'thực hiện hành động'}</span>
                        </div>
                        <small class="text-muted">${this.formatTime(activity.time)}</small>
                    </div>
                    <small class="text-muted d-block mt-1">${activity.details || ''}</small>
                </div>
            </div>
        `).join('');

        console.log('✅ Activities rendered successfully');
    }

    renderUsersDirectory() {
        const tbody = document.getElementById('users-directory-tbody');
        if (!tbody) return;

        if (this.data.usersDirectory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Không tìm thấy người dùng nào</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.usersDirectory.map(user => `
            <tr class="${this.selectedUsers.has(user._id) ? 'table-active' : ''}">
                <td>
                    <input type="checkbox" 
                           class="form-check-input user-checkbox" 
                           value="${user._id}"
                           ${this.selectedUsers.has(user._id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${user.avatar || '/assets/icons/icon-192.png'}" 
                             class="rounded-circle me-2" 
                             width="32" height="32" 
                             alt="${user.name || user.email}"
                             onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                        <div>
                            <div class="fw-medium text-white">${user.name || user.email}</div>
                            <small class="text-muted">${user.email}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">
                        ${user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.isSeller ? 'bg-warning text-dark' : 'bg-info'}">
                        ${user.isSeller ? 'Seller' : 'Buyer'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-secondary">
                        <i class="bi bi-${this.getLoginMethodIcon(user.loginMethod)} me-1"></i>
                        ${this.getLoginMethodText(user.loginMethod)}
                    </span>
                </td>
                <td class="text-secondary">${new Date(user.updatedAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#"><i class="bi bi-pencil me-2"></i>Edit</a></li>
                            <li><a class="dropdown-item" href="#"><i class="bi bi-eye me-2"></i>View</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.usersManager.deleteUser('${user._id}'); return false;">
                                <i class="bi bi-trash me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const paginationInfo = document.getElementById('pagination-info');
        const paginationNav = document.getElementById('pagination-nav');
        
        if (!this.data.pagination) return;

        const { page, limit, total, pages } = this.data.pagination;
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${start} to ${end} of ${total} results`;
        }

        if (paginationNav) {
            let html = `
                <li class="page-item ${page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
                </li>
            `;

            for (let i = 1; i <= pages; i++) {
                html += `
                    <li class="page-item ${i === page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }

            html += `
                <li class="page-item ${page === pages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${page + 1}">Next</a>
                </li>
            `;

            paginationNav.innerHTML = html;

            // Add event listeners
            paginationNav.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPage = parseInt(e.target.dataset.page);
                    if (!isNaN(targetPage)) {
                        this.goToPage(targetPage);
                    }
                });
            });
        }
    }

    setupEventListeners() {
        // Period filter
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.loadGrowthChart(this.currentPeriod);
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadUsersDirectory().then(() => this.renderUsersDirectory());
                }, 500);
            });
        }

        // Role filter
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filters.role = e.target.value;
                this.currentPage = 1;
                this.loadUsersDirectory().then(() => this.renderUsersDirectory());
            });
        }

        // Account Type filter
        const accountTypeFilter = document.getElementById('account-type-filter');
        if (accountTypeFilter) {
            accountTypeFilter.addEventListener('change', (e) => {
                this.filters.accountType = e.target.value;
                this.currentPage = 1;
                this.loadUsersDirectory().then(() => this.renderUsersDirectory());
            });
        }

        // Login Method filter
        const loginMethodFilter = document.getElementById('login-method-filter');
        if (loginMethodFilter) {
            loginMethodFilter.addEventListener('change', (e) => {
                this.filters.loginMethod = e.target.value;
                this.currentPage = 1;
                this.loadUsersDirectory().then(() => this.renderUsersDirectory());
            });
        }

        // Checkbox selection
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('user-checkbox')) {
                const userId = e.target.value;
                if (e.target.checked) {
                    this.selectedUsers.add(userId);
                } else {
                    this.selectedUsers.delete(userId);
                }
                this.updateBulkActions();
            }

            // Select all
            if (e.target.id === 'select-all-checkbox') {
                const isChecked = e.target.checked;
                this.data.usersDirectory.forEach(user => {
                    if (isChecked) {
                        this.selectedUsers.add(user._id);
                    } else {
                        this.selectedUsers.delete(user._id);
                    }
                });
                this.updateBulkActions();
                this.renderUsersDirectory();
            }
        });

        // Bulk actions
        document.getElementById('bulk-activate-btn')?.addEventListener('click', () => this.bulkAction('activate'));
        document.getElementById('bulk-deactivate-btn')?.addEventListener('click', () => this.bulkAction('deactivate'));
        document.getElementById('bulk-delete-btn')?.addEventListener('click', () => this.bulkAction('delete'));
        document.getElementById('clear-selection-btn')?.addEventListener('click', () => {
            this.selectedUsers.clear();
            this.updateBulkActions();
            this.renderUsersDirectory();
        });
    }

    updateBulkActions() {
        const bulkBar = document.getElementById('bulk-actions-bar');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkBar && selectedCount) {
            if (this.selectedUsers.size > 0) {
                bulkBar.classList.remove('d-none');
                selectedCount.textContent = this.selectedUsers.size;
            } else {
                bulkBar.classList.add('d-none');
            }
        }
    }

    async bulkAction(action) {
        if (this.selectedUsers.size === 0) return;
        
        const actionText = { activate: 'kích hoạt', deactivate: 'vô hiệu hóa', delete: 'xóa' }[action];
        if (!confirm(`Bạn có chắc muốn ${actionText} ${this.selectedUsers.size} tài khoản?`)) return;

        try {
            const userIds = Array.from(this.selectedUsers);
            await UsersService.bulkAction(action, userIds);
            alert(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} thành công!`);
            this.selectedUsers.clear();
            await this.loadUsersDirectory();
            this.renderUsersDirectory();
            this.updateBulkActions();
        } catch (error) {
            console.error('Error bulk action:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
        
        try {
            await UsersService.bulkAction('delete', [userId]);
            alert('Xóa thành công!');
            await this.loadUsersDirectory();
            this.renderUsersDirectory();
        } catch (error) {
            console.error('Error delete user:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async goToPage(page) {
        if (!this.data.pagination) return;
        if (page < 1 || page > this.data.pagination.pages) return;
        
        console.log('📄 Going to page:', page);
        
        this.currentPage = page;
        await this.loadUsersDirectory();
        this.renderUsersDirectory();
        
        document.getElementById('users-directory-tbody')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Utilities
    getLoginMethodIcon(method) {
        const icons = {
            'local': 'envelope-fill',
            'google': 'google',
            'facebook': 'facebook'
        };
        return icons[method] || 'question-circle';
    }

    getLoginMethodText(method) {
        const texts = {
            'local': 'Email',
            'google': 'Google',
            'facebook': 'Facebook'
        };
        return texts[method] || method;
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    formatTime(date) {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.UsersManager = UsersManager;
}
