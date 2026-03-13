# BÁO CÁO CHI TIẾT CHỈNH SỬA LỖI (BUG FIX REPORT)

## 1. Nhóm lỗi tại thư mục `Variant` 
*(Chủ yếu là lỗi cú pháp)*

| Tên File | Dòng (Line) | Mã code / Ký tự cập nhật | Mô tả chỉnh sửa |
| :--- | :--- | :--- | :--- |
| `settings.php` | 7 | `]` | Bổ sung ký tự đóng mảng (array) bị thiếu. |
| `reports.php` | 3 | `;` | Bổ sung dấu chấm phẩy kết thúc câu lệnh. |
| `customers.php` | 6 | `])` | Bổ sung ký tự đóng mảng và ngoặc đơn đóng hàm. |

## 2. Nhóm lỗi tại thư mục `Buggy` 
*(Lỗi cú pháp & Lỗi Logic)*

| Tên File | Dòng (Line) | Mã code / Ký tự cập nhật | Mô tả chỉnh sửa |
| :--- | :--- | :--- | :--- |
| `settings.php` | 5 | `,` | Bổ sung dấu phẩy ngăn cách các phần tử. |
| `reports.php` | 15 | `)` | Bổ sung dấu đóng ngoặc đơn. |
| `customers.php` | 3 | `;` | Bổ sung dấu chấm phẩy kết thúc câu lệnh. |
| `checkout.php` | 15 | `$discountValue = $subtotal * ($discountPercent/100);` | **Sửa lỗi logic:** Cập nhật lại công thức tính giá trị giảm giá. |
| `dashboard.php` | 12 | `$productPrice = $products[$item['sku']]['price'];`<br>`$totalRevenue += ($item['qty'] * $productPrice);` | **Sửa lỗi logic:** Cập nhật biến giá tiền sản phẩm và sửa công thức tính tổng doanh thu (`Tổng tiền = Số lượng * Giá tiền`). |
| `dashboard.php` | 20 | `if ($product['stock'] <= 5)` | **Sửa lỗi logic:** Cập nhật lại điều kiện kiểm tra sản phẩm gần hết hàng (Số lượng tồn kho `<= 5`). |
| `orders
