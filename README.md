# ⚡ Batch File Renamer Pro

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-success)](https://github.com)

**Công cụ đổi tên file hàng loạt chuyên nghiệp, an toàn và trực quan**  
*Professional, Safe & Intuitive Batch File Renaming Suite*

[🇺🇸 English](#-english) • [🇻🇳 Tiếng Việt](#-tiếng-việt) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

<a name="english"></a>
## 🇺🇸 English

### 🌟 Overview

**Batch File Renamer Pro** is a modern, high-performance web application designed for fast, error-free file renaming across Windows, macOS, and Linux. Built with React 19, TypeScript, and the modern Web File System Access API, it provides real-time character-by-character visual diffing, proactive collision and overwrite detection, and one-click rollback capabilities.

It runs **100% client-side inside your browser**: your files and folders are never uploaded to any remote server, ensuring complete data privacy and security.

Additionally, Batch File Renamer Pro includes an exportable, standalone, offline **Python CLI** (`rename_files.py`) with dry-run preview and rollback logs for headless server environments or automated cron pipelines.

---

### ✨ Key Features

- **🚀 Direct In-Place Folder Renaming**: Leverages the Chrome/Edge Web File System Access API (`showDirectoryPicker`) to rename files directly on your disk without downloading or copying.
- **🛡️ Preview Mode for All Browsers**: Firefox, Safari and insecure connections fall back to multi-file drag-and-drop preview plus one-click ZIP export. In this mode renames are previewed and packaged — **files on disk are not renamed**.
- **🔍 Real-Time Visual Diffing**: Instantly view modified filenames with green/rose highlights showing exact string insertions, removals, and replacements.
- **🚨 Overwrite & Conflict Guard**:
  - Highlights duplicate destination filenames in bold red.
  - Detects case-insensitive collisions (e.g. `File.txt` vs `file.txt` on Windows/macOS).
  - Offers a **1-Click Auto-Resolve** button to automatically append numeric indexes (`_1`, `_2`, etc.) to prevent data loss.
- **🧩 6 Comprehensive Rule Categories**:
  1. **Clean**: Remove leading/trailing prefixes/suffixes, remove characters before/after delimiters, strip brackets `( ) [ ] { } < >`, remove numbers, and clean unwanted words.
  2. **Replace**: Plain text search-and-replace, multi-pair regex substitutions (`/pattern/ -> replacement`), and character translation maps (`tr/a-z/A-Z/`).
  3. **Case & Separator**: Convert to UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case; normalize spaces into underscores/dashes; strip Vietnamese accents (`á -> a`); enforce pure ASCII.
  4. **Numbering & Metadata**: Insert sequential numbering (`01`, `001`) as prefix, suffix, or replacement; append file timestamps (`YYYY-MM-DD`); prepend parent directory names.
  5. **Extensions**: Batch change file extensions, enforce lowercase/uppercase extensions, support compound extensions (`.tar.gz`, `.min.js`, `.d.ts`), or append missing extensions.
  6. **Filtering**: Filter target files by regex, extension whitelist, or exclusion checkboxes.
- **💾 Preset System & History Rollback**:
  - Save, load, and export rule presets as JSON.
  - Full execution log with instant reverse/rollback capability.
- **💻 CLI & Automation Hub**:
  - Export your current rules as an equivalent **Python CLI** command (with optional `-n` dry-run / `-y` flags).
  - Download the standalone, self-contained `rename_files.py` script with launchers for Windows (.bat), macOS (.command) and Linux (.sh).

---

### 🚀 Quick Start (Web App)

#### Prerequisites
- Node.js 22+ (tests use native TypeScript type-stripping)
- Modern web browser (Chrome, Edge for direct on-disk renaming; Firefox, Safari for preview mode)

```bash
# 1. Clone repository
git clone https://github.com/your-username/batch-file-renamer-pro.git
cd batch-file-renamer-pro

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

The app will be accessible at `http://localhost:3000`.

> **⚠️ Renaming directly on disk requires a secure context.**
> `showDirectoryPicker` (Chrome/Edge) only works on `localhost` or over HTTPS — a LAN IP
> over plain HTTP is *not* a secure context, so the "Áp dụng" button stays disabled and the
> app falls back to preview + ZIP mode.
>
> - **On the same machine:** use `http://localhost:3000` — done.
> - **From another machine on the LAN:** generate a self-signed cert and Vite serves HTTPS automatically:
>
> ```bash
> mkdir -p certs
> openssl req -x509 -newkey rsa:2048 -nodes \
>   -keyout certs/dev.key -out certs/dev.crt -days 825 \
>   -subj "/CN=batch-file-renamer-pro" \
>   -addext "subjectAltName=IP:127.0.0.1,IP:<YOUR-LAN-IP>,DNS:localhost"
> npm run dev   # now serves https://0.0.0.0:3000
> ```
>
> Accept the browser's self-signed certificate warning once, then folder picking and
> direct renaming work normally. (`certs/` is git-ignored.)

---

<a name="tiếng-việt"></a>
## 🇻🇳 Tiếng Việt

### 🌟 Giới thiệu

**Batch File Renamer Pro** là ứng dụng đổi tên tệp hàng loạt cao cấp, hiện đại và chuẩn xác dành cho người dùng Windows, macOS và Linux. Được xây dựng trên nền tảng React 19, TypeScript và Web File System Access API tiên tiến, phần mềm hỗ trợ xem trước thời gian thực (real-time diffing), cảnh báo và ngăn chặn trùng lặp tên tệp, cùng cơ chế hoàn tác (rollback) an toàn tuyệt đối.

Ứng dụng xử lý **100% offline trên trình duyệt của bạn**: không có tệp hoặc dữ liệu nào bị tải lên máy chủ ngoài, đảm bảo an toàn và bảo mật tối đa cho tài liệu cá nhân và doanh nghiệp.

Ngoài giao diện web, phần mềm tích hợp sẵn bộ sinh lệnh tự động cho **Python CLI độc lập** (`rename_files.py`) với chế độ xem trước (`--dry-run`) và log hoàn tác để bạn sử dụng trực tiếp trên máy chủ hoặc terminal.

---

### ✨ Tính năng nổi bật

- **🚀 Đổi tên trực tiếp trong thư mục gốc**: Sử dụng File System Access API trên Chrome/Edge để đổi tên file ngay trên ổ đĩa mà không cần nén ZIP hay tải lại.
- **🛡️ Tương thích mọi trình duyệt**: Hỗ trợ kéo thả nhiều tệp trên Safari, Firefox và tải về dưới dạng tệp nén ZIP tiện lợi.
- **🔍 So sánh trực quan thời gian thực (Diff Viewer)**: Hiển thị sự khác biệt giữa tên cũ và tên mới với màu xanh (thêm vào) và đỏ (loại bỏ) chuẩn xác từng ký tự.
- **🚨 Chống ghi đè và giải quyết xung đột thông minh**:
  - Tô đỏ nổi bật các hàng có nguy cơ trùng tên sau khi áp dụng quy tắc.
  - Nhận diện xung đột không phân biệt hoa thường trên hệ điều hành Windows/macOS.
  - Cung cấp nút **1-Click Tự động sửa trùng tên** để tự động thêm chỉ số đuôi (`_1`, `_2`...) ngăn chặn việc mất dữ liệu.
- **🧩 6 Nhóm quy tắc đổi tên mạnh mẽ**:
  1. **Làm sạch (Clean)**: Cắt bỏ chuỗi đầu/cuối, loại bỏ ký tự trước/sau từ khóa, xóa các loại ngoặc `() [] {} <>`, xóa số thứ tự, xóa danh sách từ thừa.
  2. **Tìm & Thay thế (Replace)**: Thay thế văn bản thuần túy, thay thế nhiều cặp biểu thức chính quy (Regex), ánh xạ chuyển đổi ký tự (Character Map).
  3. **Kiểu chữ & Dấu phân cách (Case & Spaces)**: Chuyển đổi CHỮ HOA, chữ thường, Title Case, camelCase, snake_case, kebab-case; chuẩn hóa khoảng trắng thành gạch dưới/gạch ngang; gỡ bỏ dấu tiếng Việt chuẩn; lọc chuẩn ASCII.
  4. **Đánh số & Thông tin (Numbering)**: Đánh số thứ tự tăng dần linh hoạt (tiền tố, hậu tố, thay thế); chèn ngày tháng sửa đổi tệp (`YYYY-MM-DD`); chèn tên thư mục cha.
  5. **Đuôi mở rộng (Extension)**: Đổi phần mở rộng hàng loạt, hỗ trợ đuôi phức hợp (`.tar.gz`, `.min.js`, `.d.ts`), tự động thêm đuôi tệp bị thiếu.
  6. **Bộ lọc (Filter)**: Lọc danh sách tệp áp dụng theo Regex, đuôi tệp hoặc bỏ chọn từng dòng thủ công.
- **💾 Quản lý cấu hình & Lịch sử hoàn tác**:
  - Lưu và tải cấu hình mẫu (Preset) dạng JSON.
  - Lịch sử thao tác chi tiết cho phép xem lại và hoàn tác (Rollback) về tên gốc trong 1 cú nhấp chuột.
- **💻 Xuất Script & Công cụ CLI**:
  - Tự động sinh lệnh dòng lệnh **Python** tương đương với bộ quy tắc đang cấu hình (kèm tùy chọn `-n` xem trước, `-y` bỏ xác nhận).
  - Tải về script Python độc lập (`rename_files.py`) cùng bộ launcher nhấp-đúp cho Windows (.bat), macOS (.command), Linux (.sh).

---

### 📁 Cấu trúc thư mục / Project Structure

```text
├── .github/                      # GitHub issue & PR templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                         # Tài liệu kỹ thuật chi tiết / Detailed documentation
│   ├── ARCHITECTURE.md           # Kiến trúc hệ thống & Luồng dữ liệu (Data flow)
│   ├── RULES_SPECIFICATION.md    # Đặc tả chi tiết 6 nhóm quy tắc đổi tên
│   └── CLI_GUIDE.md              # Hướng dẫn sử dụng công cụ Python CLI độc lập
├── src/
│   ├── components/               # Giao diện người dùng React
│   │   ├── ActionFooter.tsx      # Nút bấm hành động chính (Execute, ZIP, CLI...)
│   │   ├── ActiveRulesBar.tsx    # Thanh tóm tắt nhanh các quy tắc đang bật
│   │   ├── CliCommandModal.tsx   # Modal sinh lệnh Python CLI tương đương
│   │   ├── FilePreviewTable.tsx  # Bảng xem trước, lọc, so sánh và cảnh báo trùng
│   │   ├── FileSourceStep.tsx    # Bước 1: Nạp file, chọn thư mục, kéo thả
│   │   ├── Header.tsx            # Header ứng dụng, trạng thái, modal lịch sử/preset
│   │   ├── HistoryModal.tsx      # Modal lịch sử đổi tên và hoàn tác (Rollback)
│   │   ├── PortableModal.tsx     # Modal tải script Python offline & gói portable
│   │   ├── PresetModal.tsx       # Modal quản lý cấu hình mẫu JSON
│   │   ├── RulesPanel.tsx        # Bước 2: Bảng cấu hình 6 tab quy tắc
│   │   └── StepNavigation.tsx    # Thanh điều hướng 3 bước UX
│   ├── types/
│   │   └── renamer.ts            # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/
│   │   ├── defaultPresets.ts     # Các preset mẫu sẵn có (Music, Camera, Web...)
│   │   ├── portableAssets.ts     # Bộ mã nguồn Python CLI hoàn chỉnh
│   │   ├── renamerCore.ts        # Lõi thuật toán xử lý chuỗi & kiểm tra xung đột
│   │   └── sampleFiles.ts        # Dữ liệu tệp mẫu để thử nghiệm nhanh
│   ├── App.tsx                   # Luồng ứng dụng chính & Quản lý trạng thái
│   └── main.tsx                  # Điểm khởi động ứng dụng React
├── tests/                        # Bộ test node:test (renamerCore, CLI parity, portable assets)
├── index.html                    # Entry point HTML & Meta SEO
├── package.json                  # Cấu hình dự án & scripts
├── README.md                     # Tài liệu giới thiệu chính (Bilingual)
├── README.vi.md                  # Bản tiếng Việt riêng biệt
├── CONTRIBUTING.md               # Quy định đóng góp mã nguồn
├── CHANGELOG.md                  # Nhật ký thay đổi phiên bản
└── LICENSE                       # Giấy phép mã nguồn mở MIT
```

---

<a name="documentation"></a>
## 📚 Documentation / Tài liệu chuyên sâu

- [🏗️ System Architecture & Core Engine](docs/ARCHITECTURE.md) (Kiến trúc hệ thống, luồng dữ liệu & giải thuật chống xung đột)
- [📖 Renaming Rules Specification](docs/RULES_SPECIFICATION.md) (Đặc tả chi tiết từng tùy chọn quy tắc, Regex, chuỗi ký tự)
- [🐍 Python CLI & Standalone Guide](docs/CLI_GUIDE.md) (Hướng dẫn chạy script Python offline, đầy đủ tham số dòng lệnh & cơ chế an toàn)

---

<a name="contributing"></a>
## 🤝 Contributing / Đóng góp

Contributions, issues and feature requests are welcome!  
Mọi đóng góp, báo lỗi và đề xuất tính năng mới luôn được hoan nghênh!

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.  
Phát hành theo giấy phép **MIT**. Xem tệp [LICENSE](LICENSE) để biết thêm chi tiết.
