// src-modern/scripts/components/orders.js
import { Modal } from 'bootstrap';

import ApexCharts from 'apexcharts';
import { OrdersService } from '../utils/services/orders.service.js';

export class OrdersManager {
    constructor() {
        this.charts = {};
        this.data = {
            // Stats
            totalOrders: 0,
            todayOrders: 0,
            todayRevenue: 0,

            // Charts
            trends: {
                categories: [],
                series: []
            },
            statusDistribution: [],

            // Table
            ordersList: [],
            pagination: null
        };

        this.selectedOrders = new Set();
        this.filters = {
            search: '',
            status: '',
            paymentMethod: '',
            startDate: '',
            endDate: ''
        };
        this.currentPage = 1;
        this.orderDetailModal = null;
        
        // Expose to window for inline handlers
        window.ordersManager = this;

        // Initialize if on orders page
        if (document.getElementById('total-orders-count')) {
            this.init();
        }
    }

    async init() {
        console.log('🚀 Orders Manager Initialized');
        try {
            await Promise.all([
                this.loadStats().catch(e => console.error('Stats error:', e)),
                this.loadTrends().catch(e => console.error('Trends error:', e)),
                this.loadStatusDistribution().catch(e => console.error('Distribution error:', e)),
                this.loadOrdersList().catch(e => console.error('Orders list error:', e))
            ]);

            await this.$nextTick();
            this.renderUI();
            this.setupEventListeners();
            console.log('✅ Orders page loaded successfully');
        } catch (error) {
            console.error('❌ Fatal error loading orders:', error);
        }
    }

    $nextTick() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    // ==================== DATA LOADING ====================

    async loadStats() {
        try {
            const stats = await OrdersService.getStats();
            this.data.totalOrders = stats.totalOrders || 0;
            this.data.todayOrders = stats.todayOrders || 0;
            this.data.todayRevenue = stats.todayRevenue || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadTrends() {
        try {
            this.data.trends = await OrdersService.getTrends();
        } catch (error) {
            console.error('Error loading trends:', error);
        }
    }

    async loadStatusDistribution() {
        try {
            this.data.statusDistribution = await OrdersService.getStatusDistribution();
        } catch (error) {
            console.error('Error loading status distribution:', error);
        }
    }

    async loadOrdersList() {
        try {
            const params = {
                page: this.currentPage,
                limit: 10,
                ...this.filters
            };
            const response = await OrdersService.getOrdersList(params);
            this.data.ordersList = response.orders;
            this.data.pagination = response.pagination;
        } catch (error) {
            console.error('Error loading orders list:', error);
        }
    }

    // ==================== RENDERING ====================

    renderUI() {
        this.renderStats();
        this.renderTrendsChart();
        this.renderStatusChart();
        this.renderOrdersList();
        this.populateStatusFilter();
    }

    renderStats() {
        this.setText('total-orders-count', this.data.totalOrders.toLocaleString());
        this.setText('today-orders-count', this.data.todayOrders.toLocaleString());
        this.setText('today-revenue-amount', `${this.data.todayRevenue.toLocaleString('vi-VN')}₫`);
    }

    renderTrendsChart() {
        const chartEl = document.getElementById('orderTrendsChart');
        if (!chartEl) return;

        if (this.charts.trends) this.charts.trends.destroy();

        const { categories, series } = this.data.trends;

        if (!series || series.length === 0) {
            chartEl.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                    <p class="mb-0">Chưa có dữ liệu đơn hàng</p>
                </div>
            `;
            return;
        }

        const options = {
            series: [{
                name: 'Đơn hàng',
                data: series
            }],
            chart: {
                type: 'area',
                height: 350,
                toolbar: { show: false },
                background: 'transparent'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            colors: ['#0d6efd'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2,
                }
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories: categories,
                labels: {
                    style: { colors: '#6c757d' }
                }
            },
            yaxis: {
                labels: {
                    formatter: (val) => Math.round(val),
                    style: { colors: '#6c757d' }
                }
            },
            grid: {
                borderColor: '#2d3748'
            },
            tooltip: {
                y: {
                    formatter: (val) => `${val} đơn hàng`
                },
                theme: 'dark'
            }
        };

        this.charts.trends = new ApexCharts(chartEl, options);
        this.charts.trends.render();
    }

    renderStatusChart() {
        const chartEl = document.getElementById('orderStatusChart');
        if (!chartEl) return;

        if (this.charts.status) this.charts.status.destroy();

        if (this.data.statusDistribution.length === 0) {
            chartEl.innerHTML = `
                <div class="text-center text-muted py-5">
                    <p class="mb-0">Chưa có dữ liệu</p>
                </div>
            `;
            return;
        }

        const labels = this.data.statusDistribution.map(d => this.getStatusText(d._id));
        const series = this.data.statusDistribution.map(d => d.count);

        const options = {
            series: series,
            chart: {
                type: 'donut',
                height: 350,
                background: 'transparent'
            },
            labels: labels,
            colors: ['#ffc107', '#0dcaf0', '#20c997', '#198754', '#dc3545', '#6c757d', '#6610f2'],
            legend: {
                position: 'bottom',
                fontSize: '12px',
                labels: { colors: '#fff' }
            },
            dataLabels: {
                enabled: true,
                formatter: (val) => `${val.toFixed(1)}%`,
                style: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                    colors: ['#fff']
                }
            },
            tooltip: {
                y: {
                    formatter: (val) => `${val} đơn`
                },
                theme: 'dark'
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%'
                    }
                }
            }
        };

        this.charts.status = new ApexCharts(chartEl, options);
        this.charts.status.render();
    }

    renderOrdersList() {
        const tbody = document.getElementById('orders-list-tbody');
        if (!tbody) return;

        if (this.data.ordersList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        Không tìm thấy đơn hàng nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.ordersList.map(order => `
            <tr class="${this.selectedOrders.has(order._id) ? 'table-active' : ''}">
                <td>
                    <input type="checkbox" 
                           class="form-check-input order-checkbox" 
                           value="${order._id}"
                           ${this.selectedOrders.has(order._id) ? 'checked' : ''}>
                </td>
                <td>
                    <a href="#" class="text-primary fw-bold" onclick="window.ordersManager.viewOrder('${order._id}'); return false;">
                        #${order._id.slice(-6).toUpperCase()}
                    </a>
                </td>
                <td>
                    <div>
                        <div class="fw-medium text-white">${order.user?.name || order.address?.name || 'Khách vãng lai'}</div>
                        <small class="text-muted">${order.user?.phone || order.address?.phone || 'Chưa cập nhật'}</small>
                    </div>
                </td>
                <td>
                    <div>${this.renderOrderItems(order.items)}</div>
                </td>
                <td class="text-white">${order.total.toLocaleString('vi-VN')}₫</td>
                <td>${this.renderStatusBadge(order.status)}</td>
                <td>
                    <div class="text-muted small">
                        ${new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        <br>
                        ${new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                </td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item view-order-detail-btn" href="#" data-order-id="${order._id}">
                                    <i class="bi bi-eye me-2"></i>Xem chi tiết
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="window.ordersManager.updateOrderStatus('${order._id}', 'delivered'); return false;">
                                    <i class="bi bi-check-circle me-2"></i>Đánh dấu đã giao
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="window.ordersManager.cancelOrder('${order._id}'); return false;">
                                    <i class="bi bi-x-circle me-2"></i>Hủy đơn
                                </a>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderOrderItems(items) {
        if (!items || items.length === 0) {
            return '<span class="text-muted">-</span>';
        }
        
        const firstItem = items[0];
        const remaining = items.length - 1;
        
        // ✅ Helper: Xử lý URL ảnh
        let imageUrl = '/assets/icons/icon-192.png';
        
        if (firstItem.product && firstItem.product.imageUrl) {
            const rawUrl = firstItem.product.imageUrl;
            
            // Nếu là URL tuyệt đối (http/https) → Dùng ngay
            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
                imageUrl = rawUrl;
            } 
            // Nếu là local asset (/assets/...) → Giữ nguyên
            else if (rawUrl.startsWith('/assets')) {
                imageUrl = rawUrl;
            }
            // Nếu là relative path → Thêm base URL
            else {
                const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl;
                imageUrl = `https://admin.4foods.app/${cleanPath}`;
            }
        }
        
        return `
            <div class="d-flex align-items-center">
                <img 
                    src="${imageUrl}" 
                    class="rounded me-2" 
                    width="30" 
                    height="30" 
                    style="object-fit: cover" 
                    alt="${firstItem.name || 'Product'}"
                    onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'"
                >
                <div>
                    <div class="small text-white">${firstItem.name}</div>
                    ${remaining > 0 ? `<small class="text-muted">+${remaining} sản phẩm khác</small>` : ''}
                </div>
            </div>
        `;
    }

    renderStatusBadge(status) {
        const statusConfig = {
            'processing': { class: 'bg-warning text-dark', text: 'Đang xử lý' },
            'shipping': { class: 'bg-info', text: 'Đang giao' },
            'arrived': { class: 'bg-primary', text: 'Đã đến' },
            'delivered': { class: 'bg-success', text: 'Đã giao' },
            'cancelled': { class: 'bg-danger', text: 'Đã hủy' },
            'refund_pending': { class: 'bg-secondary', text: 'Chờ hoàn tiền' },
            'refunded': { class: 'bg-dark', text: 'Đã hoàn tiền' }
        };

        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return `<span class="badge ${config.class}">${config.text}</span>`;
    }

    renderPagination() {
        const paginationInfo = document.getElementById('pagination-info');
        const paginationNav = document.getElementById('pagination-nav');

        if (!this.data.pagination) return;

        const { currentPage, totalPages, totalItems, limit } = this.data.pagination;
        const start = (currentPage - 1) * limit + 1;
        const end = Math.min(currentPage * limit, totalItems);

        if (paginationInfo) {
            paginationInfo.textContent = `Showing ${start} to ${end} of ${totalItems} results`;
        }

        if (paginationNav) {
            let html = `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
                </li>
            `;

            for (let i = 1; i <= Math.min(totalPages, 5); i++) {
                html += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }

            html += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
                </li>
            `;

            paginationNav.innerHTML = html;

            // Bind pagination click events
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

    populateStatusFilter() {
        const statusFilter = document.getElementById('status-filter');
        if (!statusFilter) return;

        statusFilter.innerHTML = `
            <option value="">Tất cả trạng thái</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="arrived">Đã đến</option>
            <option value="delivered">Đã giao</option>
            <option value="cancelled">Đã hủy</option>
            <option value="refund_pending">Chờ hoàn tiền</option>
            <option value="refunded">Đã hoàn tiền</option>
        `;
    }

    // ========== VIEW ORDER DETAIL ==========
    async handleViewOrder(orderId) {
        console.log('🔍 Opening order detail for ID:', orderId);

        try {
            // Khởi tạo modal (chỉ 1 lần)
            if (!this.orderDetailModal) {
                const modalEl = document.getElementById('orderDetailModal');
                this.orderDetailModal = new Modal(modalEl);
            }

            // Reset về trạng thái loading
            const loadingDiv = document.getElementById('orderDetailLoading');
            const errorDiv = document.getElementById('orderDetailError');
            const dataDiv = document.getElementById('orderDetailData');

            loadingDiv.classList.remove('d-none');
            errorDiv.classList.add('d-none');
            dataDiv.classList.add('d-none');
            dataDiv.innerHTML = '';

            // Hiển thị modal
            this.orderDetailModal.show();

            // Gọi API
            console.log('📡 Fetching order detail from API...');
            const order = await OrdersService.getOrderDetail(orderId);
            console.log('✅ Order data received:', order);

            // Ẩn loading, hiện data
            loadingDiv.classList.add('d-none');
            dataDiv.classList.remove('d-none');

            // Get status badge class and label
            const statusConfig = {
                'processing': { class: 'bg-info', label: 'Đang xử lý', icon: 'hourglass-split' },
                'shipping': { class: 'bg-primary', label: 'Đang giao', icon: 'truck' },
                'arrived': { class: 'bg-warning text-dark', label: 'Đã đến', icon: 'geo-alt-fill' },
                'delivered': { class: 'bg-success', label: 'Đã giao', icon: 'check-circle-fill' },
                'cancelled': { class: 'bg-secondary', label: 'Đã hủy', icon: 'x-circle-fill' },
                'refund_pending': { class: 'bg-warning', label: 'Chờ hoàn tiền', icon: 'clock-history' },
                'refunded': { class: 'bg-danger', label: 'Đã hoàn tiền', icon: 'arrow-counterclockwise' }
            };

            const statusInfo = statusConfig[order.status] || statusConfig['processing'];

            // Render nội dung
            dataDiv.innerHTML = `
                <div class="row">
                    <!-- Left Column: Order Info -->
                    <div class="col-md-6">
                        <!-- Order Summary Card -->
                        <div class="card bg-secondary bg-opacity-25 border-0 mb-3">
                            <div class="card-body">
                                <h6 class="text-white mb-3 fw-bold">
                                    <i class="bi bi-info-circle-fill me-2"></i>Thông tin đơn hàng
                                </h6>
                                <div class="row g-3">
                                    <div class="col-12">
                                        <small class="text-muted d-block">Mã đơn hàng</small>
                                        <span class="text-white font-monospace">#${order._id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Ngày đặt</small>
                                        <span class="text-white">${new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                            year: 'numeric', month: 'long', day: 'numeric', 
                                            hour: '2-digit', minute: '2-digit'
                                        })}</span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Trạng thái</small>
                                        <span class="badge ${statusInfo.class} px-3 py-2">
                                            <i class="bi bi-${statusInfo.icon} me-1"></i>${statusInfo.label}
                                        </span>
                                    </div>
                                    <div class="col-6">
                                        <small class="text-muted d-block">Phương thức thanh toán</small>
                                        <span class="text-white">
                                            <i class="bi bi-${order.paymentMethod === 'cod' ? 'cash' : 'credit-card'} me-1"></i>
                                            ${order.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : 'MoMo'}
                                        </span>
                                    </div>
                                    ${order.estimatedTime ? `
                                    <div class="col-6">
                                        <small class="text-muted d-block">Thời gian giao hàng dự kiến</small>
                                        <span class="text-white">${order.estimatedTime.start} - ${order.estimatedTime.end}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Customer Info Card -->
                        ${order.user ? `
                        <div class="card bg-primary bg-opacity-10 border-primary mb-3">
                            <div class="card-body">
                                <h6 class="text-primary mb-3 fw-bold">
                                    <i class="bi bi-person-fill me-2"></i>Thông tin khách hàng
                                </h6>
                                <div class="mb-2">
                                    <small class="text-muted d-block">Họ tên</small>
                                    <span class="text-white">${order.user.fullname || order.user.name || 'Chưa cập nhật'}</span>
                                </div>
                                <div class="mb-2">
                                    <small class="text-muted d-block">Số điện thoại</small>
                                    <span class="text-white">
                                        <i class="bi bi-telephone-fill me-1"></i>${order.user.phone || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div>
                                    <small class="text-muted d-block">Email</small>
                                    <span class="text-white">
                                        <i class="bi bi-envelope-fill me-1"></i>${order.user.email}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Delivery Address Card -->
                        <div class="card bg-warning bg-opacity-10 border-warning">
                            <div class="card-body">
                                <h6 class="text-warning mb-3 fw-bold">
                                    <i class="bi bi-geo-alt-fill me-2"></i>Địa chỉ giao hàng
                                </h6>
                                <div class="text-white">
                                    <div class="mb-2">
                                        <strong>${order.address.name || 'Người nhận'}</strong>
                                    </div>
                                    <div class="mb-1">
                                        <i class="bi bi-telephone me-1"></i>${order.address.phone}
                                    </div>
                                    <div>
                                        <i class="bi bi-house-door me-1"></i>
                                        ${order.address.detail || ''}, 
                                        ${order.address.ward || ''}, 
                                        ${order.address.district || ''}, 
                                        ${order.address.province || ''}
                                    </div>
                                    ${order.address.note ? `
                                        <div class="mt-2 p-2 bg-dark bg-opacity-25 rounded">
                                            <small class="text-muted">Ghi chú:</small>
                                            <div class="text-white">${order.address.note}</div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Order Items & Payment -->
                    <div class="col-md-6">
                        <!-- Order Items Card -->
                        <div class="card bg-secondary bg-opacity-25 border-0 mb-3">
                            <div class="card-body">
                                <h6 class="text-white mb-3 fw-bold">
                                    <i class="bi bi-cart-fill me-2"></i>Sản phẩm (${order.items.length})
                                </h6>
                                <div class="list-group list-group-flush bg-transparent">
                                    ${order.items.map(item => {
                                        // Helper function inline
                                        const getImageUrl = (imageData) => {
                                            if (!imageData) return '/assets/icons/icon-192.png';
                                            const imagePath = Array.isArray(imageData) ? imageData[0] : imageData;
                                            if (!imagePath) return '/assets/icons/icon-192.png';
                                            if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                                                return imagePath;
                                            }
                                            const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
                                            return `https://admin.4foods.app/${cleanPath}`;
                                        };
                                        
                                        return `
                                        <div class="list-group-item bg-dark bg-opacity-50 border-secondary mb-2 rounded">
                                            <div class="d-flex align-items-center">
                                            <img src="${(() => {
                                                const product = item.product;
                                                if (!product || !product.imageUrl) return '/assets/icons/icon-192.png';
                                                const url = product.imageUrl;
                                                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                                                if (url.startsWith('/assets')) return url;
                                                return 'https://admin.4foods.app/' + (url.startsWith('/') ? url.substring(1) : url);
                                            })()}" 
                                                class="rounded me-3" 
                                                width="60" 
                                                height="60"
                                                style="object-fit: cover"
                                                onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'"
                                                alt="${item.name || 'Product'}">
                                                <div class="flex-grow-1">
                                                    <div class="text-white fw-bold mb-1">${item.name}</div>
                                                    <div class="text-muted small">
                                                        Số lượng: <span class="text-white">${item.quantity}</span> x 
                                                        <span class="text-white">${item.price.toLocaleString('vi-VN')}₫</span>
                                                    </div>
                                                    ${item.shopId?.name ? `
                                                        <div class="text-muted small">
                                                            <i class="bi bi-shop me-1"></i>${item.shopId.name}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <div class="text-end">
                                                    <div class="text-success fw-bold">
                                                        ${(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Payment Summary Card -->
                        <div class="card bg-success bg-opacity-10 border-success">
                            <div class="card-body">
                                <h6 class="text-success mb-3 fw-bold">
                                    <i class="bi bi-cash-coin me-2"></i>Thanh toán
                                </h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Tạm tính:</span>
                                    <span class="text-white">${order.subtotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                ${order.discount > 0 ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Giảm giá:</span>
                                    <span class="text-danger">-${order.discount.toLocaleString('vi-VN')}đ</span>
                                </div>
                                ` : ''}
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Phí vận chuyển:</span>
                                    <span class="text-white">${order.deliveryFee.toLocaleString('vi-VN')}đ</span>
                                </div>
                                ${order.voucher ? `
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">
                                        <i class="bi bi-ticket-perforated me-1"></i>Voucher:
                                    </span>
                                    <span class="text-warning">-${order.voucher.discount || 0}đ</span>
                                </div>
                                ` : ''}
                                <hr class="border-secondary">
                                <div class="d-flex justify-content-between">
                                    <span class="text-white fw-bold fs-5">Tổng cộng:</span>
                                    <span class="text-success fw-bold fs-4">${order.total.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>

                        <!-- Shop Notes (if exists) -->
                        ${order.shopNotes && order.shopNotes.length > 0 ? `
                        <div class="card bg-info bg-opacity-10 border-info mt-3">
                            <div class="card-body">
                                <h6 class="text-info mb-3 fw-bold">
                                    <i class="bi bi-sticky me-2"></i>Ghi chú cho cửa hàng
                                </h6>
                                ${order.shopNotes.map(note => `
                                    <div class="mb-2">
                                        <small class="text-muted d-block">Shop: ${note.shopId?.name || 'N/A'}</small>
                                        <div class="text-white">${note.note || 'Không có ghi chú'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading order detail:', error);

            const loadingDiv = document.getElementById('orderDetailLoading');
            const errorDiv = document.getElementById('orderDetailError');
            const errorMsg = document.getElementById('orderDetailErrorMessage');

            loadingDiv.classList.add('d-none');
            errorDiv.classList.remove('d-none');
            errorMsg.textContent = error.message || 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.';
        }
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadOrdersList().then(() => this.renderOrdersList());
                }, 500);
            });
        }

        // Filters
        const filterIds = ['status-filter', 'payment-filter', 'start-date', 'end-date'];
        filterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    if (id === 'status-filter') this.filters.status = e.target.value;
                    if (id === 'payment-filter') this.filters.paymentMethod = e.target.value;
                    if (id === 'start-date') this.filters.startDate = e.target.value;
                    if (id === 'end-date') this.filters.endDate = e.target.value;

                    this.currentPage = 1;
                    this.loadOrdersList().then(() => this.renderOrdersList());
                });
            }
        });

        // Checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('order-checkbox')) {
                const orderId = e.target.value;
                if (e.target.checked) {
                    this.selectedOrders.add(orderId);
                } else {
                    this.selectedOrders.delete(orderId);
                }
                this.updateBulkActions();
            }

            if (e.target.id === 'select-all-checkbox') {
                const isChecked = e.target.checked;
                this.data.ordersList.forEach(order => {
                    if (isChecked) {
                        this.selectedOrders.add(order._id);
                    } else {
                        this.selectedOrders.delete(order._id);
                    }
                });
                this.updateBulkActions();
                this.renderOrdersList();
            }
        });

        // Bulk actions
        document.getElementById('bulk-ship-btn')?.addEventListener('click', () => this.bulkUpdateStatus('shipping'));
        document.getElementById('bulk-deliver-btn')?.addEventListener('click', () => this.bulkUpdateStatus('delivered'));
        document.getElementById('bulk-cancel-btn')?.addEventListener('click', () => this.bulkUpdateStatus('cancelled'));
        document.getElementById('clear-selection-btn')?.addEventListener('click', () => {
            this.selectedOrders.clear();
            this.updateBulkActions();
            this.renderOrdersList();
        });

        // ========== VIEW ORDER DETAIL EVENT ==========
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-order-detail-btn');
            if (viewBtn) {
                e.preventDefault();
                const orderId = viewBtn.dataset.orderId;
                console.log('👆 View button clicked, orderId:', orderId);
                if (orderId) {
                    this.handleViewOrder(orderId);
                }
            }
        });

        console.log('✅ Order detail event listener registered');        
    }

    updateBulkActions() {
        const bulkBar = document.getElementById('bulk-actions-bar');
        const selectedCount = document.getElementById('selected-count');

        if (bulkBar && selectedCount) {
            if (this.selectedOrders.size > 0) {
                bulkBar.classList.remove('d-none');
                selectedCount.textContent = this.selectedOrders.size;
            } else {
                bulkBar.classList.add('d-none');
            }
        }
    }

    // ==================== ACTIONS ====================

    async viewOrder(orderId) {
        try {
            const order = await OrdersService.getOrderDetail(orderId);
            console.log('Order detail:', order);
            // TODO: Show modal with order details
            alert(`Chi tiết đơn hàng #${orderId.slice(-6).toUpperCase()}\n\nTổng: ${order.total.toLocaleString('vi-VN')}₫\nTrạng thái: ${order.status}`);
        } catch (error) {
            console.error('Error viewing order:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async updateStatus(orderId, newStatus) {
        const statusText = this.getStatusText(newStatus);
        if (!confirm(`Bạn có chắc muốn cập nhật trạng thái thành "${statusText}"?`)) return;

        try {
            await OrdersService.updateOrderStatus(orderId, newStatus);
            alert('Cập nhật thành công!');
            await this.loadOrdersList();
            await this.loadStats();
            await this.loadStatusDistribution();
            this.renderUI();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async bulkUpdateStatus(status) {
        if (this.selectedOrders.size === 0) return;

        const statusText = this.getStatusText(status);
        if (!confirm(`Bạn có chắc muốn cập nhật ${this.selectedOrders.size} đơn hàng thành "${statusText}"?`)) return;

        try {
            const orderIds = Array.from(this.selectedOrders);
            await OrdersService.bulkUpdateStatus(orderIds, status);
            alert('Cập nhật thành công!');
            this.selectedOrders.clear();
            await this.loadOrdersList();
            await this.loadStats();
            await this.loadStatusDistribution();
            this.renderUI();
        } catch (error) {
            console.error('Error bulk update:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async goToPage(page) {
        if (!this.data.pagination) return;
        if (page < 1 || page > this.data.pagination.totalPages) return;

        this.currentPage = page;
        await this.loadOrdersList();
        this.renderOrdersList();
        document.getElementById('orders-list-tbody')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ==================== UTILITIES ====================

    getStatusText(status) {
        const texts = {
            'processing': 'Đang xử lý',
            'shipping': 'Đang giao',
            'arrived': 'Đã đến',
            'delivered': 'Đã giao',
            'cancelled': 'Đã hủy',
            'refund_pending': 'Chờ hoàn tiền',
            'refunded': 'Đã hoàn tiền'
        };
        return texts[status] || status;
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    window.OrdersManager = OrdersManager;
}
