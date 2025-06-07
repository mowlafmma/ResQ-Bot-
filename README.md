# ResQ Bot - Hệ Thống Giám Sát Thời Gian Thực

## Tổng Quan
ResQ Bot là một hệ thống giám sát thời gian thực được thiết kế để phát hiện đối tượng (ví dụ: người) sử dụng mô hình YOLO và hiển thị kết quả trên giao diện web. Hệ thống tích hợp luồng video, theo dõi GPS và thông báo. README này hướng dẫn cách thiết lập và chạy dự án cục bộ mà không cần phần cứng như ESP32-S3.

## Cấu Trúc Dự Án
- `app.py`: Máy chủ Flask xử lý phát hiện YOLO, luồng video và phát trực tuyến HLS.
- `realtime.html`: Giao diện web cho video thời gian thực, bản đồ và thông báo.
- `server.js`: Máy chủ Node.js để phục vụ giao diện web và proxy các yêu cầu.
- `public/`: Thư mục chứa các tệp tĩnh (ví dụ: tệp HTML).

## Yêu Cầu Hệ Thống
- **Python 3.x**
- **Node.js**
- Gói Python cần thiết:
  - `flask`
  - `flask-cors`
  - `ultralytics`
  - `opencv-python`
  - `requests`
  - Cài đặt bằng: `pip install flask flask-cors ultralytics opencv-python requests`
- Gói Node.js cần thiết:
  - `express`
  - `http-proxy-middleware`
  - Cài đặt bằng: `npm install express http-proxy-middleware`

## Hướng Dẫn Thiết Lập
1. **Thiết lập thư mục dự án**:
   - Tạo một thư mục (ví dụ: `resq-bot`) và đặt `app.py`, `realtime.html`, và `server.js` vào trong đó.
   - Tạo thư mục `public` bên trong thư mục dự án và di chuyển `realtime.html` vào đó.

2. **Cài đặt phụ thuộc**:
   - Chạy `pip install -r requirements.txt` (tạo `requirements.txt` với các gói trên nếu cần).
   - Chạy `npm install` trong thư mục dự án.

3. **Chạy các máy chủ**:
   - Khởi động máy chủ Flask: `python app.py`
   - Khởi động máy chủ Node.js: `node server.js` hoặc `npm start`
   - Đảm bảo cả hai máy chủ chạy mà không có lỗi (kiểm tra log trên terminal).

## Cách Hoạt Động
- **Máy Chủ Flask (`app.py`)**:
  - Chứa endpoint phát hiện YOLO (`/yolo`) trả về phản hồi giả lập `{"message": "person (0.95)"}` để kiểm tra cục bộ.
  - Cung cấp endpoint luồng video (`/video_feed`) và âm thanh (`/audio_feed`), nhưng các chức năng này bị vô hiệu hóa trong chế độ cục bộ mà không có phần cứng.
  - Sử dụng HLS (HTTP Live Streaming) để kết hợp video và âm thanh, nhưng tính năng này bị bỏ qua trong kiểm tra cục bộ.

- **Máy Chủ Node.js (`server.js`)**:
  - Phục vụ giao diện web (`realtime.html`) tại `http://localhost:3000/realtime`.
  - Proxy các yêu cầu từ `/yolo` đến `http://localhost:5000/yolo` để kết nối với máy chủ Flask.

- **Giao Diện Web (`realtime.html`)**:
  - Hiển thị luồng video (chỉ là placeholder trong chế độ cục bộ).
  - Hiển thị bản đồ Google với marker di chuyển được cập nhật mỗi 5 giây qua `/gps` (dữ liệu giả lập).
  - Kiểm tra endpoint `/yolo` mỗi 10 giây và hiển thị thông báo "Có người" với thời gian nếu phát hiện "person".
  - Cập nhật thời gian hiện tại mỗi giây.

## Kiểm Tra Cục Bộ (Không Cần Phần Cứng)
Vì không có phần cứng (như ESP32-S3), hãy làm theo các bước sau:
1. **Chạy Máy Chủ Flask**:
   - Đảm bảo `app.py` chạy trên `http://localhost:5000`.
   - Kiểm tra `/yolo` bằng cách mở `http://localhost:5000/yolo` trong trình duyệt (nên trả về `{"message": "person (0.95)"}`).

2. **Chạy Máy Chủ Node.js**:
   - Truy cập `http://localhost:3000/realtime` trong trình duyệt.
   - Mở Công Cụ Nhà Phát Triển (F12) -> tab Console để kiểm tra log.

3. **Hành Vi Dự Kiến**:
   - Thời gian sẽ hiển thị dưới dạng `07-06-25 12:11:00 +07` và cập nhật mỗi giây.
   - Sau 10 giây, bảng "Caution" sẽ hiển thị `12:11:00 +07 - Có người`.

## Giải Quyết Vấn Đề
- **Flask không chạy**:
  - Kiểm tra cổng 5000: `netstat -an | find "5000"` (Windows) hoặc `lsof -i :5000` (Linux/Mac).
  - Chạy lại `python app.py`.
- **Lỗi proxy**:
  - Nếu thấy lỗi khi proxy, đảm bảo Flask chạy trước Node.js và kiểm tra `server.js`.
- **Cung cấp log**:
  - Nếu gặp vấn đề, gửi log từ terminal Flask và console trình duyệt.

## Lưu Ý
- Dự án này được thiết kế để chạy cục bộ mà không cần phần cứng. Để tích hợp với ESP32-S3, bạn cần cấu hình lại `app.py` với các URL luồng thực tế.
- Đảm bảo API key Google Maps trong `realtime.html` là hợp lệ.
