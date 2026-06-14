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

## Host Online Với Cloudflare Tunnel

Project này có thể chạy online bằng cách tạo 2 tunnel Cloudflare:

- `3000` cho frontend
- `8080` cho backend

Ví dụ:

- frontend: `https://attack-visualization.your-domain.com` -> `http://localhost:3000`
- backend: `https://attack-api.your-domain.com` -> `http://localhost:8080`

### Bước 1: Chạy hệ thống local

```bash
docker compose up -d --build
```

### Bước 2: Tạo tunnel cho frontend và backend

Ví dụ với `cloudflared`:

```bash
cloudflared tunnel --url http://localhost:3000
cloudflared tunnel --url http://localhost:8080
```

Nếu dùng hostname cố định trên Cloudflare Zero Trust, ánh xạ như sau:

- hostname frontend -> `http://localhost:3000`
- hostname backend -> `http://localhost:8080`

### Bước 3: Cập nhật URL frontend trước khi build hoặc deploy online

Hiện tại frontend đang hardcode backend local trong:

- `dashboard/script.js`
- `map/script.js`

Giá trị hiện tại:

```js
const API_BASE_URL = 'http://localhost:8080/api/events';
const WS_URL = 'ws://localhost:8080/ws/live';
```

Khi host online, cần đổi thành domain public của backend:

```js
const API_BASE_URL = 'https://attack-api.your-domain.com/api/events';
const WS_URL = 'wss://attack-api.your-domain.com/ws/live';
```

Lưu ý:

- nếu không đổi, người dùng từ xa sẽ tải frontend thành công nhưng frontend vẫn gọi `localhost:8080` trên máy của họ và dữ liệu sẽ không hiển thị
- khi frontend chạy bằng `https`, WebSocket cũng phải dùng `wss`

### Bước 4: Build lại và chạy lại frontend

Sau khi đổi URL trong `dashboard/script.js` và `map/script.js`, chạy lại:

```bash
docker compose up -d --build
```

### Bước 5: Truy cập online

- frontend: `https://attack-visualization.your-domain.com/map`
- dashboard: `https://attack-visualization.your-domain.com/dashboard`
- backend API: `https://attack-api.your-domain.com/api/events`

## Ghi Chú

- Dữ liệu GeoIP được mount từ `Database/GeoLite2-City` vào container backend tại `/app/geoip`.
- Frontend đang cấu hình gọi backend local tại `http://localhost:8080` và WebSocket tại `ws://localhost:8080/ws/live`.
- Khi chạy bằng Docker Compose, Nginx frontend tự chuyển trang gốc sang `/map`.
