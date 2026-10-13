# Contributing to Batch File Renamer Pro / Hướng dẫn đóng góp mã nguồn

[🇺🇸 English](#english) • [🇻🇳 Tiếng Việt](#tiếng-việt)

---

<a name="english"></a>
## 🇺🇸 English Guidelines

Thank you for your interest in contributing to **Batch File Renamer Pro**! We appreciate all contributions, from bug reports and documentation fixes to feature proposals and code submissions.

### 📜 Code of Conduct
We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, background, or identity. Please treat everyone with respect and empathy.

### 🛠️ Getting Started
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/batch-file-renamer-pro.git
   cd batch-file-renamer-pro
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a topic branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

### 📋 Code Guidelines & Best Practices
- **TypeScript**: Always write strictly typed code. Avoid `any` types where possible. Keep shared interfaces in `src/types/`.
- **Pure Renaming Logic**: Keep core filename transformation functions inside `src/utils/renamerCore.ts` as pure, deterministic functions without side effects.
- **Client-Side Privacy**: Never introduce dependencies or endpoints that upload user files or filenames to external remote servers.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline styles or custom ad-hoc CSS files.
- **Linting & Validation**: Ensure your code passes TypeScript checks before submitting:
  ```bash
  npm run lint
  npm run build
  ```

### 🔄 Submitting a Pull Request (PR)
1. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "feat(rules): add regex replacement pairs in RulesPanel"
   ```
2. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request against the `main` branch.
4. Fill out the Pull Request template describing the motivation, changes made, and steps to test.

---

<a name="tiếng-việt"></a>
## 🇻🇳 Hướng dẫn dành cho cộng đồng Việt Nam

Cảm ơn bạn đã quan tâm và muốn đóng góp cho dự án **Batch File Renamer Pro**! Mọi sự hỗ trợ từ việc báo lỗi, dịch thuật tài liệu, đề xuất tính năng mới đến viết mã nguồn đều vô cùng quý giá.

### 🛠️ Quy trình bắt đầu
1. **Fork dự án** trên GitHub về tài khoản của bạn.
2. **Clone về máy tính**:
   ```bash
   git clone https://github.com/<tai-khoan-cua-ban>/batch-file-renamer-pro.git
   cd batch-file-renamer-pro
   ```
3. **Cài đặt các thư viện**:
   ```bash
   npm install
   ```
4. **Tạo nhánh mới cho tính năng hoặc sửa lỗi**:
   ```bash
   git checkout -b feature/ten-tinh-nang
   # hoặc
   git checkout -b fix/ten-loi-can-sua
   ```
5. **Chạy thử nghiệm giao diện**:
   ```bash
   npm run dev
   ```

### 📋 Quy chuẩn viết mã
- **TypeScript**: Viết code có định kiểu rõ ràng, hạn chế tối đa sử dụng kiểu `any`. Các định nghĩa kiểu chung đặt trong `src/types/`.
- **Tính toán thuần túy (Pure Functions)**: Các hàm xử lý chuỗi đổi tên trong `src/utils/renamerCore.ts` phải là hàm thuần túy, có thể kiểm thử độc lập mà không phụ thuộc vào trạng thái DOM.
- **Bảo mật dữ liệu**: Tuyệt đối không thêm mã nguồn gửi tệp tin hoặc tên tệp của người dùng lên máy chủ bên ngoài.
- **Giao diện**: Sử dụng Tailwind CSS đồng nhất.
- **Kiểm tra trước khi tạo PR**:
  ```bash
  npm run lint
  npm run build
  ```

### 📬 Gửi Pull Request (PR)
- Đặt tiêu đề rõ ràng (ví dụ: `fix(preview): sửa hiển thị cảnh báo trùng lặp trên Safari`).
- Điền đầy đủ mô tả theo mẫu PR Template, nêu rõ lỗi được sửa hoặc tính năng mới thêm vào.
