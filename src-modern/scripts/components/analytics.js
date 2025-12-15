// src-modern/scripts/components/analytics.js
import ApexCharts from 'apexcharts';
import { AnalyticsService } from '../utils/services/analytics.service.js';
import { getCategoryName, getCategoryColor } from '../utils/constants.js';

export class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.data = {
            totalRevenue: 0, todayRevenue: 0, todayOrders: 0, todayCustomers: 0, growth: 0,
            weekRevenue: 0, weekGrowth: 0,
            monthRevenue: 0, monthGrowth: 0,
            yearRevenue: 0, yearGrowth: 0,
            paymentBreakdown: { cod: 0, momo: 0 }, 
            recentOrders: [], 
            topCategories: []
        };
        
        if (document.getElementById('total-revenue')) {
            this.init();
        }
    }

    async init() {
        console.log('🚀 Analytics Manager Initialized');
        try {
            await Promise.all([this.loadSummaryData(), this.loadRevenueChart()]);
            this.renderUI();
            this.setupRefreshButton();
            console.log('✅ Analytics loaded successfully');
        } catch (error) { 
            console.error('❌ Error loading analytics:', error); 
        }
    }

    async loadSummaryData() {
        try {
            const summary = await AnalyticsService.getSummary();
            
            // ✅ Gộp các category cùng tên
            if (summary.topCategories && Array.isArray(summary.topCategories)) {
                const mergedCategories = {};
                
                summary.topCategories.forEach(cat => {
                    if (!cat.id && !cat._id) return;
                    
                    // Lấy tên hiển thị
                    const displayName = this.getCategoryDisplayName(cat.id || cat._id);
                    
                    // Gộp doanh thu nếu trùng tên
                    if (mergedCategories[displayName]) {
                        mergedCategories[displayName].revenue += cat.revenue || 0;
                    } else {
                        mergedCategories[displayName] = {
                            name: displayName,
                            revenue: cat.revenue || 0
                        };
                    }
                });
                
                // Chuyển thành array và sắp xếp theo doanh thu
                summary.topCategories = Object.values(mergedCategories)
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 7);
                
                console.log('✅ Merged topCategories:', summary.topCategories);
            }
            
            this.data = { ...this.data, ...summary };
            console.log('📊 Summary Data:', this.data);
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    async loadRevenueChart() {
        try {
            const revenueData = await AnalyticsService.getRevenueDailyData(30);
            this.renderRevenueChart(revenueData);
        } catch (error) { 
            console.error('Error loading revenue chart:', error); 
        }
    }

    renderUI() {
        this.renderSummaryStats();
        this.renderTimeBasedStats();
        this.renderRecentOrders();
        this.renderPaymentBreakdown();
        this.renderTopCategories();
    }

    renderSummaryStats() {
        // Tổng doanh thu (Lifetime) - Màu nổi bật
        const totalRevEl = document.getElementById('total-revenue');
        if (totalRevEl) {
            totalRevEl.textContent = this.formatCurrency(this.data.totalRevenue);
            totalRevEl.style.color = '#28a745'; // Màu xanh lá nổi bật
        }
        
        // Hôm nay
        this.setText('today-revenue', this.formatCurrency(this.data.todayRevenue));
        this.setText('today-summary-revenue', this.formatCurrency(this.data.todayRevenue));
        
        // Đơn hàng & Khách hàng
        this.setText('today-orders-count', this.data.todayOrders);
        this.setText('today-customers-count', this.data.todayCustomers);
        
        // Tăng trưởng hôm nay
        this.renderGrowth('today-growth', this.data.growth);
        this.renderGrowth('today-growth-summary', this.data.growth);
    }

    renderTimeBasedStats() {
        // Tuần này
        this.setText('week-revenue', this.formatCurrency(this.data.weekRevenue));
        this.renderGrowth('week-growth', this.data.weekGrowth);
        
        // Tháng này
        this.setText('month-revenue', this.formatCurrency(this.data.monthRevenue));
        this.renderGrowth('month-growth', this.data.monthGrowth);
        
        // Năm nay
        this.setText('year-revenue', this.formatCurrency(this.data.yearRevenue));
        this.renderGrowth('year-growth', this.data.yearGrowth);
    }

    renderGrowth(elementId, growth) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        const isPositive = growth >= 0;
        const icon = isPositive ? '<i class="bi bi-caret-up-fill"></i>' : '<i class="bi bi-caret-down-fill"></i>';
        const colorClass = isPositive ? 'text-success' : 'text-danger';
        
        // Tăng trưởng hôm nay
        if (elementId.includes('today')) {
            el.className = `small fw-bold ${colorClass}`;
            el.innerHTML = `${icon} ${isPositive ? '+' : ''}${growth}%`;
        } 
        // Các tăng trưởng khác (tuần, tháng, năm)
        else {
            el.className = `small fw-bold ${colorClass}`;
            el.innerHTML = `${icon} ${isPositive ? '+' : ''}${growth}%`;
        }
    }

    renderRevenueChart(data) {
        const chartEl = document.getElementById('revenueChart');
        if (!chartEl) return;
        if (this.charts.revenue) this.charts.revenue.destroy();

        const options = {
            series: [{ name: 'Doanh thu', data: data.map(d => d.revenue) }],
            chart: { 
                type: 'area', 
                height: 350, 
                toolbar: { show: false },
                fontFamily: 'Inter, sans-serif'
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            colors: ['#0d6efd'],
            fill: { 
                type: 'gradient', 
                gradient: { 
                    shadeIntensity: 1, 
                    opacityFrom: 0.5, 
                    opacityTo: 0.1 
                } 
            },
            xaxis: { 
                categories: data.map(d => new Date(d.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})),
                labels: { 
                    rotate: -45, 
                    style: { fontSize: '11px', colors: '#6c757d' } 
                } 
            },
            yaxis: { 
                labels: { 
                    formatter: (val) => {
                        if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val/1000).toFixed(0)}K`;
                        return val.toFixed(0);
                    },
                    style: { colors: '#6c757d' }
                } 
            },
            grid: {
                borderColor: '#e9ecef',
                strokeDashArray: 3
            },
            tooltip: { 
                y: { 
                    formatter: (val) => this.formatCurrency(val) 
                },
                theme: 'dark'
            }
        };

        this.charts.revenue = new ApexCharts(chartEl, options);
        this.charts.revenue.render();
    }

    renderRecentOrders() {
        const tbody = document.getElementById('recent-orders-list');
        if (!tbody) return;
        
        if (this.data.recentOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có đơn hàng nào</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.recentOrders.map(order => `
            <tr>
                <td class="ps-4">
                    <span class="fw-bold font-monospace text-primary">#${(order.id || order._id || '').slice(-6).toUpperCase()}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="fw-medium">${order.user?.name || 'Khách lẻ'}</span>
                    </div>
                </td>
                <td class="text-muted">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                    <span class="badge bg-light text-dark border">
                        <i class="bi bi-box-seam me-1"></i>${order.items.length} món
                    </span>
                </td>
                <td class="fw-bold text-primary">${this.formatCurrency(order.total)}</td>
                <td class="pe-4 text-end">
                    <span class="badge rounded-pill ${this.getStatusBadge(order.status)}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderPaymentBreakdown() {
        const { cod, momo } = this.data.paymentBreakdown;
        const total = cod + momo;
        
        this.setText('cod-amount', this.formatCurrency(cod));
        this.setText('momo-amount', this.formatCurrency(momo));
        
        const codPercent = total > 0 ? ((cod/total)*100) : 0;
        const momoPercent = total > 0 ? ((momo/total)*100) : 0;
        
        this.setText('cod-percent', `${codPercent.toFixed(1)}% tổng DT`);
        this.setText('momo-percent', `${momoPercent.toFixed(1)}% tổng DT`);
        
        const codBar = document.getElementById('cod-progress');
        if(codBar) codBar.style.width = `${codPercent}%`;
        
        const momoBar = document.getElementById('momo-progress');
        if(momoBar) momoBar.style.width = `${momoPercent}%`;
    }

    renderTopCategories() {
        const list = document.getElementById('top-categories-list');
        if (!list) return;
        
        if (this.data.topCategories.length === 0) {
            list.innerHTML = '<div class="list-group-item text-center text-muted">Chưa có dữ liệu</div>';
            return;
        }

        list.innerHTML = this.data.topCategories.map((cat, index) => {
            // 🎨 Màu sắc cho từng category (7 màu khác nhau)
            const colors = [
                { bg: 'bg-danger bg-opacity-10', text: 'text-danger', icon: 'bi-fire' },
                { bg: 'bg-warning bg-opacity-10', text: 'text-warning', icon: 'bi-star-fill' },
                { bg: 'bg-success bg-opacity-10', text: 'text-success', icon: 'bi-cup-hot' },
                { bg: 'bg-info bg-opacity-10', text: 'text-info', icon: 'bi-egg-fried' },
                { bg: 'bg-primary bg-opacity-10', text: 'text-primary', icon: 'bi-cake2' },
                { bg: 'bg-purple bg-opacity-10', text: 'text-purple', icon: 'bi-droplet-fill' },
                { bg: 'bg-secondary bg-opacity-10', text: 'text-secondary', icon: 'bi-gift' }
            ];
            const color = colors[index % colors.length];
            
            return `
                <div class="list-group-item d-flex justify-content-between align-items-center p-3 border-bottom-0">
                    <div class="d-flex align-items-center">
                        <div class="icon-square ${color.bg} ${color.text} rounded-2 p-2 me-3">
                            <i class="bi ${color.icon}"></i>
                        </div>
                        <div>
                            <div class="fw-bold ${color.text}">${cat.name || cat.id || cat._id || 'Chưa rõ'}</div>
                            <small class="text-muted">Danh mục sản phẩm</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="h6 fw-bold mb-0 ${color.text}">${this.formatCurrency(cat.revenue)}</div>
                        <small class="text-success fw-medium">
                            ${((cat.revenue / this.data.totalRevenue) * 100).toFixed(1)}% đóng góp
                        </small>
                    </div>
                </div>
            `;
        }).join('');
    }

    getCategoryDisplayName(categoryId) {
        if (!categoryId) return 'Chưa phân loại';
        
        const categoryMap = {
            '691054a4ad02ab999d92ae84': 'Món hot',
            '671acb0298f2c700f9e2c5a9': 'Bún, phở, mì',
            '690fa786aa5dcb293103a609': 'Món chính',
            '691052e7ad02ab999d92ae66': 'Khai vị',
            '6910561b8ad02ab999d92ae33': 'Tráng miệng',
            '691051568ad02ab999d92ae48': 'Đồ uống',
            '69104ed7ad02ab999d92ae27': 'Combo tiết kiệm'
        };
        
        return categoryMap[categoryId] || `Danh mục #${categoryId.slice(-6).toUpperCase()}`;
    }   

    // Utilities
    getStatusBadge(status) {    
        const badges = {
            'delivered': 'bg-success',
            'processing': 'bg-warning text-dark',
            'shipping': 'bg-info',
            'arrived': 'bg-primary',
            'cancelled': 'bg-danger'
        };
        return badges[status] || 'bg-secondary';
    }

    getStatusText(status) {
        const texts = {
            'delivered': 'Hoàn thành',
            'processing': 'Đang xử lý',
            'shipping': 'Đang giao',
            'arrived': 'Đã đến',
            'cancelled': 'Đã hủy'
        };
        return texts[status] || status;
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    formatCurrency(value) {
        if (!value || value === 0) return '0đ';
        return `${value.toLocaleString('vi-VN')}đ`;
    }

    setupRefreshButton() {
        const btn = document.getElementById('refresh-btn');
        if (btn) btn.addEventListener('click', () => {
            console.log('🔄 Refreshing...');
            this.init();
        });
    }
}
