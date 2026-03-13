# Buggy PHP Lab

Project PHP mini cho sinh viên thực hành tìm lỗi và sửa lỗi.

## Mục tiêu bài tập

Sinh viên cần:

1. Chạy được project trong môi trường local.
2. Tìm tối thiểu 8 lỗi trong source code.
3. Phân loại mỗi lỗi vào 1 trong 2 nhóm:
   - `syntax`
   - `logic`
4. Sửa tất cả lỗi để các trang hoạt động đúng.

## Cách chạy

Yêu cầu:

- PHP 8.1 trở lên

Chạy built-in server:

```bash
php -S localhost:8000
```

Mở trình duyệt:

```text
http://localhost:8000
```

## Các trang cần kiểm tra

- `/` hoặc `/?page=dashboard`
- `/?page=orders`
- `/?page=checkout`
- `/?page=customers`
- `/?page=reports`
- `/?page=settings`

## Gợi ý

- Có cả lỗi khiến trang bị `parse error`.
- Có lỗi không làm crash trang, nhưng trả ra kết quả sai.
- Không cần database, dữ liệu mẫu nằm trong thư mục `data/`.
- Nên dùng `php -l <file>` để kiểm tra syntax từng file.

## Kết quả mong đợi

Sau khi sửa xong:

- Tất cả route đều mở được.
- Số liệu trên dashboard hợp lý.
- Danh sách đơn hàng hiển thị đúng.
- Tính toán checkout đúng logic.
- Báo cáo và cài đặt không còn lỗi syntax.
