# Attack Visualization System

Hệ thống mô phỏng và trực quan hóa các sự kiện tấn công mạng theo thời gian thực. Dự án gồm backend Spring Boot, Kafka, Redis, PostgreSQL và frontend tĩnh hiển thị bản đồ 3D cùng dashboard thống kê.

## Thành Phần Chính

- `backend`: Spring Boot WebFlux API, Kafka producer/consumer, WebSocket live feed và GeoIP enrichment.
- `map`: giao diện bản đồ 3D Cyber Threat Map.
- `dashboard`: giao diện dashboard thống kê, biểu đồ và bảng sự kiện realtime.
- `Database/GeoLite2-City`: cơ sở dữ liệu GeoIP dùng để ánh xạ địa chỉ IP sang vị trí địa lý.
- `docker-compose.yml`: cấu hình chạy toàn bộ hệ thống bằng Docker Compose.

## Yêu Cầu

- Docker Desktop
- Kết nối internet trong lần chạy đầu để Docker tải image và backend có thể lấy dữ liệu từ SANS ISC

## Chạy Dự Án

Tại thư mục gốc của project, chạy:

```bash
docker compose up -d --build
```

Sau khi các container khởi động, truy cập:

- Bản đồ 3D: http://localhost:3000/map
- Dashboard: http://localhost:3000/dashboard
- Backend API: http://localhost:8080/api/events

## Test Gửi Sự Kiện Tấn Công Mẫu

Linux/macOS/Git Bash:

```bash
curl -X POST http://localhost:8080/api/attack/simulator \
  -H "Content-Type: application/json" \
  -d "{\"ip\":\"8.8.8.8\",\"type\":\"DDoS\"}"
```

PowerShell:

```powershell
curl.exe -X POST "http://localhost:8080/api/attack/simulator" `
  -H "Content-Type: application/json" `
  -d "{\"ip\":\"8.8.8.8\",\"type\":\"DDoS\"}"
```

## Dừng Dự Án

```bash
docker compose down
```

Nếu muốn xóa luôn volume PostgreSQL:

```bash
docker compose down -v
```

## Ghi Chú

- Dữ liệu GeoIP được mount từ `Database/GeoLite2-City` vào container backend tại `/app/geoip`.
- Frontend đang cấu hình gọi backend local tại `http://localhost:8080` và WebSocket tại `ws://localhost:8080/ws/live`.
- Khi chạy bằng Docker Compose, Nginx frontend tự chuyển trang gốc sang `/map`.
