# 🐍 Python CLI Guide / Hướng dẫn Sử dụng Python CLI

[🇺🇸 English](#english) • [🇻🇳 Tiếng Việt](#tiếng-việt)

---

<a name="english"></a>
## 🇺🇸 Standalone Python Script (`rename_files.py`)

Batch File Renamer Pro ships a self-contained, offline Python script: `rename_files.py`.
Export it from the web UI via the **Portable** button in the header (single file or the
full portable ZIP with Windows/macOS/Linux launchers).

It requires **Python 3.8+** with standard library modules only (no `pip install`).

### Behavior

- Always **previews first**: prints `old -> new` for every planned rename before touching disk.
- Without `-y`, asks `[Y/n]` for confirmation before applying.
- **Never overwrites**: if a destination name already exists on disk, that file is skipped (`[BỎ QUA]`).
- Writes a rollback log `rename_log_YYYYMMDD_HHMMSS.json` next to the renames; restore with `--undo <logfile>`.

### Usage

```bash
python rename_files.py [TARGET_DIR] [OPTIONS]
```

`TARGET_DIR` defaults to the current directory (`.`).

### Options Reference

| Flag | Argument | Description |
| :--- | :--- | :--- |
| `-r`, `--recursive` | Flag | Scan subdirectories recursively |
| `--max-depth` | `INT` | Maximum recursion depth |
| `-t`, `--target` | `files\|dirs\|both` | What to rename (default: `files`) |
| `--hidden` | Flag | Include hidden files |
| `-e`, `--only-ext` | `jpg,png` | Only rename files with these extensions |
| `--match-regex` | `REGEX` | Only rename files whose name matches |
| `--unicode` | `none\|nfc\|nfd` | Unicode normalization (default: `nfc`) |
| `--fullwidth` | Flag | Convert full-width characters to ASCII |
| `--colon-to-dash` | Flag | Replace `:` / `：` with ` - ` |
| `--strip-numbering` | Flag | Strip leading numbering (`01. `, `(1)`) |
| `-b`, `--remove-brackets` | `round,square,curly,angle` | Remove bracket groups (comma-separated kinds) |
| `--keep-bracket-content` | Flag | Keep text inside removed brackets |
| `--bracket-match` | `REGEX` | Only remove brackets whose content matches |
| `-w`, `--remove-text` | `TEXT` (repeatable) | Remove literal text |
| `--remove-regex` | `REGEX` (repeatable) | Remove regex matches |
| `--remove-before` | `TEXT` | Remove everything before first occurrence |
| `--remove-after` | `TEXT` | Remove everything after first occurrence |
| `--sub` | `old=>new` (repeatable) | Literal search & replace |
| `--regex-replace` | `PATTERN REPL` (repeatable) | Regex search & replace |
| `-i`, `--ignore-case` | Flag | Case-insensitive matching |
| `-A`, `--accent-insensitive` | Flag | Ignore Vietnamese diacritics when matching |
| `--whole-word` | Flag | Match whole words only |
| `--remove-digits` | Flag | Remove all digits |
| `--cut-start` / `--cut-end` | `INT` | Cut N characters from start / end |
| `--chars-to-space` | `CHARS` | Convert listed characters to spaces |
| `-a`, `--remove-accents` | Flag | Strip Vietnamese diacritics (`á` -> `a`) |
| `--ascii` | Flag | Keep ASCII characters only |
| `-s`, `--remove-special` | Flag | Remove special characters |
| `--special-keep` | `CHARS` | Special characters to keep |
| `--special-replace` | `CHAR` | Replacement for special characters |
| `--spaces` | `keep\|underscore\|dash\|dot\|remove` | Space handling (default: `keep`) |
| `--case` | `keep\|lower\|upper\|title\|sentence\|snake\|kebab\|camel\|pascal` | Case conversion |
| `--collapse-separators` | Flag | Collapse repeated separators (`__`, `--`) |
| `--prefix` / `--suffix` | `TEXT` | Add prefix / suffix to filename stem |
| `--sep` | `CHAR` | Separator (default: `_`) |
| `--parent` | `none\|prefix\|suffix` | Include parent folder name |
| `--date` | `none\|today\|mtime\|ctime` | Add date to filename |
| `--date-format` | `STRFTIME` (default `%Y%m%d`) | Date format |
| `--date-pos` | `prefix\|suffix` | Date position |
| `--number` | Flag | Enable sequential numbering |
| `--number-start` / `--number-step` | `INT` | Start value / step |
| `--number-width` | `INT` | Zero-padding width (`3` -> `001`) |
| `--number-pos` | `prefix\|suffix\|replace` | Number position |
| `--number-base` | `TEXT` | Base text for `replace` mode (e.g. `Photo`) |
| `--sort` | `natural\|name\|mtime\|ctime\|size` | Sort order for numbering |
| `--reverse` | Flag | Reverse sort order |
| `--ext` | `keep\|lower\|upper` | Extension case |
| `--set-ext` | `EXT` | Force extension |
| `--ext-map` | `jpeg=>jpg` (repeatable) | Map extensions |
| `--max-length` | `INT` | Truncate stem to N characters |
| `--windows-safe` | Flag | Sanitize Windows-illegal characters and reserved names |
| `--illegal-replace` | `CHAR` | Replacement for illegal characters (default: `-`) |
| `-n`, `--dry-run` | Flag | Preview only, change nothing |
| `-y`, `--yes` | Flag | Skip the confirmation prompt |
| `--undo` | `LOGFILE` | Restore names from a rollback log |

### Examples

```bash
# Dry-run: lowercase + underscores, change nothing on disk
python rename_files.py ./photos --case lower --spaces underscore -n

# Number documents with 3-digit padding and a "Doc_" base
python rename_files.py ./documents --number --number-width 3 --number-base "Doc_" --number-pos replace

# Strip Vietnamese accents, normalize spaces to underscores
python rename_files.py ./music -a --spaces underscore

# Remove subtitle-group tags [FansubVN] and resolution 1080p
python rename_files.py ./anime -b square -w "1080p" -w "720p"

# Apply for real, skipping the confirmation prompt
python rename_files.py ./anime -b square -w "1080p" -y

# Roll back a batch using its log
python rename_files.py ./anime --undo rename_log_20261013_131142.json
```

### Note on duplicates

The CLI has no `--on-conflict` flag. When two files would end up with the same name,
the script **skips the conflicting file** instead of overwriting — data loss is impossible
by default. Use `--number` to make destinations unique.

---

<a name="tiếng-việt"></a>
## 🇻🇳 Hướng dẫn Python CLI Tiếng Việt

Tệp script `rename_files.py` là giải pháp chạy độc lập offline hoàn chỉnh khi bạn cần đổi tên
hàng nghìn tệp trên máy chủ Linux, VPS hoặc máy tính cá nhân mà không cần mở trình duyệt.

Script dùng **100% thư viện chuẩn Python 3.8+**, không cần `pip install` gì cả.

### Cơ chế an toàn

- **Luôn xem trước trước**: in danh sách `tên cũ -> tên mới` trước khi chạm vào ổ đĩa.
- Không có `-y` thì hỏi xác nhận `[Y/n]` trước khi đổi thật.
- **Không bao giờ ghi đè**: tệp đích đã tồn tại sẽ bị bỏ qua (`[BỎ QUA]`), không mất dữ liệu.
- Ghi log hoàn tác `rename_log_YYYYMMDD_HHMMSS.json`, khôi phục bằng `--undo <file log>`.

### Cú pháp

```bash
python rename_files.py [THƯ_MỤC] [TÙY CHỌN]
```

`THƯ_MỤC` mặc định là thư mục hiện tại (`.`).

### Ví dụ nhanh

```bash
# Xem trước: chữ thường + gạch dưới, không đổi gì
python rename_files.py C:\Users\Admin\Downloads --case lower --spaces underscore -n

# Bỏ dấu tiếng Việt, chuẩn hóa khoảng trắng
python rename_files.py /data/tai_lieu -a --spaces underscore

# Đánh số 3 chữ số (001, 002...) thay thế toàn bộ tên
python rename_files.py ./anh_chup --number --number-width 3 --number-pos replace

# Áp dụng thật, bỏ qua xác nhận
python rename_files.py ./anh_chup --number --number-width 3 -y

# Hoàn tác đợt đổi tên từ file log
python rename_files.py ./anh_chup --undo rename_log_20261013_131142.json
```

Bảng đầy đủ các tùy chọn xem ở [mục English ở trên](#options-reference).
