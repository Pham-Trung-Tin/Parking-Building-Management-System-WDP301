# Nhật Ký Thay Đổi Hệ Thống Bãi Đỗ Xe (Changelog)

Tài liệu này lưu trữ lại tất cả những thay đổi đã được thực hiện trong phiên làm việc.

## 1. Giao Diện Người Dùng (Frontend)
- **Nút Chức Năng**: Cập nhật văn bản của nút "Reserve a spot" thành **"Book a slot"** trong thành phần `ParkingDetailSidebar.tsx`.
- **Chỉ Đường (Directions)**: Thêm nút **"Get directions"** vào thanh Sidebar chi tiết, cho phép người dùng mở Google Maps đến bãi đỗ xe tương ứng.
- **Sắp Xếp Hiển Thị Tầng**: Cập nhật logic trong `BookingPage.tsx` ở bước "Select Floor" để danh sách các tầng hiển thị theo thứ tự từ cao xuống thấp (Tầng 3 $\rightarrow$ Tầng 2 $\rightarrow$ Tầng 1 $\rightarrow$ Tầng Hầm B1), đồng nhất với mô hình 3D bên phải.
- **Tính năng Slot Locking (Khóa chỗ tạm thời)**:
  - Khi một người dùng bấm chọn một ô đỗ xe, hệ thống sẽ **khóa ô đó trong vòng 3 phút**.
  - Các người dùng khác sẽ thấy ô đó ở trạng thái **"Being Selected"** (màu vàng cam nhấp nháy + icon ổ khóa) và không thể bấm chọn.
- **Tính năng Real-time Live Slot Map**:
  - Tích hợp `Socket.io` để cập nhật bản đồ chỗ đỗ xe theo thời gian thực (real-time). Ngay khi có người chọn (lock), bỏ chọn (unlock), hoặc đặt thành công, bản đồ của mọi người sẽ tự động cập nhật ngay lập tức mà không cần tải lại trang.
- **Cải thiện UI/UX & Bảng Màu Mới**:
  - Thay đổi bảng màu tổng thể tinh tế hơn: Nền toàn trang màu xám/xanh siêu nhạt (`#f8fafc`), các nút hành động chính (Selected) màu xanh Indigo (`#3b82f6`).
  - Các trạng thái đỗ xe (Available, Occupied, Reserved, Maintenance) sử dụng các tông màu pastel dịu nhẹ (ví dụ: nền trắng viền xanh lá cho trống, đỏ cho đã đặt, nền tím nhạt cho reserved) giúp phân cấp thông tin rõ ràng.
  - Cấu trúc lại bản đồ chỗ đỗ xe: **40 slots được chia thành 4 hàng (mỗi hàng 10 slot)** để cân đối giao diện.
  - Các nút đỗ xe (`SlotBtn`) được thiết kế lại: vuốt các góc bo tròn mềm mại (`border-radius: 10px`), thiết kế dáng cao hơn (`56x82px`), hiệu ứng đổ bóng mượt mà.
- **Tinh Chỉnh Bố Cục Booking Page (Mới nhất)**:
  - **Floating Toast Đếm Ngược**: Gỡ bỏ khối hiển thị "Slot Selected" cục mịch. Thay bằng một thanh thông báo Toast nổi lơ lửng ở cạnh dưới màn hình (Bottom-Center) với hiệu ứng trượt mượt mà, tự động đếm ngược và biến mất khi hết thời gian khóa.
  - **Tối giản hóa giao diện**: Xóa bỏ hoàn toàn cột "Booking Summary" bên phải trang để giảm thiểu thông tin dư thừa, người dùng sẽ kiểm tra lại toàn bộ thông tin tại bước "Review & Confirm" cuối cùng.
  - **Căn giữa toàn bộ quy trình**: Thu hẹp không gian modal (từ `900px` xuống `760px`). Sử dụng Flexbox để căn giữa tự động các thẻ chọn Loại xe (Vehicle Type), Khu vực (Zone), và lưới bản đồ đỗ xe (Slot Map Grid), tạo ra một trải nghiệm luồng đặt chỗ cân đối và thanh lịch hơn.

## 2. Hệ Thống Backend & Database (Seeder)
- **Hỗ trợ Slot Locking**:
  - Thêm trường `lockedBy` (người khóa) và `lockedUntil` (thời gian hết hạn khóa) vào Schema của collection `ParkingSlot` (`parkingSlot.model.js`).
  - Xây dựng các hàm `lockSlot`, `unlockSlot`, và logic dọn dẹp (cleanExpiredLocks) tự động mở khóa các slot sau 3 phút không hoạt động trong `parkingSlot.service.js`.
  - Tạo các controller endpoints (`POST /:id/lock` và `DELETE /:id/lock`) và đăng ký API routes.
- **Hỗ trợ WebSockets (Real-time)**:
  - Tích hợp máy chủ WebSockets (`Socket.io`) ở tầng Backend.
  - Phát sự kiện `slotStatusUpdated` tới tất cả các client đang truy cập xem bản đồ của cùng một bãi đỗ xe mỗi khi có hành động lock, unlock, đặt chỗ (`booking.service.js`).
- **Mở Rộng Dữ Liệu Bãi Xe (Parking Lots)**: 
  - Khởi tạo thêm 3 tài liệu (documents) bãi đỗ xe thực tế bao gồm: **Bitexco Financial Tower**, **Vincom Center Đồng Khởi**, và **Sân bay Tân Sơn Nhất (Quốc Nội)**.
  - Tổng cộng hệ thống đang có **4 bãi xe** (gồm cả Bãi Xe Tòa Nhà Văn Phòng 123).
- **Quy Hoạch Tầng & Khu Vực**:
  - Mỗi bãi xe đều được quy hoạch đồng bộ gồm **4 tầng**: Tầng Hầm B1 (Ô tô), Tầng 1 (Ô tô điện & Xe đạp), Tầng 2 (Xe máy), Tầng 3 (Xe máy điện).
  - Cập nhật quy hoạch lại về cấu trúc chuẩn: **2 khu vực (Khu A và Khu B)** cho mỗi tầng, sau đó reset lại số lượng slot mặc định.
- **Tài Khoản & Bảo Mật**:
  - Khởi tạo các tài khoản kiểm thử cho quá trình phát triển (bao gồm `testuser@parking.com` và `trungtin605@gmail.com`).
  - Đảm bảo và giữ lại quy tắc bảo mật `minlength` mật khẩu là 8 ký tự (từng hạ xuống 6 ký tự để test, nhưng đã hoàn nguyên theo yêu cầu).

## 3. Quá Trình Làm Việc
- Tất cả các thay đổi về dữ liệu giả lập (mock data) và cấu trúc sơ đồ tầng đều được tích hợp trực tiếp vào tệp `src/seeders/index.js`.
- Hỗ trợ làm mới toàn bộ môi trường kiểm thử: Bất cứ khi nào cần cập nhật lại cấu trúc hệ thống, chỉ cần chạy lệnh `node src/seeders/index.js --clear` để reset toàn bộ Database về trạng thái ổn định nhất.
