# Affiliate Dashboard + Telegram cho Railway

Node.js 24, không cần dependencies, không phụ thuộc Cloudflare. Web không có đăng nhập theo yêu cầu; ai có link có thể xem dữ liệu và sửa cấu hình bot.

## Deploy

1. Giải nén và đưa **các file bên trong thư mục source** lên gốc repository GitHub. Dockerfile, server.js, package.json và railway.json phải nằm ở gốc.
2. Railway → New Project → Deploy from GitHub repo → chọn repo. Railway tự build Dockerfile.
3. **Gắn Volume vào service tại `/data`.** DATA_DIR mặc định đã là `/data` trong Dockerfile. Đây là bước bắt buộc để giữ cấu hình qua restart và deploy.
4. **Tắt Serverless/App Sleeping**, dùng **1 replica, 1 vùng**. Railway.json đã đặt Restart Policy Always; cần gói hỗ trợ Always (Free/Trial không hỗ trợ, phải đổi thành ON_FAILURE hoặc nâng gói).
5. Settings → Networking → Generate Domain. PORT tự lấy từ Railway; health check `/health`.
6. Mở URL Railway → nhập API Key AddLiveTag, Telegram Bot Token và Chat ID cá nhân → Lưu cấu hình. Mở chat với đúng bot, bấm Start.
7. Gửi tin thử → Bật bot. Bot kiểm tra ở lượt nền tiếp theo, tối đa khoảng 10 phút; hoặc bấm Kiểm tra ngay để thử.

Không cần nhập token/API Key vào Railway Variables. Cấu hình được mã hoá AES-GCM và lưu trong Volume. Khoá tự sinh một lần tại `/data/encryption.key`; không xoá hoặc đổi khoá nếu muốn đọc được cấu hình cũ. BOT_ENCRYPTION_KEY là tuỳ chọn (64 ký tự hex); thông thường để trống.

**Thông tin đã lưu trên Sites không tự chuyển sang Railway.** Nhập lại một lần trên URL Railway mới. Khi Volume còn nguyên, restart/deploy sau không làm mất cấu hình. URL Sites cũ vẫn là hệ thống riêng, không có lịch nền 10 phút.

## Bot chạy thế nào

- Khi bot bật, từ 05:00 mỗi sáng theo giờ Việt Nam kiểm tra dữ liệu ngày hôm trước mỗi 10 phút; gửi báo cáo khi có dữ liệu đơn. Không cần mở web. Khởi động trễ thì gửi ở lượt kiểm tra tiếp theo.
- Báo cáo gồm tổng đơn, đơn huỷ, đơn không huỷ, GMV không huỷ và hoa hồng sau MCN.
- Gửi thành công: lưu trạng thái vào Volume và nghỉ đến 05:00 hôm sau. Không gửi lặp khi restart/deploy. Nút Kiểm tra ngay cũng tôn trọng giờ nghỉ.
- API/Telegram lỗi: không ghi đã gửi, thử lại sau 10 phút. Không biến lỗi API thành báo cáo 0.
- **Giới hạn chưa giải quyết:** API AddLiveTag không có tín hiệu xác nhận đã đồng bộ ngày 0 đơn. Kết quả 0 được giữ ở trạng thái awaiting_data, không gửi hay đánh dấu hoàn thành. Muốn báo 0 đúng lúc cần nguồn xác nhận đợt đồng bộ từ nhà cung cấp. Bản này không gửi bổ sung sau báo cáo.
- Bỏ qua lịch sử trước 31/10/2026; mốc có thể đổi bằng START_DATA_DAY. Không tự gửi bù nhiều ngày nếu service ngừng chạy.

## Chạy local

Node.js >=22; Docker dùng Node 24. Không cần npm install.

```sh
npm test
npm start
```

Mở http://localhost:3000. Local lưu ở `./data`. Có thể đổi PORT và DATA_DIR qua biến môi trường.

File chính: app.js (UI/API), server.js (HTTP và lịch 10 phút), storage.js (lưu bền vững), Dockerfile và railway.json (deploy).

Đã kiểm tra lưu mã hoá/đọc lại, che bí mật, bật/tắt, báo cáo 0 đơn không gửi lặp và khoá gửi đồng thời. Chưa deploy vào tài khoản Railway hoặc gửi Telegram thật từ bản này.

Tài liệu:
- https://docs.railway.com/volumes
- https://docs.railway.com/deployments/serverless
- https://docs.railway.com/deployments/restart-policy
