# Nhật Ký Thay Đổi Hệ Thống Bãi Đỗ Xe (Changelog)

Tài liệu này lưu trữ lại tất cả những thay đổi đã được thực hiện trong phiên làm việc.

## 1. Giao Diện Người Dùng (Frontend)
- **Nút Chức Năng**: Cập nhật văn bản của nút "Reserve a spot" thành **"Book a slot"** trong thành phần `ParkingDetailSidebar.tsx`.
- **Chỉ Đường (Directions)**: Thêm nút **"Get directions"** vào thanh Sidebar chi tiết, cho phép người dùng mở Google Maps đến bãi đỗ xe tương ứng.
- **Sắp Xếp Hiển Thị Tầng**: Cập nhật logic trong `BookingPage.tsx` ở bước "Select Floor" để danh sách các tầng hiển thị theo thứ tự từ cao xuống thấp (Tầng 3 $\rightarrow$ Tầng 2 $\rightarrow$ Tầng 1 $\rightarrow$ Tầng Hầm B1), đồng nhất với mô hình 3D bên phải.

## 2. Hệ Thống Backend & Database (Seeder)
- **Mở Rộng Dữ Liệu Bãi Xe (Parking Lots)**: 
  - Khởi tạo thêm 3 tài liệu (documents) bãi đỗ xe thực tế bao gồm: **Bitexco Financial Tower**, **Vincom Center Đồng Khởi**, và **Sân bay Tân Sơn Nhất (Quốc Nội)**.
  - Tổng cộng hệ thống đang có **4 bãi xe** (gồm cả Bãi Xe Tòa Nhà Văn Phòng 123).
- **Quy Hoạch Tầng & Khu Vực**:
  - Mỗi bãi xe đều được quy hoạch đồng bộ gồm **4 tầng**: Tầng Hầm B1 (Ô tô), Tầng 1 (Ô tô điện & Xe đạp), Tầng 2 (Xe máy), Tầng 3 (Xe máy điện).
  - Thử nghiệm chia nhỏ mỗi tầng ra thành 4 khu vực (Khu A, B, C, D) và phân bổ đều số lượng vị trí đỗ.
  - **Khôi Phục**: Theo yêu cầu, hệ thống đã được khôi phục về lại cấu trúc **2 khu vực (Khu A và Khu B)** cho mỗi tầng, và trả lại số lượng slot mặc định.
- **Tài Khoản & Bảo Mật**:
  - Tạo các tài khoản kiểm thử cho quá trình phát triển (bao gồm `testuser@parking.com` và `trungtin605@gmail.com`).
  - Thử nghiệm hạ mức bảo mật của hệ thống trong `user.model.js` (rút ngắn `minlength` mật khẩu từ 8 ký tự xuống 6 ký tự để test) nhưng sau đó đã **khôi phục lại nguyên bản 8 ký tự**.

## 3. Quá Trình Làm Việc
- Tất cả các thay đổi về dữ liệu và cấu trúc sơ đồ tầng đều được tích hợp trực tiếp vào tệp `src/seeders/index.js`.
- Bất cứ khi nào cần cập nhật lại cấu trúc hệ thống, chỉ cần chạy lệnh `node src/seeders/index.js --clear` để làm mới hoàn toàn Database với dữ liệu ổn định nhất.
