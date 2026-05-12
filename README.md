**4FOOODS-ADMIN
**                      
### Installation

```bash
# Clone the repository
git clone https://github.com/dinhtri6905/4Foods-admin.git 
cd 4Foods-admin

# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm run dev
```

### Function
```bash
dist-modern/
    dist-modern/: Chứa toàn bộ mã nguồn đã build, sẵn sàng để deploy.
        - Các file .html: Từng trang giao diện quản trị đã build (dashboard, login, users, products, ...).
        - assets/: Chứa JS, CSS, hình ảnh, icon, manifest... đã được đóng gói/tối ưu.
src-modern/
    src-modern/: Thư mục chứa toàn bộ mã nguồn phát triển.
        Các file .html: Từng trang giao diện quản trị phục vụ phát triển, preview.
        assets/: Chứa icon, hình ảnh sử dụng trong giao diện.
            icons/, images/: Lưu trữ icon và hình ảnh.
        scripts/: Chứa mã nguồn JavaScript.
            main.js: Điểm khởi đầu, khởi tạo ứng dụng.
            components/: Các module JS cho từng trang hoặc thành phần (users, products, orders, ...).
            utils/: Các tiện ích, constants, quản lý theme, notification, icon, bảo vệ xác thực, API client, và các service cho từng nghiệp vụ.
                services/: Tách riêng các service gọi API cho từng module (users, products, orders, ...).
        styles/: Chứa mã nguồn SCSS cho giao diện.
            scss/: Thư mục chính chứa SCSS
                main.scss: File tổng hợp SCSS.
                abstracts/: Biến, mixins, utilities dùng chung.
                components/: SCSS cho từng thành phần UI (buttons, cards, ...).
                layout/: SCSS cho layout tổng thể (header, footer, ...).
                pages/: SCSS cho từng trang (users, products, ...).
                themes/: SCSS cho các theme (dark, light)
```
    
## Directory function for call API 
1. Các file call API chính
```bash
api.client.js: Lớp trung gian thực hiện các request HTTP (GET, POST, PUT, DELETE), tự động thêm token, xử lý lỗi xác thực, dùng cho toàn bộ project.

api.js: Định nghĩa các endpoint API, cấu hình base URL, giúp quản lý endpoint tập trung, dễ bảo trì.
```

2. Các file trong thư mục services và chức năng
```bash
analytics.service.js: Xử lý các API liên quan đến thống kê, báo cáo tổng quan, doanh thu theo ngày.

auth.service.js: Xử lý đăng nhập, đăng xuất, xác thực, quản lý session cho admin.

dashboard.service.js: Lấy dữ liệu tổng quan dashboard: thống kê, biểu đồ doanh thu, hoạt động gần đây, đơn hàng gần đây, trạng thái đơn hàng.

orders.service.js: Quản lý đơn hàng: lấy thống kê, xu hướng, trạng thái, danh sách, chi tiết đơn hàng.

products.service.js: Quản lý sản phẩm: lấy tổng quan, timeline doanh số theo danh mục, sản phẩm bán chạy, danh mục sản phẩm, phân phối danh mục, danh sách, xóa/bulk action.

users.service.js: Quản lý người dùng: lấy tổng quan, biểu đồ tăng trưởng, hoạt động gần đây, danh bạ, bulk action.
```
Component → Service → ApiClient → API Server → ApiClient → Service → Component → Giao diện


## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server with HMR
npm run dev:host     # Start dev server accessible on network

# Production
npm run build        # Create optimized production build
npm run preview      # Preview production build locally

# Maintenance
npm run clean        # Clean build artifacts
```

### Component Development

```javascript
// src-modern/scripts/components/example.js
import Alpine from 'alpinejs';

document.addEventListener('alpine:init', () => {
  Alpine.data('exampleComponent', () => ({
    // Component state and methods
    init() {
      console.log('Example component initialized');
    }
  }));
});
```
