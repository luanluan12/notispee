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

- Kiểm tra mỗi 600 giây khi bot bật, không cần mở web. Sau khi gửi báo cáo thành công, dừng gọi API đến 05:00 sáng ngày hôm sau theo giờ Việt Nam, rồi kiểm tra lại mỗi 10 phút. Thời gian tạm nghỉ lưu trong Volume nên restart/deploy không làm mất. Nút Kiểm tra ngay cũng tôn trọng thời gian tạm nghỉ. Nếu gửi lỗi thì tiếp tục thử sau 10 phút.
- Tìm ngày đặt hàng mới nhất có dữ liệu trong 30 ngày gần nhất, theo giờ Việt Nam. Ví dụ 31/10 mới có dữ liệu 30/10 thì gửi báo cáo **30/10**.
- Lần đầu chạy phiên bản này gửi ngày dữ liệu mới nhất. Sau đó chỉ báo ngày mới hơn ngày đã báo; nếu bỏ lỡ nhiều ngày, lần lượt kiểm tra và gửi từng ngày có đơn.
- Báo cáo gồm tổng đơn, đơn huỷ, đơn không huỷ, GMV không huỷ và hoa hồng ước tính sau MCN. Không gửi 0 đơn ngay sau nửa đêm; không gửi lặp khi ngày dữ liệu chưa thay đổi.
- API không có cờ ngày đã chốt hoặc ngày 0 đơn. Bot dùng ngày đặt hàng mới nhất có đơn làm tín hiệu phát hiện, không khẳng định số liệu cuối cùng. Thay đổi số liệu trong ngày đã báo không kích hoạt tin mới.
- Trạng thái theo ngày dữ liệu lưu trong Volume, tách khỏi trạng thái cũ theo ngày kiểm tra. Nâng phiên bản không mất API Key, token hoặc trạng thái bật/tắt.
- Lỗi gửi tin không đánh dấu đã báo; thử lại lượt sau. Kết nối Telegram đứt sau khi nhận tin có thể gây gửi lặp ở lần thử lại.

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
