# 🏗️ System Architecture / Kiến trúc Hệ thống

[🇺🇸 English](#english) • [🇻🇳 Tiếng Việt](#tiếng-việt)

---

<a name="english"></a>
## 🇺🇸 System Architecture

### 1. High-Level Architecture Overview

Batch File Renamer Pro is architected as an **offline-first, client-side single-page application (SPA)** built with React 19, TypeScript, and Vite. The design ensures that all string transformations, collision detection, and file renaming operations occur entirely within the browser without transmitting user file paths or data across the network.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          User Local Browser                            │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │   File Intake Layer   │             │    Configuration State     │  │
│  │  - Directory Picker   │             │   - 6 Rule Categories      │  │
│  │  - File Input/Drop    │             │   - Regex & Char Maps      │  │
│  │  - Sample Mock Data   │             │   - Presets & Exclusions   │  │
│  └───────────┬───────────┘             └─────────────┬──────────────┘  │
│              │                                       │                 │
│              ▼                                       ▼                 │
│    ┌───────────────────────────────────────────────────────┐           │
│    │             Renamer Core Engine (Pure)                │           │
│    │  1. Filter & Whitelist Matcher                        │           │
│    │  2. Stem & Extension Separator (Compound Exts)        │           │
│    │  3. String Sanitizer & Cleaning Pipeline              │           │
│    │  4. Search, Replace & Regex Transformations           │           │
│    │  5. Case Conversion & Separator Normalization         │           │
│    │  6. Numbering & Timestamp Metadata Injector           │           │
│    │  7. Extension Transformation                          │           │
│    │  8. Windows Filesystem Safety Validator               │           │
│    │  9. Collision & Overwrite Hazard Detector             │           │
│    └──────────────────────────┬────────────────────────────┘           │
│                               │                                        │
│                               ▼                                        │
│    ┌───────────────────────────────────────────────────────┐           │
│    │                  Execution & Output                   │           │
│    │  - Real-Time Visual Diffing (Green/Rose Highlights)   │           │
│    │  - Native In-Place FileSystemFileHandle.move()        │           │
│    │  - In-Memory JSZip Archive Generator                  │           │
│    │  - Headless Python CLI Exporter                     │           │
│    │  - Session History & One-Click Rollback Storage       │           │
│    └───────────────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Core Functional Transformation Pipeline

The transformation engine in `src/utils/renamerCore.ts` operates as a deterministic, pure pipeline:

1. **Compound Extension Parsing**:
   Instead of splitting blindly on the last dot `.`, the engine checks against known compound extensions (e.g. `.tar.gz`, `.min.js`, `.d.ts`).
2. **Stem Transformation (`cleanStem`)**:
   - Strips leading/trailing prefixes/suffixes.
   - Cleans delimiters (e.g. remove text before/after specific keywords).
   - Removes bracketed tokens `(...)`, `[...]`, `{...}`, `<...>`.
   - Cleans unwanted digits or blacklisted words.
   - Applies custom regex replacement pairs in sequence.
   - Applies character translation maps (`tr`).
   - Normalizes spaces (converts to `_`, `-`, or collapses consecutive separators).
   - Removes diacritics (Vietnamese accents) and enforces ASCII compliance if enabled.
3. **Numbering & Metadata Injection**:
   Calculates 1-based sequential indices, zero-padding (`01`, `001`), modification timestamps (`YYYY-MM-DD`), and parent directory names.
4. **Windows Filesystem Sanitization**:
   Replaces illegal characters (`<>:"/\|?*`) and protects reserved Windows device names (`CON`, `PRN`, `AUX`, `NUL`, etc.).
5. **Conflict Hazard Detection Matrix**:
   Calculates duplicate destination names inside the same folder directory:
   - Compares both case-sensitive and case-insensitive equality (matching Windows and macOS filesystem semantics).
   - If duplicates occur, marks row status as `collision` with severe alert flag.
   - Resolves conflicts automatically via `onConflict: 'number'` (`filename_1.ext`, `filename_2.ext`) when triggered.

---

### 3. Execution & Rollback State Machine

When a rename operation is executed:
1. An audit record is stored in `HistoryModal` with timestamp, directory path, total items, and an array of `{ oldName, newName }`.
2. When the user requests a **Rollback**, the engine reverses the mapping (`newName -> oldName`), constructs an inverse plan, and applies the reversal directly to disk or in-memory state.

---

<a name="tiếng-việt"></a>
## 🇻🇳 Kiến trúc Hệ thống

### 1. Tổng quan Kiến trúc

Batch File Renamer Pro được thiết kế theo mô hình **ứng dụng đơn trang chạy hoàn toàn phía máy khách (Client-Side SPA)** với React 19, TypeScript và Vite. Toàn bộ logic biến đổi chuỗi, phát hiện xung đột và đổi tên tệp được xử lý trực tiếp trong môi trường sandbox của trình duyệt, không gửi bất kỳ đường dẫn hay nội dung tệp nào ra internet.

---

### 2. Luồng xử lý dữ liệu lõi (`renamerCore.ts`)

Mỗi khi người dùng điều chỉnh một quy tắc hoặc danh sách tệp thay đổi, hàm `buildPlan(items, config, isCiFs, excludedIds)` sẽ tự động thực thi tuần tự các bước:

1. **Phân tích đuôi tệp phức hợp**:
   Nhận diện các phần mở rộng nhiều phần như `.tar.gz`, `.tar.bz2`, `.min.js`, `.min.css`, `.d.ts` để tránh việc làm hỏng đuôi tệp khi đổi tên.
2. **Biến đổi phần thân tên tệp (Stem)**:
   - Cắt chuỗi đầu/cuối, loại bỏ văn bản trước/sau từ khóa.
   - Xóa các loại dấu ngoặc đơn `()`, ngoặc vuông `[]`, ngoặc nhọn `{}`.
   - Xóa chữ số và danh sách từ thừa.
   - Áp dụng tuần tự các cặp biểu thức chính quy Regex (`pattern -> replacement`).
   - Áp dụng bảng ánh xạ ký tự (`tr`).
   - Chuẩn hóa khoảng trắng thành gạch dưới `_` hoặc gạch ngang `-`, thu gọn dấu phân cách liên tiếp.
   - Bỏ dấu tiếng Việt và chuẩn hóa ASCII.
3. **Đánh số thứ tự & Siêu dữ liệu**:
   Tính toán chỉ số tăng dần, bù số 0 (`01`, `001`), chèn ngày sửa tệp (`YYYY-MM-DD`) và tên thư mục cha.
4. **Bảo vệ hệ điều hành Windows**:
   Tự động lọc các ký tự cấm (`<>:"/\|?*`) và ngăn chặn các tên hệ thống dành riêng (`CON`, `PRN`, `AUX`, `NUL`...).
5. **Kiểm tra và ngăn chặn xung đột (Collision Hazard)**:
   - Quét toàn bộ danh sách tệp trong cùng một thư mục cha.
   - Phát hiện các trường hợp trùng tên sau khi đổi (bao gồm cả trường hợp không phân biệt chữ hoa/thường).
   - Nếu phát hiện trùng, tô đỏ hàng hiển thị và cung cấp giải pháp tự động bù chỉ số `_{n}` bảo vệ dữ liệu.

---

### 3. Cơ chế Lưu vết & Hoàn tác (Rollback)

- Sau mỗi lần thực thi đổi tên, ứng dụng lưu lại phiên làm việc vào danh sách Lịch sử gồm: thời gian, tên thư mục, số lượng tệp và cặp ánh xạ `{ oldName, newName }`.
- Người dùng có thể nhấn nút **Hoàn tác (Rollback)** bất kỳ lúc nào để đưa các tệp trở lại tên ban đầu một cách an toàn.
