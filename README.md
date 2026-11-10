# Political Economy RPG

Game RPG chạy trên trình duyệt, được xây dựng với React và Vite. Dữ liệu game mặc định được đọc từ `db.json`; dữ liệu save được lưu trong `localStorage` của trình duyệt. Không cần chạy backend để chơi ở chế độ mặc định.

## Yêu cầu

- Node.js và npm (khuyến nghị dùng phiên bản LTS hiện hành)

Kiểm tra cài đặt:

```bash
node --version
npm --version
```

## Chạy dự án ở chế độ phát triển

Mở terminal tại thư mục dự án và chạy:

```bash
npm install
npm run dev
```

Vite sẽ in địa chỉ local trong terminal (thường là `http://localhost:5173`). Mở địa chỉ đó trong trình duyệt. Giữ terminal chạy trong lúc sử dụng app; nhấn `Ctrl+C` để dừng.

## Chạy kèm API `json-server` (tùy chọn)

Mặc định app lấy các bộ dữ liệu như lớp nhân vật, quái vật, màn chơi và câu hỏi trực tiếp từ `db.json`. Muốn chạy API riêng, mở **hai terminal** tại thư mục dự án.

Terminal thứ nhất:

```bash
npm run server
```

API khởi chạy tại `http://localhost:3000` và đọc/ghi dữ liệu trong `db.json`.

Terminal thứ hai, cấu hình URL API rồi chạy Vite:

PowerShell:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:3000"
npm run dev
```

Command Prompt (cmd):

```cmd
set VITE_API_BASE_URL=http://localhost:3000
npm run dev
```

Nếu không đặt `VITE_API_BASE_URL`, app dùng dữ liệu local. Nếu API không truy cập được, app cũng tự chuyển sang dữ liệu local. Khi bật API, thao tác tạo/cập nhật/xóa save được gửi tới `json-server`; khi dùng chế độ mặc định, save được lưu trong `localStorage` của trình duyệt.

## Các lệnh npm

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy máy chủ phát triển Vite |
| `npm run server` | Chạy API `json-server` tại cổng 3000 |
| `npm run build` | Tạo bản build production trong `dist/` |
| `npm run preview` | Xem thử bản build production tại máy local |
| `npm run lint` | Kiểm tra mã nguồn trong `src/` bằng Oxlint |

Để xem bản build, chạy lần lượt `npm run build` và `npm run preview`, sau đó mở URL được in ở terminal.

## Cấu trúc dữ liệu và lưu game

- `db.json`: dữ liệu khởi tạo cho game và nguồn dữ liệu của `json-server`.
- `src/services/api.js`: chọn API theo `VITE_API_BASE_URL`, kèm fallback sang dữ liệu local.
- `localStorage`: lưu save game và save đang hoạt động ở chế độ không dùng API. Dữ liệu này thuộc về trình duyệt hiện tại.

## Khắc phục sự cố

- Nếu lệnh npm báo thiếu thư viện, chạy `npm install` tại thư mục dự án rồi thử lại.
- Nếu cổng 3000 đã được ứng dụng khác sử dụng, dừng ứng dụng đó trước khi chạy `npm run server`.
- Nếu vừa thay đổi `VITE_API_BASE_URL` mà app chưa nhận cấu hình mới, dừng Vite bằng `Ctrl+C` rồi khởi động lại `npm run dev` trong cùng terminal đã đặt biến môi trường.
