// src-modern/scripts/components/users.js
import { Modal } from 'bootstrap'; 

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
        this.userDetailModal = null;

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
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                attempt++;
                console.log(`📊 Loading recent activities... (Attempt ${attempt}/${maxRetries})`);
                
                const response = await UsersService.getRecentActivities(20);
                
                // Validate response
                if (Array.isArray(response)) {
                    this.data.recentActivities = response;
                    console.log('✅ Loaded activities:', this.data.recentActivities.length);
                    return; // Success - exit retry loop
                } else {
                    console.warn(`⚠️ Invalid response format (attempt ${attempt}):`, response);
                    this.data.recentActivities = [];
                }
                
            } catch (error) {
                console.error(`❌ Error loading activities (attempt ${attempt}):`, error);
                
                if (attempt === maxRetries) {
                    console.error('💥 All retry attempts failed');
                    this.data.recentActivities = [];
                } else {
                    // Wait before retry (exponential backoff)
                    const waitTime = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
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
        console.log('🎨 Rendering recent activities, container found:', !!container);
        console.log('📦 Recent activities data:', this.data.recentActivities);

        if (!container) {
            console.error('❌ Container #recent-activities-list not found!');
            return;
        }

        if (!this.data.recentActivities || this.data.recentActivities.length === 0) {
            console.warn('⚠️ No recent activities to render');
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-clock-history fs-1 d-block mb-3"></i>
                    <p class="mb-0">Chưa có hoạt động nào</p>
                    <small class="text-secondary">Hoạt động người dùng sẽ hiển thị tại đây</small>
                </div>
            `;
            return;
        }

        console.log('✅ Rendering', this.data.recentActivities.length, 'recent activities');

        container.innerHTML = this.data.recentActivities.map((activity, index) => {
            // Xử lý avatar URL
            let avatarUrl = '/assets/icons/icon-192.png';
            if (activity.user?.avatar) {
                const rawUrl = activity.user.avatar;
                if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
                    avatarUrl = rawUrl;
                } else if (rawUrl.startsWith('/assets')) {
                    avatarUrl = rawUrl;
                } else {
                    const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                    avatarUrl = `https://admin.4foods.app/${cleanPath}`;
                }
            }

            // Xác định icon và màu dựa trên loại activity
            const activityConfig = {
                'login': { icon: 'bi-box-arrow-in-right', color: 'text-success', label: 'Đăng nhập' },
                'logout': { icon: 'bi-box-arrow-right', color: 'text-secondary', label: 'Đăng xuất' },
                'register': { icon: 'bi-person-plus', color: 'text-primary', label: 'Đăng ký' },
                'update_profile': { icon: 'bi-person-gear', color: 'text-info', label: 'Cập nhật' },
                'create_product': { icon: 'bi-plus-circle', color: 'text-success', label: 'Tạo SP' },
                'create_order': { icon: 'bi-cart-plus', color: 'text-warning', label: 'Đặt hàng' },
                'update_order': { icon: 'bi-pencil-square', color: 'text-info', label: 'Cập nhật' },
                'delete': { icon: 'bi-trash', color: 'text-danger', label: 'Xóa' },
                'default': { icon: 'bi-activity', color: 'text-muted', label: 'Hoạt động' }
            };

            const config = activityConfig[activity.action] || activityConfig['default'];

            // Format thời gian
            const timeAgo = this.getTimeAgo(activity.timestamp || activity.createdAt);

            // Xác định badge role
            const roleBadge = activity.user?.role === 'seller' 
                ? '<span class="badge bg-warning text-dark ms-2" style="font-size: 0.65rem;">Seller</span>'
                : activity.user?.role === 'admin'
                ? '<span class="badge bg-danger ms-2" style="font-size: 0.65rem;">Admin</span>'
                : '';

            return `
                <div class="d-flex align-items-start p-3 bg-dark bg-opacity-50 rounded mb-2 position-relative hover-card">
                    <!-- Avatar -->
                    <img src="${avatarUrl}" 
                        class="rounded-circle me-3" 
                        width="50" 
                        height="50" 
                        style="object-fit: cover;"
                        alt="${activity.user?.name || 'User'}"
                        onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                    
                    <!-- Content -->
                    <div class="flex-grow-1">
                        <!-- User Name & Role -->
                        <div class="d-flex align-items-center mb-1">
                            <span class="fw-medium text-white">${activity.user?.name || 'Unknown User'}</span>
                            ${roleBadge}
                        </div>
                        
                        <!-- Email -->
                        <small class="text-muted d-block mb-2">
                            <i class="bi bi-envelope me-1"></i>${activity.user?.email || 'N/A'}
                        </small>
                        
                        <!-- Action -->
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="bi ${config.icon} ${config.color} fs-5"></i>
                            <span class="text-white small">${config.label}</span>
                            ${activity.description ? `
                                <span class="text-muted small">- ${activity.description}</span>
                            ` : ''}
                        </div>
                        
                        <!-- Details & Time -->
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex gap-3">
                                ${activity.ipAddress ? `
                                    <small class="text-secondary">
                                        <i class="bi bi-router me-1"></i>${activity.ipAddress}
                                    </small>
                                ` : ''}
                                ${activity.device ? `
                                    <small class="text-secondary">
                                        <i class="bi bi-phone me-1"></i>${activity.device}
                                    </small>
                                ` : ''}
                            </div>
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>${timeAgo}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Recent activities rendered successfully');
    }

    // Helper function: Tính thời gian trôi qua
    getTimeAgo(timestamp) {
        if (!timestamp) return 'Không rõ';
        
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 7) return `${diffDay} ngày trước`;
        
        return past.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
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
                            <li><a class="dropdown-item view-user-detail-btn" href="#" data-user-id="${user._id}"><i class="bi bi-eye me-2"></i>View</a></li>
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

    // ========== VIEW USER DETAIL ==========
    async handleViewUser(userId) {
        console.log('🔍 Opening user detail for ID:', userId);

        try {
            // Khởi tạo modal (chỉ 1 lần)
            if (!this.userDetailModal) {
                const modalEl = document.getElementById('userDetailModal');
                this.userDetailModal = new Modal(modalEl); 
            }

            // Reset về trạng thái loading
            const loadingDiv = document.getElementById('userDetailLoading');
            const errorDiv = document.getElementById('userDetailError');
            const dataDiv = document.getElementById('userDetailData');

            loadingDiv.classList.remove('d-none');
            errorDiv.classList.add('d-none');
            dataDiv.classList.add('d-none');
            dataDiv.innerHTML = '';

            // Hiển thị modal
            this.userDetailModal.show();

            // Gọi API
            console.log('📡 Fetching user detail from API...');
            const user = await UsersService.getUserDetail(userId);
            console.log('✅ User data received:', user);

            // Ẩn loading, hiện data
            loadingDiv.classList.add('d-none');
            dataDiv.classList.remove('d-none');

            // Render nội dung
            dataDiv.innerHTML = `
                <!-- User Profile Header -->
                <div class="row mb-4">
                    <div class="col-md-3 text-center">
                        <img src="${user.avatar || '/assets/icons/icon-192.png'}" 
                             class="rounded-circle border border-3 border-primary mb-3" 
                             width="120" height="120" 
                             alt="${user.name}"
                             onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                        <div>
                            <span class="badge ${user.role === 'Admin' ? 'bg-danger' : 'bg-primary'} px-3 py-2 fs-6">
                                ${user.role}
                            </span>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <h4 class="text-white mb-2 fw-bold">${user.name}</h4>
                        <p class="text-muted mb-3">
                            <i class="bi bi-envelope-fill me-2"></i>${user.email}
                        </p>
                        <div class="d-flex gap-2 mb-3 flex-wrap">
                            <span class="badge ${user.isSeller ? 'bg-warning text-dark' : 'bg-info'} px-3 py-2">
                                <i class="bi bi-${user.isSeller ? 'shop' : 'person'} me-1"></i>
                                ${user.accountType}
                            </span>
                            <span class="badge bg-secondary px-3 py-2">
                                <i class="bi bi-box-arrow-in-right me-1"></i>
                                ${user.loginMethod}
                            </span>
                        </div>
                        <div class="row g-3">
                            <div class="col-6">
                                <small class="text-muted d-block mb-1">Số điện thoại</small>
                                <span class="text-white fw-medium">${user.phone}</span>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block mb-1">Ngày sinh</small>
                                <span class="text-white fw-medium">${user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="card bg-primary bg-opacity-10 border-primary">
                            <div class="card-body text-center py-3">
                                <i class="bi bi-cart3 fs-1 text-primary mb-2"></i>
                                <h3 class="mb-1 text-white fw-bold">${user.stats.totalOrders}</h3>
                                <small class="text-muted">Đơn hàng</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-success bg-opacity-10 border-success">
                            <div class="card-body text-center py-3">
                                <i class="bi bi-cash-coin fs-1 text-success mb-2"></i>
                                <h3 class="mb-1 text-white fw-bold">${user.stats.totalSpent.toLocaleString('vi-VN')}đ</h3>
                                <small class="text-muted">Tổng chi tiêu</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-warning bg-opacity-10 border-warning">
                            <div class="card-body text-center py-3">
                                <i class="bi bi-coin fs-1 text-warning mb-2"></i>
                                <h3 class="mb-1 text-white fw-bold">${user.coin.toLocaleString('vi-VN')}</h3>
                                <small class="text-muted">Xu tích lũy</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Info -->
                <div class="card bg-secondary bg-opacity-25 border-0 mb-3">
                    <div class="card-body">
                        <h6 class="text-white mb-3 fw-bold">
                            <i class="bi bi-info-circle-fill me-2"></i>Thông tin bổ sung
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <small class="text-muted d-block mb-1">Ngày tham gia</small>
                                <span class="text-white">${new Date(user.createdAt).toLocaleDateString('vi-VN', { 
                                    year: 'numeric', month: 'long', day: 'numeric' 
                                })}</span>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted d-block mb-1">Hoạt động gần nhất</small>
                                <span class="text-white">${new Date(user.lastActive).toLocaleDateString('vi-VN', { 
                                    year: 'numeric', month: 'long', day: 'numeric' 
                                })}</span>
                            </div>
                            <div class="col-12">
                                <small class="text-muted d-block mb-1">CMND/CCCD</small>
                                <span class="text-white">${user.idCardNumber || 'Chưa cập nhật'}</span>
                            </div>
                            <div class="col-12">
                                <small class="text-muted d-block mb-1">Địa chỉ thường trú</small>
                                <span class="text-white">${user.permanentAddress || 'Chưa cập nhật'}</span>
                            </div>
                            <div class="col-12">
                                <small class="text-muted d-block mb-1">Số địa chỉ giao hàng</small>
                                <span class="text-white">${user.stats.addressCount} địa chỉ</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${user.isSeller && user.shop ? `
                <!-- Shop Info -->
                <div class="card bg-warning bg-opacity-10 border-warning">
                    <div class="card-body">
                        <h6 class="text-warning mb-3 fw-bold">
                            <i class="bi bi-shop me-2"></i>Thông tin cửa hàng
                        </h6>
                        <div class="d-flex align-items-center">
                            <img src="${user.shop.avatar || '/assets/icons/icon-192.png'}" 
                                 class="rounded me-3 border border-2 border-warning" 
                                 width="60" height="60" 
                                 onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                            <div>
                                <div class="text-white fw-bold fs-5">${user.shop.name}</div>
                                <small class="text-muted">ID: ${user.shop._id}</small>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            `;

        } catch (error) {
            console.error('❌ Error loading user detail:', error);

            const loadingDiv = document.getElementById('userDetailLoading');
            const errorDiv = document.getElementById('userDetailError');
            const errorMsg = document.getElementById('userDetailErrorMessage');

            loadingDiv.classList.add('d-none');
            errorDiv.classList.remove('d-none');
            errorMsg.textContent = error.message || 'Không thể tải thông tin người dùng. Vui lòng thử lại.';
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

        // ========== VIEW USER DETAIL EVENT ==========
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-user-detail-btn');
            if (viewBtn) {
                e.preventDefault();
                const userId = viewBtn.dataset.userId;
                console.log('👆 View button clicked, userId:', userId);
                if (userId) {
                    this.handleViewUser(userId);
                }
            }
        });

        console.log('✅ User detail event listener registered');
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
