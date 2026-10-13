# Changelog / Nhật ký thay đổi

All notable changes to **Batch File Renamer Pro** will be documented in this file.  
Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong tài liệu này.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-13

### 🇺🇸 English Release Notes

#### ✨ Added
- **Interactive 3-Step Guided Workflow**: Clear progression from `1. Select Files` -> `2. Configure Rules` -> `3. Preview & Apply`, responsive drawer support on mobile screens.
- **Proactive Overwrite & Collision Guard**:
  - Rows that would result in identical target names in the same folder are visually highlighted in prominent red (`bg-rose-50/border-rose-300`).
  - Severe conflict warning banner displaying the exact duplicate count.
  - **1-Click Auto-Resolve Action**: Automatically activates numeric suffix indexing (`_{n}`) to guarantee unique filenames and eliminate overwrite hazards.
- **History & Rollback Modal**:
  - Detailed audit log of applied renaming batches.
  - Real-time search across historical runs by original or renamed filename.
  - One-click instant Rollback to safely restore original names.
  - Export and import history sessions in standard JSON format.
- **Advanced Regex & Character Mapping**:
  - Added support for multiple ordered Regex replacement pairs (`/pattern/ -> replacement`).
  - Added Unix `tr`-style Character Translation Maps (e.g. `abc -> xyz`).
- **Compound Extensions Handling**:
  - Specialized logic to recognize multi-part extensions such as `.tar.gz`, `.tar.bz2`, `.min.js`, `.min.css`, `.d.ts`.
- **Standalone Offline Python CLI (`rename_files.py`)**:
  - Self-contained, portable single-file script exportable from the UI.
  - Always previews before touching disk, never overwrites existing files (skips instead), writes JSON rollback logs, and ships full argparse CLI flags.

#### 🔧 Changed
- Streamlined `buildPlan` execution in `src/utils/renamerCore.ts` to directly account for excluded items during duplicate collision detection.
- Unified preset configuration models to support both core rules and extended regex/charmap pairs.

#### 🛡️ Security & Privacy
- Enforced 100% client-side execution via Web File System Access API and JSZip; zero remote server uploads.
- Sanitized filenames against Windows invalid characters (`<>:"/\|?*`) and reserved DOS device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`).

---

### 🇻🇳 Ghi chú phát hành Tiếng Việt

#### ✨ Tính năng mới
- **Quy trình 3 bước trực quan**: Chia luồng thao tác rõ ràng: `1. Nạp tệp` -> `2. Cấu hình quy tắc` -> `3. Xem trước & Thực thi`, tự động thích ứng với màn hình di động và máy tính bảng.
- **Cơ chế chống ghi đè & Xung đột tên tệp**:
  - Tô đỏ nổi bật các hàng có nguy cơ trùng tên sau khi áp dụng quy tắc.
  - Banner cảnh báo nguy hiểm ghi rõ số lượng tệp xung đột.
  - **Nút 1-Click Tự động sửa trùng tên**: Tự động kích hoạt cơ chế đánh số đuôi `_1`, `_2`... để triệt tiêu nguy cơ mất tệp.
- **Lịch sử thao tác & Hoàn tác (Rollback)**:
  - Lưu trữ chi tiết các đợt đổi tên đã thực hiện.
  - Hộp tìm kiếm thông minh trong lịch sử theo tên cũ hoặc tên mới.
  - Nút Hoàn tác nhanh khôi phục tên tệp ban đầu chỉ với 1 cú nhấp chuột.
  - Xuất và nhập nhật ký lịch sử dưới dạng tệp JSON.
- **Biểu thức chính quy Regex & Ánh xạ ký tự**:
  - Hỗ trợ nhập nhiều cặp quy tắc Regex tuần tự (`/pattern/ -> replacement`).
  - Hỗ trợ bảng chuyển đổi ký tự tương tự lệnh `tr` trên Linux (`abc -> xyz`).
- **Hỗ trợ phần mở rộng tệp phức hợp**:
  - Tự động nhận diện chính xác các phần mở rộng đa cấp như `.tar.gz`, `.tar.bz2`, `.min.js`, `.min.css`, `.d.ts`.
- **Bộ công cụ Python CLI độc lập (`rename_files.py`)**:
  - Tải về script Python hoàn chỉnh chỉ gồm một tệp tin duy nhất.
  - Luôn xem trước trước khi đổi, không bao giờ ghi đè tệp đã tồn tại, lưu log hoàn tác JSON và hỗ trợ đầy đủ các tham số dòng lệnh.

#### 🔧 Cải tiến
- Tối ưu hóa giải thuật tính toán `buildPlan` trong `src/utils/renamerCore.ts`, liên kết trực tiếp danh sách tệp bị loại trừ để tính toán xung đột chính xác 100%.
- Đồng bộ hóa các Preset mẫu với toàn bộ tính năng Regex và Character Map mới.

#### 🛡️ An toàn & Bảo mật
- Hoạt động 100% cục bộ trên trình duyệt thông qua Web File System Access API và JSZip. Không gửi dữ liệu lên mạng.
- Tự động kiểm tra và lọc sạch các ký tự cấm trên Windows (`<>:"/\|?*`) cùng các tên tệp dành riêng của hệ điều hành.
