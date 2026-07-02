# Tài liệu: Logic Tính Tiền Đỗ Xe Hiện Tại

Tài liệu này mô tả chi tiết logic tính phí đỗ xe đang được áp dụng tại hệ thống (dựa trên source code Backend).

## 1. Nguyên tắc cơ bản (Block-based Pricing)

Hệ thống tính tiền dựa trên **Block thời gian (Khối thời gian)**, thay vì tính chính xác theo từng phút.
- Mỗi block có thời lượng cố định là **4 tiếng (4 giờ)**.
- Dù khách hàng đỗ 1 tiếng hay 4 tiếng trong một block, hệ thống vẫn tính tiền bằng **1 block**.

## 2. Phân loại Khung Giờ (Daytime vs Nighttime)

Hệ thống chia làm 2 khung giờ để áp dụng mức giá khác nhau:
- **Ban ngày (Daytime):** Từ `06:00` sáng đến `17:59` chiều.
- **Ban đêm (Nighttime):** Từ `18:00` tối đến `05:59` sáng hôm sau.

## 3. Quy tắc Xác định Giá Block (Rate)

Hệ thống lặp qua từng block 4 tiếng một (từ lúc xe vào đến lúc xe ra) để tính tiền cho từng block. 
Đối với mỗi block:
- Nếu **BẤT KỲ khoảng thời gian nào** của block đó rơi vào khung giờ Ban đêm (Nighttime) → Cả block đó sẽ bị tính theo giá **`nightBlockRate`**.
- Nếu toàn bộ block nằm gọn trong khung giờ Ban ngày (Daytime) → Block đó được tính theo giá **`dayBlockRate`**.

> [!NOTE]
> Trong trường hợp loại xe (Vehicle Type) không cấu hình giá `nightBlockRate`, hệ thống sẽ tự động lấy mặc định giá ban đêm bằng **1.5 lần giá ban ngày** (`dayBlockRate * 1.5`).

## 4. Phụ phí Quá hạn (Overtime Fee / Surcharge)

Logic tính phụ phí đi trễ / ở lại quá giờ hoàn toàn **giống hệt** với logic tính tiền đỗ xe thông thường. 
- **Bắt đầu tính phụ phí:** Kể từ thời điểm `scheduledEnd` (thời gian dự kiến lấy xe trong Booking).
- **Kết thúc tính phụ phí:** Thời điểm khách hàng thực sự lấy xe `actualExit`.

Hệ thống sẽ lấy khoảng thời gian quá hạn này, chia thành các block 4 tiếng và áp dụng luật Daytime/Nighttime y hệt như phần 3 để ra được số tiền phạt (`overtimeFee`).

## 5. Ví dụ Minh họa

Giả sử giá đỗ xe ban ngày (`dayBlockRate`) là **20.000đ**, giá đỗ xe ban đêm (`nightBlockRate`) là **30.000đ**.

**Trường hợp 1: Đỗ xe lúc 08:00 và lấy xe lúc 11:00 (3 tiếng)**
- Thời gian nằm trọn trong 1 block 4 tiếng (08:00 - 12:00).
- Toàn bộ thời gian nằm trong khung giờ Daytime (06:00 - 17:59).
- **Thành tiền:** 1 block ngày = **20.000đ**.

**Trường hợp 2: Đỗ xe lúc 15:00 và lấy xe lúc 21:00 (6 tiếng)**
- Sẽ bị chia làm 2 block:
  - **Block 1 (15:00 - 19:00):** Có phần thời gian từ 18:00 - 19:00 rơi vào ban đêm → Tính giá ban đêm = **30.000đ**.
  - **Block 2 (19:00 - 23:00):** Nằm hoàn toàn trong ban đêm → Tính giá ban đêm = **30.000đ**.
- **Tổng cộng:** **60.000đ**.

> [!WARNING]
> Vì thuật toán quét "nếu chạm vào ban đêm là tính giá ban đêm", nên người dùng có thể phải chịu phí cao hơn nếu họ đỗ xe qua mốc 18:00 tối, kể cả khi họ chỉ đỗ quá vài phút (VD: từ 14:15 đến 18:15).
