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
- **Tinh Chỉnh Trang Phiên Đỗ Hiện Tại (Live Session Tracker - `/session`)**:
  - Gỡ bỏ header cồng kềnh, chỉ giữ lại nút "Quay lại" giúp tiết kiệm không gian. Thay đổi màu nền các khối thông tin (cards) thành màu trắng, tạo sự liền mạch.
  - **Cải thiện chống cuộn trang (Compact Layout)**: Gộp khối Mã QR (thu nhỏ về bên trái) và thông tin Biển số xe (bên phải) thành một thẻ ngang duy nhất. Toàn bộ thông tin quan trọng nhất nay đã nằm gọn trên 1 màn hình chuẩn mà không cần cuộn (scroll).
  - Sửa lỗi sai toán tử fallback (`??` thành `||`) khiến biển số xe bị rỗng và không hiển thị được.
- **Tích hợp Luồng QR Checkout**:
  - Xóa bỏ QR Code tĩnh (fake SVG component) trên trang Session. Thay thế bằng thư viện chuẩn `qrcode.react`.
  - Mở rộng Helper cấu trúc Token (`qrToken.ts`): Bổ sung `type: 'checkout'` và `sessionId` vào payload JWT để sinh mã Checkout chống giả mạo, giải quyết luồng trả xe không cần vé booking cho khách vãng lai.
  - Sửa triệt để các lỗi biên dịch TypeScript trong `CheckoutPage.tsx` (liên quan đến shorthand scopes và định nghĩa Interface).
- **Sửa Lỗi Đồng Bộ QR & Nhận Diện Staff Exit**: 
  - Giải quyết dứt điểm lỗi 400 Bad Request do mã QR sinh chuỗi rác khi `session._id` chưa kịp load trên `SessionPage.tsx`. Chuyển sang sử dụng `sessionCode` làm giá trị fallback.
  - Cải thiện logic quét mã QR tại cổng ra (`StaffExitPage.tsx`): tự động nhận diện và phân loại chuỗi `sessionCode` (bắt đầu bằng `PS-`) để gọi đúng hàm `findActive({ sessionCode })` thay vì ép kiểu cứng nhắc thành JWT sessionId.
- **Hoàn Thiện Logic Tính Phí & Cảnh Báo (Session Page)**:
  - Cập nhật logic phụ thu cực kỳ chặt chẽ:
    - **Early Arrival Surcharge**: Cho phép châm chước check-in sớm 15 phút. Nếu đến sớm hơn 15 phút, hệ thống sẽ tự động tính thêm block phụ thu.
    - **Late Departure Surcharge**: Hệ thống tính phí lố giờ ngay lập tức nếu thời gian đỗ xe vượt quá giờ `Booked Exit` dù chỉ 1 giây.
  - Giao diện **Surcharge Logs**: Xây dựng lại cách hiển thị phụ thu. Hệ thống nay sinh ra một thẻ "Surcharge Logs" liệt kê từng khoản phạt theo từng mốc thời gian (như một hóa đơn chi tiết). Nếu không có phụ thu, hiển thị trạng thái an toàn "✅ No Surcharges Incurred".
  - **Hệ Thống Cảnh Báo Sớm (Early Warning)**:
    - Khi thời gian đậu xe chỉ còn <= 15 phút là chạm mốc giờ hết hạn, huy hiệu "ACTIVE" màu xanh sẽ chuyển sang màu cam "EXPIRING SOON" nhấp nháy.
    - Kích hoạt **thông báo dạng nổi (Floating Toast)** nhảy từ cạnh trên màn hình xuống (kèm animation và đổ bóng viền cam) báo hiệu người dùng chuẩn bị đưa xe ra ngoài.
  - Nâng cấp **Dev Tools**: Bổ sung các nút "+ 1 Phút", "+ 15 Phút" để phục vụ việc tua nhanh thời gian (Fast Forward) và kiểm tra các kịch bản phụ thu một cách linh hoạt.
  - Đồng bộ hoá UI các thẻ nội dung (Notice Card): Tinh chỉnh `border-radius`, `box-shadow` và `background` để đồng bộ tuyệt đối với phong cách thiết kế "glass/white card" chung của toàn trang.
- **Tối Ưu Hóa Kích Thước Mã QR (QR Slimming)**:
  - Thay thế hoàn toàn cơ chế tạo mã QR bằng chuỗi Base64 HMAC-SHA256 dài (~150-250 ký tự) bằng các chuỗi định danh ngắn gọn: `ci_<bookingId>` (cho Check-in) và `co_<sessionId>` (cho Check-out) dài khoảng 27 ký tự. 
  - Việc này làm giảm mạnh mật độ điểm ảnh (version) của mã QR, giúp Camera của thiết bị nhân viên quét siêu tốc, nhạy và chính xác hơn ngay cả trong điều kiện chói sáng hay trầy xước màn hình.
  - Cập nhật lại toàn bộ logic trong `StaffPage.tsx` và `StaffExitPage.tsx` (bao gồm cả máy quét cầm tay và camera nhận diện) để ưu tiên đọc luồng QR mới này, nhưng vẫn đảm bảo tính tương thích ngược (backward compatibility) với các token HMAC cũ.
- **Sửa Lỗi Tính Phí Phụ Thu Qua Đêm (Cross-Midnight Surcharge Bug)**:
  - Khắc phục triệt để lỗi logic nghiêm trọng trên `SessionPage.tsx` khiến hệ thống tự động báo "Overtime" và sinh ra hàng tá "Surcharge logs" ảo ngay khi người dùng vừa Check-in vào bãi đỗ xe.
  - *Nguyên nhân & Giải pháp*: Khi người dùng đặt vé qua đêm (ví dụ vào 22:00, ra 01:00 sáng hôm sau), `endTime` (01:00) vô tình bị hiểu là nhỏ hơn `startTime` (22:00) trên cùng một mốc ngày giờ, dẫn tới thời gian hết hạn bị lùi về quá khứ 20 tiếng. Đã bổ sung logic phát hiện nếu `endTime <= startTime` thì sẽ tự động cộng thêm một ngày (`24 * 60 * 60 * 1000` ms) vào `scheduledEnd`, trả lại sự chính xác tuyệt đối cho bộ máy tính phí.

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

## 3. Quá Trình Làm Việc & Quy trình chéo (Cross-team)
- Tất cả các thay đổi về dữ liệu giả lập (mock data) và cấu trúc sơ đồ tầng đều được tích hợp trực tiếp vào tệp `src/seeders/index.js`.
- Hỗ trợ làm mới toàn bộ môi trường kiểm thử: Bất cứ khi nào cần cập nhật lại cấu trúc hệ thống, chỉ cần chạy lệnh `node src/seeders/index.js --clear` để reset toàn bộ Database về trạng thái ổn định nhất.
- Bàn giao chức năng cho bộ phận Staff App: Khởi tạo và bàn giao file **`Task_Staff_QR_Checkout.md`** mô tả cực kỳ chi tiết về kiến trúc payload, luồng xử lý quét JWT Token, cũng như hướng dẫn catch lỗi phục vụ cho team Staff triển khai máy quét Barcode/Camera tích hợp tại Cổng Ra (`StaffExitPage`).
- Bổ sung tài liệu chuẩn hóa luồng nghiệp vụ: Tạo tệp tài liệu ghi chú tổng hợp `parking_workflow_documentation.md` ghi chép luồng dữ liệu của Hệ thống Booking, sinh mã QR, quá trình Check-in và Checkout dành riêng cho cổng nhân viên.
