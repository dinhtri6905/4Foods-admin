// src-modern/scripts/components/products.js
import { Modal } from 'bootstrap';

import ApexCharts from 'apexcharts';
import { ProductsService } from '../utils/services/products.service.js';

export class ProductsManager {
    constructor() {
        this.charts = {};
        this.data = {
            totalProducts: 0,
            totalValue: 0,
            statusStats: {},
            categorySalesTimeline: { series: [], labels: [] },
            topSelling: [],
            categories: [],
            categoryDistribution: [],
            productsList: [],
            pagination: null
        };
        this.selectedProducts = new Set();
        this.filters = {
            search: '',
            category: '',
            status: '',
            minPrice: '',
            maxPrice: ''
        };
        this.currentPage = 1;
        this.productDetailModal = null;

        window.productsManager = this;
        
        if (document.getElementById('total-products-count')) {
            this.init();
        }
    }

    async init() {
        console.log('🚀 Products Manager Initialized');
        
        try {
            await Promise.all([
                this.loadSummary().catch(e => console.error('Summary error:', e)),
                this.loadCategorySalesTimeline().catch(e => console.error('Timeline error:', e)),
                this.loadTopSelling().catch(e => console.error('Top selling error:', e)),
                this.loadCategories().catch(e => console.error('Categories error:', e)),
                this.loadCategoryDistribution().catch(e => console.error('Distribution error:', e)),
                this.loadProductsList().catch(e => console.error('Products list error:', e))
            ]);
            
            await this.$nextTick();
            this.renderUI();
            this.setupEventListeners();
            
            console.log('✅ Products page loaded successfully');
            
        } catch (error) {
            console.error('❌ Fatal error loading products:', error);
        }
    }

    $nextTick() {
        return new Promise(resolve => setTimeout(resolve, 100));
    }

    async loadSummary() {
        try {
            const summary = await ProductsService.getSummary();
            this.data = { ...this.data, ...summary };
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    async loadCategorySalesTimeline() {
        try {
            this.data.categorySalesTimeline = await ProductsService.getCategorySalesTimeline();
        } catch (error) {
            console.error('Error loading category sales timeline:', error);
        }
    }

    async loadTopSelling() {
        try {
            this.data.topSelling = await ProductsService.getTopSelling();
        } catch (error) {
            console.error('Error loading top selling:', error);
        }
    }

    async loadCategories() {
      try {
          console.log('🔄 Loading categories...');
          this.data.categories = await ProductsService.getCategories();
          console.log('✅ Categories loaded:', this.data.categories);
          
          if (!this.data.categories || this.data.categories.length === 0) {
              console.warn('⚠️ No categories data received');
          }
      } catch (error) {
          console.error('❌ Error loading categories:', error);
          this.data.categories = [];
      }
    }

    async loadCategoryDistribution() {
        try {
            this.data.categoryDistribution = await ProductsService.getCategoryDistribution();
        } catch (error) {
            console.error('Error loading category distribution:', error);
        }
    }

    async loadProductsList() {
        try {
            const params = {
                page: this.currentPage,
                limit: 10,
                ...this.filters
            };
            const response = await ProductsService.getProductsList(params);
            this.data.productsList = response.products;
            this.data.pagination = response.pagination;
        } catch (error) {
            console.error('Error loading products list:', error);
        }
    }

    renderUI() {
        this.renderSummaryStats();
        this.renderCategorySalesTimelineChart();
        this.renderTopSelling();
        this.renderCategories();
        this.renderCategoryDistributionChart();
        this.renderProductsList();
        this.populateCategoryFilter();
    }

    renderSummaryStats() {
        this.setText('total-products-count', this.data.totalProducts.toLocaleString());
        this.setText('total-value-amount', `${this.data.totalValue.toLocaleString('vi-VN')}đ`);
    }

    renderCategorySalesTimelineChart() {
        const chartEl = document.getElementById('categorySalesChart');
        if (!chartEl) return;
        if (this.charts.categorySales) this.charts.categorySales.destroy();

        const { series, labels } = this.data.categorySalesTimeline;

        if (!series || series.length === 0) {
            chartEl.innerHTML = '<div class="text-center text-muted py-5">Chưa có dữ liệu</div>';
            return;
        }

        const options = {
            series: series,
            chart: {
                type: 'line',
                height: 350,
                toolbar: { show: false },
                background: 'transparent'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            colors: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754'],
            dataLabels: { enabled: false },
            xaxis: {
                categories: labels,
                labels: {
                    style: { colors: '#6c757d' }
                }
            },
            yaxis: {
                labels: {
                    formatter: (val) => val > 1000 ? `${(val / 1000).toFixed(0)}K` : val,
                    style: { colors: '#6c757d' }
                }
            },
            grid: { borderColor: '#2d3748' },
            legend: {
                position: 'top',
                labels: { colors: '#fff' }
            },
            tooltip: {
                y: {
                    formatter: (val) => `${val.toLocaleString('vi-VN')}đ`
                },
                theme: 'dark'
            }
        };

        this.charts.categorySales = new ApexCharts(chartEl, options);
        this.charts.categorySales.render();
    }

    renderTopSelling() {
        const container = document.getElementById('top-selling-list');
        if (!container) return;

        if (this.data.topSelling.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4">Chưa có dữ liệu</div>';
            return;
        }

        container.innerHTML = this.data.topSelling.map((product, index) => `
            <div class="d-flex align-items-center p-3 border-bottom border-secondary">
                <div class="me-3">
                    <span class="badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-info'} rounded-pill fs-5">
                        ${index + 1}
                    </span>
                </div>
                <img src="${product.imageUrl}" 
                     class="rounded me-3" 
                     width="60" 
                     height="60" 
                     style="object-fit: cover;"
                     alt="${product.name}"
                     onerror="this.onerror=null; this.src='assets/icons/icon-192.png'"
                <div class="flex-grow-1">
                    <div class="fw-medium text-white">${product.name}</div>
                    <small class="text-muted">${product.category}</small>
                    <div class="d-flex align-items-center mt-1">
                        <i class="bi bi-star-fill text-warning me-1"></i>
                        <span class="text-white me-3">${product.rating.toFixed(1)}</span>
                        <span class="text-primary fw-bold">${product.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="text-success fw-bold">${product.ordersCount}</div>
                    <small class="text-muted">đơn hàng</small>
                </div>
            </div>
        `).join('');
    }

    renderCategories() {
        const container = document.getElementById('categories-list');
        
        console.log('🎨 Rendering categories, container found:', !!container);
        console.log('📦 Categories data:', this.data.categories);
        
        if (!container) {
            console.error('❌ Container #categories-list not found!');
            return;
        }

        if (!this.data.categories || this.data.categories.length === 0) {
            console.warn('⚠️ No categories to render');
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                    <p class="mb-0">Chưa có category nào trong database</p>
                    <small class="text-secondary">Hãy thêm sản phẩm với category để hiển thị</small>
                </div>
            `;
            return;
        }

        console.log('✅ Rendering', this.data.categories.length, 'categories');

        container.innerHTML = this.data.categories.map((cat, index) => {
            console.log(`Rendering category ${index}:`, cat.category, 'with', cat.products?.length || 0, 'products');
            
            return `
                <div class="card bg-dark border-secondary mb-2">
                    <div class="card-header p-0">
                        <button class="btn btn-link text-decoration-none text-white w-100 text-start p-3 d-flex justify-content-between align-items-center" 
                                type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target="#collapse-${index}"
                                aria-expanded="false"
                                aria-controls="collapse-${index}">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-tag-fill me-2 text-primary"></i>
                                <strong>${cat.category}</strong>
                            </div>
                            <div>
                                <span class="badge bg-primary me-2">${cat.count} SP</span>
                                <span class="text-success small">${(cat.totalValue || 0).toLocaleString('vi-VN')}đ</span>
                                <i class="bi bi-chevron-down ms-2"></i>
                            </div>
                        </button>
                    </div>
                    <div id="collapse-${index}" class="collapse">
                        <div class="card-body bg-secondary p-3">
                            ${cat.products && cat.products.length > 0 ? `
                                <div class="row g-2">
                                    ${cat.products.map(product => `
                                        <div class="col-md-6">
                                            <div class="card bg-dark border-0">
                                                <div class="card-body p-2">
                                                    <div class="d-flex">
                                                        <img src="${product.imageUrl}" 
                                                            class="rounded me-2" 
                                                            width="50" 
                                                            height="50" 
                                                            style="object-fit: cover;"
                                                            alt="${product.name}"
                                                            onerror="this.onerror=null; this.src='assets/icons/icon-192.png'"
                                                        <div class="flex-grow-1">
                                                            <div class="fw-medium text-white small text-truncate">${product.name}</div>
                                                            <div class="text-primary fw-bold small">${(product.price || 0).toLocaleString('vi-VN')}đ</div>
                                                            <small class="text-muted">Stock: ${product.stock || 0}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center text-muted py-3">
                                    <small>Không có sản phẩm nào</small>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('✅ Categories rendered successfully');
    }

    renderCategoryDistributionChart() {
        const chartEl = document.getElementById('categoryDistributionChart');
        if (!chartEl) return;
        if (this.charts.distribution) this.charts.distribution.destroy();

        if (this.data.categoryDistribution.length === 0) {
            chartEl.innerHTML = '<div class="text-center text-muted py-5">Chưa có dữ liệu</div>';
            return;
        }

        const labels = this.data.categoryDistribution.map(d => d.category);
        const series = this.data.categoryDistribution.map(d => d.count);

        const options = {
            series: series,
            chart: { type: 'donut', height: 300, background: 'transparent' },
            labels: labels,
            colors: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'],
            legend: {
                position: 'bottom',
                fontSize: '12px',
                labels: { colors: '#fff' }
            },
            dataLabels: {
                enabled: true,
                formatter: (val) => `${val.toFixed(1)}%`,
                style: { fontSize: '12px', fontWeight: 'bold', colors: ['#fff'] }
            },
            tooltip: {
                y: { formatter: (val) => `${val} sản phẩm` },
                theme: 'dark'
            },
            plotOptions: {
                pie: { donut: { size: '65%' } }
            }
        };

        this.charts.distribution = new ApexCharts(chartEl, options);
        this.charts.distribution.render();
    }

    renderProductsList() {
        const tbody = document.getElementById('products-list-tbody');
        if (!tbody) return;

        if (this.data.productsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Không tìm thấy sản phẩm nào</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.productsList.map(product => `
            <tr class="${this.selectedProducts.has(product._id) ? 'table-active' : ''}">
                <td>
                    <input type="checkbox" 
                           class="form-check-input product-checkbox" 
                           value="${product._id}"
                           ${this.selectedProducts.has(product._id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${product.imageUrl}" 
                             class="rounded me-2" 
                             width="40" 
                             height="40" 
                             style="object-fit: cover;"
                             alt="${product.name}"
                             onerror="this.onerror=null; this.src='assets/icons/icon-192.png'"
                        <div>
                            <div class="fw-medium text-white small">${product.name}</div>
                            <small class="text-muted">${product.category}</small>
                        </div>
                    </div>
                </td>
                <td class="text-white">${product.price.toLocaleString('vi-VN')}đ</td>
                <td class="text-center text-white">${product.stock}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-star-fill text-warning me-1"></i>
                        <span class="text-white">${product.rating.toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(product.status)}">
                        ${this.getStatusText(product.status)}
                    </span>
                </td>
                <td class="text-center text-secondary">${product.views || 0}</td>
                <td class="text-center text-secondary">${product.ordersCount || 0}</td>
                <td>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#"><i class="bi bi-pencil me-2"></i>Edit</a></li>
                            <li><a class="dropdown-item view-product-detail-btn" href="#" data-product-id="${product._id}"><i class="bi bi-eye me-2"></i>View</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.productsManager.deleteProduct('${product._id}'); return false;">
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

            for (let i = 1; i <= Math.min(pages, 5); i++) {
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

    // ========== VIEW PRODUCT DETAIL ==========
    async handleViewProduct(productId) {
        console.log('🔍 Opening product detail for ID:', productId);

        try {
            // Khởi tạo modal (chỉ 1 lần)
            if (!this.productDetailModal) {
                const modalEl = document.getElementById('productDetailModal');
                this.productDetailModal = new Modal(modalEl);
            }

            // Reset về trạng thái loading
            const loadingDiv = document.getElementById('productDetailLoading');
            const errorDiv = document.getElementById('productDetailError');
            const dataDiv = document.getElementById('productDetailData');

            loadingDiv.classList.remove('d-none');
            errorDiv.classList.add('d-none');
            dataDiv.classList.add('d-none');
            dataDiv.innerHTML = '';

            // Hiển thị modal
            this.productDetailModal.show();

            // Gọi API
            console.log('📡 Fetching product detail from API...');
            const product = await ProductsService.getProductDetail(productId);
            console.log('✅ Product data received:', product);

            // Ẩn loading, hiện data
            loadingDiv.classList.add('d-none');
            dataDiv.classList.remove('d-none');

            // Get status badge class
            const statusBadgeClass = {
                'pending': 'bg-warning text-dark',
                'displayed': 'bg-success',
                'hidden': 'bg-secondary',
                'violated': 'bg-danger'
            }[product.status] || 'bg-secondary';

            // Render nội dung
            dataDiv.innerHTML = `
                <div class="row">
                    <!-- Left Column: Product Image & Basic Info -->
                    <div class="col-md-5">
                        <img src="${product.imageUrl}" 
                             class="img-fluid rounded border border-2 border-primary mb-3" 
                             alt="${product.name}"
                             onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                        
                        <div class="d-flex gap-2 mb-3 flex-wrap">
                            <span class="badge ${statusBadgeClass} px-3 py-2 fs-6">
                                ${product.status.toUpperCase()}
                            </span>
                            <span class="badge bg-info px-3 py-2">
                                <i class="bi bi-tag-fill me-1"></i>${product.category}
                            </span>
                            ${product.discountPercent > 0 ? `
                                <span class="badge bg-danger px-3 py-2">
                                    -${product.discountPercent}% OFF
                                </span>
                            ` : ''}
                        </div>

                        <!-- Seller Info -->
                        ${product.seller ? `
                        <div class="card bg-secondary bg-opacity-25 border-0 mb-3">
                            <div class="card-body">
                                <h6 class="text-white mb-3 fw-bold">
                                    <i class="bi bi-person-circle me-2"></i>Người bán
                                </h6>
                                <div class="d-flex align-items-center">
                                    <img src="${product.seller.avatar || '/assets/icons/icon-192.png'}" 
                                         class="rounded-circle me-3" 
                                         width="50" height="50"
                                         onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                                    <div>
                                        <div class="text-white fw-bold">${product.seller.name}</div>
                                        <small class="text-muted">${product.seller.email}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Shop Info -->
                        ${product.shop ? `
                        <div class="card bg-warning bg-opacity-10 border-warning">
                            <div class="card-body">
                                <h6 class="text-warning mb-3 fw-bold">
                                    <i class="bi bi-shop me-2"></i>Cửa hàng
                                </h6>
                                <div class="d-flex align-items-center mb-2">
                                    <img src="${product.shop.avatar || '/assets/icons/icon-192.png'}" 
                                         class="rounded me-3 border border-2 border-warning" 
                                         width="50" height="50"
                                         onerror="this.onerror=null; this.src='/assets/icons/icon-192.png'">
                                    <div>
                                        <div class="text-white fw-bold">${product.shop.name}</div>
                                        <small class="text-muted">${product.shop.phone}</small>
                                    </div>
                                </div>
                                <small class="text-muted d-block">
                                    <i class="bi bi-geo-alt-fill me-1"></i>${product.shop.address}
                                </small>
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Right Column: Product Details -->
                    <div class="col-md-7">
                        <!-- Product Name & Rating -->
                        <h3 class="text-white mb-3 fw-bold">${product.name}</h3>
                        <div class="mb-3">
                            <span class="text-warning fs-5">
                                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}
                            </span>
                            <span class="text-muted ms-2">${product.rating.toFixed(1)} / 5.0</span>
                        </div>

                        <!-- Price Info -->
                        <div class="card bg-primary bg-opacity-10 border-primary mb-3">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-6">
                                        <small class="text-muted d-block">Giá gốc</small>
                                        ${product.discountPercent > 0 ? `
                                            <h5 class="text-muted text-decoration-line-through mb-0">
                                                ${product.price.toLocaleString('vi-VN')}đ
                                            </h5>
                                        ` : `
                                            <h5 class="text-white mb-0">
                                                ${product.price.toLocaleString('vi-VN')}đ
                                            </h5>
                                        `}
                                    </div>
                                    ${product.discountPercent > 0 ? `
                                    <div class="col-6">
                                        <small class="text-muted d-block">Giá sau giảm</small>
                                        <h4 class="text-success mb-0 fw-bold">
                                            ${product.finalPrice.toLocaleString('vi-VN')}đ
                                        </h4>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Statistics Cards -->
                        <div class="row g-2 mb-3">
                            <div class="col-md-3 col-6">
                                <div class="card bg-secondary bg-opacity-25 border-0">
                                    <div class="card-body text-center py-2">
                                        <i class="bi bi-box-seam text-info fs-4"></i>
                                        <h5 class="mb-0 text-white mt-1">${product.stock}</h5>
                                        <small class="text-muted">Tồn kho</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6">
                                <div class="card bg-secondary bg-opacity-25 border-0">
                                    <div class="card-body text-center py-2">
                                        <i class="bi bi-eye text-primary fs-4"></i>
                                        <h5 class="mb-0 text-white mt-1">${product.views}</h5>
                                        <small class="text-muted">Lượt xem</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6">
                                <div class="card bg-secondary bg-opacity-25 border-0">
                                    <div class="card-body text-center py-2">
                                        <i class="bi bi-cart-plus text-warning fs-4"></i>
                                        <h5 class="mb-0 text-white mt-1">${product.addToCartCount}</h5>
                                        <small class="text-muted">Thêm giỏ</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 col-6">
                                <div class="card bg-secondary bg-opacity-25 border-0">
                                    <div class="card-body text-center py-2">
                                        <i class="bi bi-bag-check text-success fs-4"></i>
                                        <h5 class="mb-0 text-white mt-1">${product.ordersCount}</h5>
                                        <small class="text-muted">Đã bán</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Revenue Statistics -->
                        <div class="row g-3 mb-3">
                            <div class="col-md-4">
                                <div class="card bg-success bg-opacity-10 border-success">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-cash-coin fs-1 text-success mb-2"></i>
                                        <h4 class="mb-1 text-white fw-bold">
                                            ${product.stats.totalRevenue.toLocaleString('vi-VN')}đ
                                        </h4>
                                        <small class="text-muted">Doanh thu</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-info bg-opacity-10 border-info">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-cart-check fs-1 text-info mb-2"></i>
                                        <h4 class="mb-1 text-white fw-bold">${product.stats.totalOrders}</h4>
                                        <small class="text-muted">Đơn hàng</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-warning bg-opacity-10 border-warning">
                                    <div class="card-body text-center py-3">
                                        <i class="bi bi-box2 fs-1 text-warning mb-2"></i>
                                        <h4 class="mb-1 text-white fw-bold">${product.stats.totalQuantitySold}</h4>
                                        <small class="text-muted">Đã bán</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="card bg-secondary bg-opacity-25 border-0 mb-3">
                            <div class="card-body">
                                <h6 class="text-white mb-3 fw-bold">
                                    <i class="bi bi-file-text me-2"></i>Mô tả sản phẩm
                                </h6>
                                <p class="text-white mb-0">${product.description}</p>
                            </div>
                        </div>

                        <!-- Additional Info -->
                        <div class="card bg-secondary bg-opacity-25 border-0">
                            <div class="card-body">
                                <h6 class="text-white mb-3 fw-bold">
                                    <i class="bi bi-info-circle-fill me-2"></i>Thông tin bổ sung
                                </h6>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">Thời gian chuẩn bị</small>
                                        <span class="text-white">${product.prepTime} phút</span>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">Ngày tạo</small>
                                        <span class="text-white">${new Date(product.createdAt).toLocaleDateString('vi-VN', { 
                                            year: 'numeric', month: 'long', day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">Cập nhật gần nhất</small>
                                        <span class="text-white">${new Date(product.updatedAt).toLocaleDateString('vi-VN', { 
                                            year: 'numeric', month: 'long', day: 'numeric' 
                                        })}</span>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted d-block">ID sản phẩm</small>
                                        <span class="text-white font-monospace">${product.id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Error loading product detail:', error);

            const loadingDiv = document.getElementById('productDetailLoading');
            const errorDiv = document.getElementById('productDetailError');
            const errorMsg = document.getElementById('productDetailErrorMessage');

            loadingDiv.classList.add('d-none');
            errorDiv.classList.remove('d-none');
            errorMsg.textContent = error.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.';
        }
    }    

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.data.categories.map(c => c.category))];
        
        categoryFilter.innerHTML = '<option value="">Tất cả category</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

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
                    this.loadProductsList().then(() => this.renderProductsList());
                }, 500);
            });
        }

        // Filters
        const filterIds = ['category-filter', 'status-filter', 'min-price-filter', 'max-price-filter'];
        filterIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    if (id === 'category-filter') this.filters.category = e.target.value;
                    if (id === 'status-filter') this.filters.status = e.target.value;
                    if (id === 'min-price-filter') this.filters.minPrice = e.target.value;
                    if (id === 'max-price-filter') this.filters.maxPrice = e.target.value;
                    
                    this.currentPage = 1;
                    this.loadProductsList().then(() => this.renderProductsList());
                });
            }
        });

        // Checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('product-checkbox')) {
                const productId = e.target.value;
                if (e.target.checked) {
                    this.selectedProducts.add(productId);
                } else {
                    this.selectedProducts.delete(productId);
                }
                this.updateBulkActions();
            }

            if (e.target.id === 'select-all-checkbox') {
                const isChecked = e.target.checked;
                this.data.productsList.forEach(product => {
                    if (isChecked) {
                        this.selectedProducts.add(product._id);
                    } else {
                        this.selectedProducts.delete(product._id);
                    }
                });
                this.updateBulkActions();
                this.renderProductsList();
            }
        });

        // Bulk actions
        document.getElementById('bulk-display-btn')?.addEventListener('click', () => this.bulkAction('display'));
        document.getElementById('bulk-hide-btn')?.addEventListener('click', () => this.bulkAction('hide'));
        document.getElementById('bulk-delete-btn')?.addEventListener('click', () => this.bulkAction('delete'));
        document.getElementById('clear-selection-btn')?.addEventListener('click', () => {
            this.selectedProducts.clear();
            this.updateBulkActions();
            this.renderProductsList();
        });

        // ========== VIEW PRODUCT DETAIL EVENT ==========
        document.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-product-detail-btn');
            if (viewBtn) {
                e.preventDefault();
                const productId = viewBtn.dataset.productId;
                console.log('👆 View button clicked, productId:', productId);
                if (productId) {
                    this.handleViewProduct(productId);
                }
            }
        });

        console.log('✅ Product detail event listener registered');        
    }

    updateBulkActions() {
        const bulkBar = document.getElementById('bulk-actions-bar');
        const selectedCount = document.getElementById('selected-count');
        
        if (bulkBar && selectedCount) {
            if (this.selectedProducts.size > 0) {
                bulkBar.classList.remove('d-none');
                selectedCount.textContent = this.selectedProducts.size;
            } else {
                bulkBar.classList.add('d-none');
            }
        }
    }

    async bulkAction(action) {
        if (this.selectedProducts.size === 0) return;
        
        const actionText = { display: 'hiển thị', hide: 'ẩn', delete: 'xóa' }[action];
        if (!confirm(`Bạn có chắc muốn ${actionText} ${this.selectedProducts.size} sản phẩm?`)) return;

        try {
            const productIds = Array.from(this.selectedProducts);
            await ProductsService.bulkAction(action, productIds);
            alert(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} thành công!`);
            this.selectedProducts.clear();
            await this.loadProductsList();
            this.renderProductsList();
            this.updateBulkActions();
        } catch (error) {
            console.error('Error bulk action:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        
        try {
            await ProductsService.deleteProduct(productId);
            alert('Xóa thành công!');
            await this.loadProductsList();
            this.renderProductsList();
        } catch (error) {
            console.error('Error delete product:', error);
            alert('Có lỗi xảy ra!');
        }
    }

    async goToPage(page) {
        if (!this.data.pagination) return;
        if (page < 1 || page > this.data.pagination.pages) return;
        
        this.currentPage = page;
        await this.loadProductsList();
        this.renderProductsList();
        
        document.getElementById('products-list-tbody')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Utilities
    getStatusBadgeClass(status) {
        const classes = {
            'pending': 'bg-warning text-dark',
            'displayed': 'bg-success',
            'hidden': 'bg-secondary',
            'violated': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'pending': 'Pending',
            'displayed': 'Displayed',
            'hidden': 'Hidden',
            'violated': 'Violated'
        };
        return texts[status] || status;
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
}

if (typeof window !== 'undefined') {
    window.ProductsManager = ProductsManager;
}
