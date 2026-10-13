# 📖 Renaming Rules Specification / Đặc tả Quy tắc Đổi tên

[🇺🇸 English](#english) • [🇻🇳 Tiếng Việt](#tiếng-việt)

---

<a name="english"></a>
## 🇺🇸 English Specification

This document provides a technical specification for all renaming rules supported by Batch File Renamer Pro.

### 1. Cleaning & Stripping Rules (`clean`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `stripPrefix` | `string` | Removes the specified text from the beginning of the filename stem. |
| `stripSuffix` | `string` | Removes the specified text from the end of the filename stem. |
| `removeBefore` | `string` | Removes all characters up to and including the specified marker. |
| `removeAfter` | `string` | Removes all characters from the specified marker to the end of the stem. |
| `removeParentheses` | `boolean` | Removes round brackets `(...)` and their contents. |
| `removeSquareBrackets` | `boolean` | Removes square brackets `[...]` and their contents. |
| `removeCurlyBrackets` | `boolean` | Removes curly braces `{...}` and their contents. |
| `removeAngleBrackets` | `boolean` | Removes angle brackets `<...>` and their contents. |
| `removeNumbers` | `boolean` | Strips all numeric digits `0-9` from the stem. |
| `wordsToRemove` | `string[]` | Case-insensitive blacklist of substrings/words to strip out. |

---

### 2. Search, Replace & Regex Rules (`replace`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `replaceFrom` | `string` | Literal substring to search for. |
| `replaceTo` | `string` | Replacement text for the literal search substring. |
| `regexPattern` | `string` | Single regular expression pattern to match. |
| `regexReplace` | `string` | Replacement string for `regexPattern` (supports `$1`, `$2` capture groups). |
| `regexReplacePairs` | `Array<{pattern, repl}>` | Ordered list of multiple regular expression patterns applied sequentially. |
| `charMaps` | `Array<{from, to}>` | Unix `tr`-style character translations (e.g., `abc` -> `xyz`). |

---

### 3. Case Conversion & Separators (`case`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `caseMode` | `enum` | `'none'` (keep intact), `'lower'`, `'upper'`, `'title'` (Capitalize Each Word), `'sentence'` (First word capitalized), `'camel'`, `'snake'` (`foo_bar`), `'kebab'` (`foo-bar`). |
| `spaces` | `enum` | `'keep'` (no changes), `'underscore'` (`hello world` -> `hello_world`), `'hyphen'` (`hello world` -> `hello-world`), `'remove'` (`helloworld`). |
| `removeAccents` | `boolean` | Normalizes Unicode and removes Vietnamese diacritics (`á, ơ, ư` -> `a, o, u`). |
| `asciiOnly` | `boolean` | Replaces all non-ASCII characters with standard ASCII equivalents or dashes. |
| `collapseSeparators` | `boolean` | Replaces consecutive occurrences of spaces, underscores, and dashes (`__`, `--`) with a single delimiter. |

---

### 4. Numbering & Metadata (`number`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `numberingMode` | `enum` | `'none'`, `'prefix'` (e.g. `01_Document.pdf`), `'suffix'` (e.g. `Document_01.pdf`), `'replace'` (replaces entire stem with `01`, `02`). |
| `numberingStart` | `number` | Starting integer index (default: `1`). |
| `numberingStep` | `number` | Incremental step between files (default: `1`). |
| `numberingPad` | `number` | Zero-padding width (`1` -> `1`, `2` -> `01`, `3` -> `001`). |
| `numberingSep` | `string` | Separator between number and stem (e.g. `_`, `-`, ` `). |
| `addDate` | `enum` | `'none'`, `'prefix'`, `'suffix'`. Appends file last modified date (`YYYY-MM-DD`). |
| `addParentDir` | `enum` | `'none'`, `'prefix'`, `'suffix'`. Appends enclosing directory name. |

---

### 5. Extension Management (`ext`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `extMode` | `enum` | `'keep'`, `'lower'`, `'upper'`, `'change'` (substitute with custom extension). |
| `newExtension` | `string` | Target extension when `extMode === 'change'`. |
| `compoundExtensions` | `boolean` | Recognizes multi-dot extensions (`.tar.gz`, `.min.js`, `.d.ts`). |
| `addIfMissing` | `string` | Appends extension if file has no existing extension. |

---

### 6. Conflict Resolution & Safety (`safety`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `onConflict` | `enum` | `'fail'` (raise error), `'skip'` (keep original name), `'number'` (append `_1`, `_2`), `'overwrite'` (force). |
| `windowsSafe` | `boolean` | Strips Windows illegal characters (`<>:"/\|?*`) and trims trailing spaces/dots. |

---

<a name="tiếng-việt"></a>
## 🇻🇳 Đặc tả Quy tắc Tiếng Việt

Tài liệu này cung cấp chi tiết kỹ thuật cho từng thông số trong 6 nhóm quy tắc đổi tên.

### 1. Nhóm Làm sạch chuỗi (Clean)
- **Xóa tiền tố / hậu tố**: Cắt bỏ chuỗi ký tự ở đầu hoặc cuối phần tên tệp.
- **Xóa trước / sau từ khóa**: Tự động xóa mọi ký tự đứng trước hoặc sau một từ khóa nhận diện.
- **Xóa dấu ngoặc**: Hỗ trợ 4 loại ngoặc: tròn `(...)`, vuông `[...]`, nhọn `{...}`, và góc `<...>`. Toàn bộ nội dung bên trong dấu ngoặc cũng sẽ được loại bỏ.
- **Xóa số & từ thừa**: Loại bỏ chữ số `0-9` hoặc xóa danh sách các từ spam/quảng cáo thường gặp.

### 2. Nhóm Tìm kiếm & Thay thế (Replace)
- **Thay thế chuỗi thông thường**: Tìm và thay thế một cụm từ cụ thể.
- **Biểu thức chính quy (Regex)**: Hỗ trợ cú pháp regex chuẩn JavaScript, bao gồm nhóm bắt `$1`, `$2`.
- **Cặp Regex tuần tự**: Cho phép tạo danh sách nhiều quy tắc regex áp dụng nối tiếp nhau.
- **Bảng dịch ký tự (`tr`)**: Chuyển đổi từng ký tự theo cặp tương ứng.

### 3. Nhóm Kiểu chữ & Khoảng trắng (Case & Spaces)
- **Chuyển kiểu chữ**: Hỗ trợ 7 kiểu định dạng: CHỮ HOA, chữ thường, Viết Hoa Chữ Cái Đầu, Chữ Đầu Câu, camelCase, snake_case (`ten_tep`), kebab-case (`ten-tep`).
- **Xử lý khoảng trắng**: Giữ nguyên, chuyển thành gạch dưới `_`, gạch ngang `-`, hoặc xóa bỏ hoàn toàn.
- **Bỏ dấu tiếng Việt**: Chuyển đổi các ký tự có dấu (`á, ơ, ư`) thành ký tự không dấu chuẩn (`a, o, u`).
- **Chuẩn ASCII**: Loại bỏ các ký tự đặc biệt ngoài bảng mã ASCII.

### 4. Nhóm Đánh số & Siêu dữ liệu (Numbering)
- **Vị trí đánh số**: Đặt ở đầu (tiền tố), đặt ở cuối (hậu tố) hoặc thay thế hoàn toàn tên tệp.
- **Bù số 0**: Tùy chọn độ dài (ví dụ: `1`, `01`, `001`).
- **Chèn ngày tháng**: Tự động lấy ngày cập nhật của tệp định dạng `YYYY-MM-DD`.
- **Chèn tên thư mục cha**: Giúp phân loại tệp tin theo nguồn gốc xuất xứ.

### 5. Nhóm Đuôi mở rộng (Extension)
- Giữ nguyên, đổi thành chữ thường, chữ hoa hoặc thay đổi hàng loạt sang định dạng mới.
- Nhận diện đuôi phức hợp đa tầng như `.tar.gz`, `.min.js`.

### 6. Xử lý trùng lặp & An toàn hệ điều hành
- **Tự động đánh số trùng**: Khi hai tệp có nguy cơ trùng tên, hệ thống tự bù hậu tố `_1`, `_2` để chống mất dữ liệu.
- **An toàn Windows**: Tự động loại trừ các ký tự cấm `\ / : * ? " < > |` và xóa dấu chấm ở cuối tên tệp.
