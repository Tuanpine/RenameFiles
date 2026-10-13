# ⚡ Batch File Renamer Pro - Tiếng Việt

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/N%E1%BB%81n%20t%E1%BA%A3ng-Windows%20%7C%20macOS%20%7C%20Linux-success)](https://github.com)

**Ứng dụng đổi tên tệp hàng loạt chuyên nghiệp, an toàn và trực quan**

[English Documentation](README.md) • [Kiến trúc hệ thống](docs/ARCHITECTURE.md) • [Đặc tả quy tắc](docs/RULES_SPECIFICATION.md) • [Hướng dẫn CLI](docs/CLI_GUIDE.md)

</div>

---

## 📖 Giới thiệu

**Batch File Renamer Pro** là ứng dụng web mã nguồn mở hiện đại, giúp bạn tổ chức lại hàng trăm hoặc hàng nghìn tệp tin trên máy tính chỉ trong vài giây. Ứng dụng kết hợp giữa giao diện người dùng trực quan, so sánh khác biệt tên tệp từng ký tự theo thời gian thực (real-time diffing), cơ chế kiểm tra chống trùng lặp tên tệp bảo vệ dữ liệu, và công cụ Python CLI chạy độc lập khi không cần mạng.

Toàn bộ quy trình diễn ra **trực tiếp trong trình duyệt của bạn (Client-Side)**. Không có bất kỳ tệp tin nào bị truyền tải lên máy chủ ngoài.

---

## 🌟 Tính năng chính

### 1. Thao tác tệp trực tiếp & đa nền tảng
- **Đổi tên tại chỗ (In-Place)**: Hỗ trợ Chrome/Edge/Opera thông qua File System Access API. Bạn chọn thư mục trên máy tính, nhấn áp dụng và các tệp được đổi tên ngay lập tức trong thư mục gốc.
- **Dự phòng (Fallback)**: Hoạt động trơn tru trên Firefox và Safari thông qua kéo thả tệp và xuất gói ZIP nén tốc độ cao.
- **Dữ liệu mẫu (Sample Demo)**: Có sẵn nút "Nạp dữ liệu mẫu" để thử nghiệm quy tắc ngay mà không cần chọn tệp thật.

### 2. So sánh trực quan & Kiểm soát an toàn (Conflict Guard)
- **Visual Diffing**: Đánh dấu màu xanh cho các ký tự mới được thêm, màu đỏ cho các ký tự bị lược bỏ.
- **Cảnh báo trùng lặp màu đỏ**: Nếu hai hay nhiều tệp bị đổi tên thành cùng một tên sau khi áp dụng quy tắc, hệ thống sẽ tô đỏ hàng đó và hiển thị banner cảnh báo nguy hiểm.
- **1-Click Tự động sửa trùng tên**: Nhấp vào nút "Tự động đánh số tránh trùng (_1, _2...)" trên thanh cảnh báo để hệ thống tự kích hoạt quy tắc phân giải chỉ số đuôi an toàn.
- **Hoàn tác tức thì (Rollback)**: Lưu lại đầy đủ lịch sử các đợt đổi tên kèm danh sách tên cũ -> tên mới, cho phép khôi phục về trạng thái ban đầu trong 1 cú nhấp.

### 3. Hệ thống 6 tab quy tắc phong phú
- **Làm sạch (Clean)**: Cắt bỏ ký tự đầu/cuối, loại bỏ văn bản trước/sau từ khóa chỉ định, xóa toàn bộ dấu ngoặc đơn `()`, ngoặc vuông `[]`, ngoặc nhọn `{}`, ngoặc nhọn góc `<>`, xóa số thứ tự cũ, xóa danh sách từ thừa.
- **Tìm & Thay thế (Replace)**: Tìm chuỗi thường, thay thế nâng cao bằng nhiều cặp Regex (`/pattern/ -> replacement`), và bộ chuyển dịch ký tự (`tr/a-z/A-Z/`).
- **Kiểu chữ & Khoảng trắng (Case & Spaces)**: Chuyển HOA, thường, Title Case, camelCase, snake_case, kebab-case; chuyển khoảng trắng thành gạch dưới `_` hoặc gạch ngang `-`; gỡ bỏ hoàn toàn dấu tiếng Việt chuẩn Unicode; lọc tệp chỉ giữ ký tự ASCII an toàn.
- **Đánh số & Thông tin (Numbering)**: Đánh số thứ tự tăng dần linh hoạt (tiền tố, hậu tố, thay thế); định dạng bù số không (`01`, `001`); chèn ngày sửa đổi tệp (`YYYY-MM-DD`); chèn tên thư mục cha vào tên tệp.
- **Đuôi tệp (Extension)**: Đổi đuôi tệp hàng loạt, chuyển đuôi sang chữ thường hoặc hoa, hỗ trợ đuôi phức hợp đa cấp (`.tar.gz`, `.min.js`, `.d.ts`).
- **Bộ lọc (Filter)**: Lọc các tệp cần đổi tên theo biểu thức chính quy Regex, lọc theo đuôi tệp hoặc bỏ chọn thủ công các dòng không muốn đổi.

### 4. Tự động hóa & Kịch bản ngoại tuyến
- **Sinh lệnh dòng lệnh**: Tự động dịch các thiết lập trên giao diện thành lệnh dòng lệnh **Python** tương đương (kèm tùy chọn `-n` xem trước, `-y` bỏ xác nhận).
- **Script độc lập (`rename_files.py`)**: Tải về tệp Python hoàn chỉnh để chạy offline trên máy chủ hoặc terminal, luôn xem trước trước khi đổi, không bao giờ ghi đè tệp đã tồn tại, ghi log hoàn tác JSON.

---

## 🚀 Cài đặt & Chạy ứng dụng

### Yêu cầu môi trường
- [Node.js](https://nodejs.org/) phiên bản 22 trở lên (test dùng type-stripping native)
- Bất kỳ trình duyệt web hiện đại nào (Chrome/Edge để đổi tên trực tiếp trên ổ đĩa; Firefox/Safari chỉ xem trước & xuất ZIP)

### Các bước thực hiện

```bash
# 1. Tải mã nguồn về máy
git clone https://github.com/your-username/batch-file-renamer-pro.git
cd batch-file-renamer-pro

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi động máy chủ phát triển
npm run dev

# 4. Đóng gói cho môi trường Production
npm run build
```

Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🛠️ Công nghệ sử dụng

- **Giao diện**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Công cụ dựng**: [Vite 6](https://vitejs.dev/)
- **Tạo kiểu (Styling)**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Biểu tượng (Icons)**: [Lucide React](https://lucide.dev/)
- **Nén tệp ZIP**: [JSZip](https://stuk.github.io/jszip/)
- **Hiệu ứng chuyển động**: [Motion](https://motion.dev/)

---

## 📚 Tài liệu chi tiết

Vui lòng tham khảo các tài liệu chuyên sâu trong thư mục `docs/`:
- [Kiến trúc hệ thống & Lõi xử lý (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Đặc tả kỹ thuật 6 nhóm quy tắc đổi tên (RULES_SPECIFICATION.md)](docs/RULES_SPECIFICATION.md)
- [Hướng dẫn sử dụng Python CLI độc lập (CLI_GUIDE.md)](docs/CLI_GUIDE.md)

---

## 📄 Giấy phép

Dự án được phân phối dưới giấy phép [MIT](LICENSE). Miễn phí sử dụng cho cả mục đích cá nhân và thương mại.
