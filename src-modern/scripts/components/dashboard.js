// src-modern/scripts/components/dashboard.js
import { Chart } from 'chart.js/auto';
import { Modal } from 'bootstrap';
import DashboardService from '../utils/services/dashboard.service.js';

export class DashboardManager {
  constructor() {
    this.charts = {};
    this.pendingProductsModal = null;
    this.pendingProductDetailModal = null;
    this.currentPendingProduct = null;

    if (this.isDashboardPage()) {
      this.init();
    }
  }

  isDashboardPage() {
    return document.getElementById('revenue-today') !== null;
  }

  async init() {
    console.log('🚀 Dashboard Manager Initialized');
    try {
      await Promise.all([
        this.loadSummaryStats(),
        this.loadRevenueChart(),
        this.loadRecentActivities(),
        this.loadRecentOrders(),
        this.loadOrderStatusChart(),
        this.loadUserGrowthChart()
      ]);
      console.log('✅ Dashboard loaded successfully');
      this.setupRefreshButton();
      this.setupReviewProductsButton();
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showError('Không thể tải dữ liệu dashboard');
    }
  }

  // ========== HÀNG 1: THỐNG KÊ TỔNG QUAN ==========
  async loadSummaryStats() {
    try {
      const data = await DashboardService.getSummaryStats();
      this.updateStatCard('revenue', data.revenue.value, data.revenue.growth, 'đ');
      this.updateStatCard('orders', data.orders.value, data.orders.growth, '');
      this.updateStatCard('users', data.newUsers.value, data.newUsers.growth, '');
      this.updateStatCard('shops', data.newShops.value, data.newShops.growth, '');
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }

  updateStatCard(type, value, growth, suffix) {
    const valueEl = document.getElementById(`${type}-today`);
    const changeEl = document.getElementById(`${type}-change`);

    if (valueEl) {
      const formattedValue = value.toLocaleString('vi-VN');
      valueEl.textContent = suffix ? `${formattedValue} ${suffix}` : formattedValue;
    }

    if (changeEl) {
      const isPositive = growth >= 0;
      const icon = isPositive ? 'bi-arrow-up' : 'bi-arrow-down';
      const colorClass = isPositive ? 'text-success' : 'text-danger';
      changeEl.className = `${colorClass} me-1`;
      changeEl.innerHTML = `<i class="bi ${icon}"></i> ${isPositive ? '+' : ''}${growth}%`;
    }
  }

  // ========== HÀNG 2: BIỂU ĐỒ DOANH THU ==========
  async loadRevenueChart() {
    const ctx = document.getElementById('monthlyRevenueChart');
    if (!ctx) return;

    try {
      const data = await DashboardService.getRevenueChartData();

      if (this.charts.revenue) {
        this.charts.revenue.destroy();
      }

      this.charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.months,
          datasets: [{
            label: 'Doanh thu',
            data: data.values,
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78, 115, 223, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4e73df',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: (context) => `Doanh thu: ${context.parsed.y.toLocaleString('vi-VN')}đ`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `${(value / 1000000).toFixed(1)}M`
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading revenue chart:', error);
    }
  }

  // ========== HÀNG 2: HOẠT ĐỘNG GẦN ĐÂY ==========
  async loadRecentActivities() {
    const container = document.getElementById('recent-activity-list');
    if (!container) return;

    try {
      const activities = await DashboardService.getRecentActivities(10);

      if (activities.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-3"></i>
            <p class="mb-0 mt-2">Chưa có hoạt động</p>
          </div>
        `;
        return;
      }

      container.innerHTML = activities.map(activity => `
        <div class="activity-item border-bottom p-3">
          <div class="d-flex align-items-start">
            <div class="activity-icon me-3">
              <i class="bi ${this.getActivityIcon(activity.type)} text-primary"></i>
            </div>
            <div class="flex-grow-1">
              <p class="mb-1"><strong>${activity.user}</strong> ${activity.action}</p>
              <small class="text-muted">
                <i class="bi bi-clock me-1"></i>${this.formatTime(activity.time)}
              </small>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  }

  getActivityIcon(type) {
    const icons = {
      'order': 'bi-cart-check',
      'user': 'bi-person-plus',
      'shop': 'bi-shop'
    };
    return icons[type] || 'bi-circle-fill';
  }

  formatTime(timeStr) {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }

  // ========== HÀNG 3: ĐƠN HÀNG GẦN ĐÂY ==========
  async loadRecentOrders() {
    const tbody = document.getElementById('recent-orders-table');
    if (!tbody) return;

    try {
      const orders = await DashboardService.getRecentOrders(7);

      if (orders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-3"></i>
              <p class="mb-0 mt-2">Chưa có đơn hàng</p>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = orders.map(order => `
        <tr>
          <td><strong>${order.code}</strong></td>
          <td>${order.customer}</td>
          <td>${order.total.toLocaleString('vi-VN')}đ</td>
          <td>
            <span class="badge ${this.getStatusBadge(order.status)}">
              ${this.getStatusText(order.status)}
            </span>
          </td>
          <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  getStatusBadge(status) {
    const badges = {
      'processing': 'bg-warning',
      'shipping': 'bg-info',
      'arrived': 'bg-primary',
      'delivered': 'bg-success',
      'cancelled': 'bg-danger',
      'refunded': 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  }

  getStatusText(status) {
    const texts = {
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao',
      'arrived': 'Đã đến',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy',
      'refundpending': 'Chờ hoàn',
      'refunded': 'Đã hoàn'
    };
    return texts[status] || status;
  }

  // ========== HÀNG 3: BIỂU ĐỒ TRẠNG THÁI ==========
  async loadOrderStatusChart() {
    const ctx = document.getElementById('orderStatusChart');
    if (!ctx) return;

    try {
      const data = await DashboardService.getOrderStatusDistribution();

      if (this.charts.status) {
        this.charts.status.destroy();
      }

      this.charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: [
              '#4e73df',
              '#1cc88a',
              '#36b9cc',
              '#f6c23e',
              '#e74a3b',
              '#858796'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label;
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading status chart:', error);
    }
  }

  // ========== HÀNG 4: TĂNG TRƯỞNG NGƯỜI DÙNG ==========
  async loadUserGrowthChart() {
    const ctx = document.getElementById('accountGrowthChart');
    if (!ctx) return;

    try {
      const data = await DashboardService.getUserGrowthData();

      if (this.charts.userGrowth) {
        this.charts.userGrowth.destroy();
      }

      this.charts.userGrowth = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.days,
          datasets: [{
            label: 'Người dùng mới',
            data: data.values,
            backgroundColor: '#36b9cc',
            borderRadius: 4,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading user growth chart:', error);
    }
  }

  // ========== DUYỆT SẢN PHẨM ==========
  setupReviewProductsButton() {
    const btn = document.getElementById('review-products-btn');
    if (!btn) {
      console.warn('[Dashboard] Review products button not found');
      return;
    }

    btn.addEventListener('click', () => {
      this.handlePendingProducts();
    });

    const btnApprove = document.getElementById('btn-approve-product');
    const btnReject = document.getElementById('btn-reject-product');

    if (btnApprove) {
      btnApprove.addEventListener('click', () => this.handleReviewProduct('approve'));
    }

    if (btnReject) {
      btnReject.addEventListener('click', () => this.handleReviewProduct('reject'));
    }

    console.log('[Dashboard] Review products button initialized');
  }

  async handlePendingProducts() {
    console.log('[Dashboard] Opening pending products modal');

    if (!this.pendingProductsModal) {
      const modalEl = document.getElementById('pendingProductsModal');
      if (modalEl) {
        this.pendingProductsModal = new Modal(modalEl);
      }
    }

    if (!this.pendingProductDetailModal) {
      const modalEl = document.getElementById('pendingProductDetailModal');
      if (modalEl) {
        this.pendingProductDetailModal = new Modal(modalEl);
      }
    }

    const loadingDiv = document.getElementById('pendingProductsLoading');
    const errorDiv = document.getElementById('pendingProductsError');
    const dataDiv = document.getElementById('pendingProductsData');

    if (loadingDiv) loadingDiv.classList.remove('d-none');
    if (errorDiv) errorDiv.classList.add('d-none');
    if (dataDiv) {
      dataDiv.classList.add('d-none');
      dataDiv.innerHTML = '';
    }

    if (this.pendingProductsModal) {
      this.pendingProductsModal.show();
    }

    try {
      console.log('[Dashboard] Fetching pending products...');
      const products = await DashboardService.getPendingProducts();
      console.log('[Dashboard] Received products:', products);

      if (loadingDiv) loadingDiv.classList.add('d-none');
      if (dataDiv) dataDiv.classList.remove('d-none');

      if (!products || products.length === 0) {
        dataDiv.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 mb-3"></i>
            <p class="mb-0">Không có sản phẩm nào chờ duyệt.</p>
            <small class="text-secondary">Tất cả sản phẩm đã được xử lý.</small>
          </div>
        `;
        return;
      }

      dataDiv.innerHTML = `
        <div class="list-group list-group-flush">
          ${products.map(p => `
            <button type="button"
                    class="list-group-item list-group-item-action bg-dark text-white border-secondary d-flex align-items-center pending-product-item"
                    data-product-id="${p._id}">
              <img src="${p.imageUrl || 'assets/icons/icon-192.png'}"
                   class="rounded me-3 border border-primary"
                   width="60"
                   height="60"
                   style="object-fit: cover"
                   onerror="this.onerror=null; this.src='assets/icons/icon-192.png'">
              <div class="flex-grow-1 text-start">
                <div class="fw-semibold mb-1">${p.name}</div>
                <div class="d-flex gap-3">
                  <small class="text-muted">
                    <i class="bi bi-tag me-1"></i>${p.category || 'Chưa phân loại'}
                  </small>
                  <small class="text-primary fw-bold">
                    ${(p.price || 0).toLocaleString('vi-VN')}đ
                  </small>
                  <small class="text-muted">
                    <i class="bi bi-box-seam me-1"></i>Kho: ${p.stock ?? 0}
                  </small>
                </div>
              </div>
              <span class="badge bg-warning text-dark ms-2">Chờ duyệt</span>
            </button>
          `).join('')}
        </div>
      `;

      dataDiv.querySelectorAll('.pending-product-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-product-id');
          const product = products.find(p => p._id === id);
          if (product) {
            this.handleViewPendingProduct(product);
          }
        });
      });
    } catch (error) {
      console.error('[Dashboard] Error loading pending products:', error);

      if (loadingDiv) loadingDiv.classList.add('d-none');
      if (errorDiv) {
        errorDiv.classList.remove('d-none');
        const errorMsg = document.getElementById('pendingProductsErrorMessage');
        if (errorMsg) {
          errorMsg.textContent = error.message || 'Không thể tải danh sách sản phẩm chờ duyệt.';
        }
      }
    }
  }

  handleViewPendingProduct(product) {
    console.log('[Dashboard] Viewing pending product:', product);

    this.currentPendingProduct = product;

    const loadingDiv = document.getElementById('pendingProductDetailLoading');
    const errorDiv = document.getElementById('pendingProductDetailError');
    const dataDiv = document.getElementById('pendingProductDetailData');

    if (loadingDiv) loadingDiv.classList.add('d-none');
    if (errorDiv) errorDiv.classList.add('d-none');
    if (dataDiv) dataDiv.classList.remove('d-none');

    dataDiv.innerHTML = `
      <div class="row">
        <div class="col-md-5">
          <img src="${product.imageUrl || 'assets/icons/icon-192.png'}"
               class="img-fluid rounded border border-2 border-primary mb-3"
               alt="${product.name}"
               onerror="this.onerror=null; this.src='assets/icons/icon-192.png'">
          
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge bg-warning text-dark px-3 py-2 fs-6">PENDING</span>
            <span class="badge bg-info px-3 py-2">
              <i class="bi bi-tag-fill me-1"></i>${product.category || 'N/A'}
            </span>
          </div>
        </div>

        <div class="col-md-7">
          <h3 class="text-white mb-3 fw-bold">${product.name}</h3>

          <div class="card bg-primary bg-opacity-10 border-primary mb-3">
            <div class="card-body">
              <div class="row">
                <div class="col-6">
                  <small class="text-muted d-block">Giá bán</small>
                  <h5 class="text-white mb-0">${(product.price || 0).toLocaleString('vi-VN')}đ</h5>
                </div>
                <div class="col-6">
                  <small class="text-muted d-block">Tồn kho</small>
                  <h5 class="text-white mb-0">${product.stock ?? 0}</h5>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="card bg-secondary bg-opacity-25 border-0">
                <div class="card-body text-center py-2">
                  <i class="bi bi-star text-warning fs-4"></i>
                  <h5 class="mb-0 text-white mt-1">${product.rating ?? 0}</h5>
                  <small class="text-muted">Rating</small>
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="card bg-secondary bg-opacity-25 border-0">
                <div class="card-body text-center py-2">
                  <i class="bi bi-calendar text-info fs-4"></i>
                  <h6 class="mb-0 text-white mt-1">${
                    product.createdAt
                      ? new Date(product.createdAt).toLocaleDateString('vi-VN')
                      : 'N/A'
                  }</h6>
                  <small class="text-muted">Ngày tạo</small>
                </div>
              </div>
            </div>
          </div>

          <div class="alert alert-warning d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>
              <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin sản phẩm trước khi duyệt.
            </div>
          </div>
        </div>
      </div>
    `;

    if (this.pendingProductDetailModal) {
      this.pendingProductDetailModal.show();
    }
  }

  async handleReviewProduct(action) {
    if (!this.currentPendingProduct) {
      alert('Không tìm thấy sản phẩm cần xử lý');
      return;
    }

    const productName = this.currentPendingProduct.name;
    const confirmMsg = action === 'approve'
      ? `Bạn có chắc chắn muốn DUYỆT sản phẩm "${productName}"?`
      : `Bạn có chắc chắn muốn KHÔNG DUYỆT sản phẩm "${productName}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      console.log(`[Review] Action: ${action} for product:`, this.currentPendingProduct._id);

      const res = await DashboardService.reviewProduct(
        this.currentPendingProduct._id,
        action
      );

      console.log('[Review] Response:', res);

      const successMsg = res.message || (action === 'approve'
        ? `✅ Đã duyệt sản phẩm "${productName}" thành công`
        : `❌ Đã từ chối duyệt sản phẩm "${productName}"`);

      alert(successMsg);

      if (this.pendingProductDetailModal) this.pendingProductDetailModal.hide();
      if (this.pendingProductsModal) this.pendingProductsModal.hide();

      this.currentPendingProduct = null;
    } catch (err) {
      console.error('[Review] Error:', err);
      alert(`❌ Có lỗi xảy ra: ${err.message || 'Không rõ'}. Vui lòng thử lại.`);
    }
  }

  // ========== UTILITIES ==========
  setupRefreshButton() {
    const refreshBtn = document.querySelector('[title="Refresh data"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('Refreshing dashboard...');
        this.init();
      });
    }
  }

  showError(message) {
    console.error(message);
    // Có thể thêm toast notification ở đây
  }
}
