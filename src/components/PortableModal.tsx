import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Layers,
  Cpu,
  Monitor,
  X,
  FileCode,
  Package,
} from 'lucide-react';
import {
  PYTHON_SCRIPT_CODE,
  RUN_WINDOWS_BAT,
  RUN_MACOS_COMMAND,
  RUN_LINUX_SH,
  ELECTRON_PACKAGE_JSON,
  ELECTRON_MAIN_JS,
  ELECTRON_PRELOAD_JS,
  downloadTextFile,
} from '../utils/portableAssets';
import JSZip from 'jszip';

interface PortableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortableModal: React.FC<PortableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      // Add standalone script and launchers
      zip.file('rename_files.py', PYTHON_SCRIPT_CODE);
      zip.file('run_windows.bat', RUN_WINDOWS_BAT);
      zip.file('run_macos.command', RUN_MACOS_COMMAND);
      zip.file('run_linux.sh', RUN_LINUX_SH);

      // Add Electron template folder
      const electronFolder = zip.folder('electron-desktop');
      if (electronFolder) {
        electronFolder.file('package.json', ELECTRON_PACKAGE_JSON);
        electronFolder.file('main.js', ELECTRON_MAIN_JS);
        electronFolder.file('preload.js', ELECTRON_PRELOAD_JS);
        electronFolder.file(
          'README.txt',
          'Hướng dẫn đóng gói Electron:\n1. Mở terminal trong thư mục này\n2. Chạy: npm install\n3. Chạy dev: npm start\n4. Đóng gói portable Windows (.exe): npm run pack:win\n5. Đóng gói macOS (.dmg): npm run pack:mac\n6. Đóng gói Linux (.AppImage): npm run pack:linux\n'
        );
      }

      zip.file(
        'HUONG_DAN_SU_DUNG.txt',
        'CÔNG CỤ ĐỔI TÊN TỆP HÀNG LOẠT PORTABLE\n' +
          '====================================\n\n' +
          '1. Windows: Nhấp đúp chuột vào file run_windows.bat\n' +
          '2. macOS: Nhấp đúp chuột vào file run_macos.command\n' +
          '3. Linux: Mở terminal chạy ./run_linux.sh\n\n' +
          'Yêu cầu: Đã cài Python 3.8+ (mặc định đã có sẵn trên macOS và Linux, Windows tải từ python.org).\n' +
          'Hỗ trợ đầy đủ chế độ hỏi đáp bằng Tiếng Việt và các cờ tham số dòng lệnh CLI.\n'
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Batch_Renamer_Portable_Package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Không thể tạo file ZIP: ' + String(err));
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Gói Portable & Chạy Trên Đa Nền Tảng (Windows · Linux · macOS)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Main Download Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-indigo-950">
                Tải Trọn Bộ Portable (Chạy Ngay Không Cần Cài Đặt)
              </h3>
              <p className="text-xs text-indigo-700 mt-1 max-w-md">
                Bao gồm script Python độc lập, launcher nhấp-đúp cho Windows (.bat), macOS (.command), Linux (.sh) và mẫu đóng gói Electron.
              </p>
            </div>
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Đang nén ZIP...' : 'Tải gói Portable (.ZIP)'}</span>
            </button>
          </div>

          {/* Section 1: 3 Platforms One-Click Scripts */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Tải lẻ từng tệp chạy theo hệ điều hành</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Python Core */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-2">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>rename_files.py</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Mã nguồn CLI & Wizard thuần Python 3.8+
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadTextFile('rename_files.py', PYTHON_SCRIPT_CODE)
                  }
                  className="w-full py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-center"
                >
                  Tải file .py
                </button>
              </div>

              {/* Windows Launcher */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-2">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <span>Windows (.bat)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Nhấp đúp chuột để chạy trên Windows
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadTextFile('run_windows.bat', RUN_WINDOWS_BAT)
                  }
                  className="w-full py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-center"
                >
                  Tải .bat
                </button>
              </div>

              {/* macOS Launcher */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-2">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>macOS (.command)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Nhấp đúp chuột để mở Terminal macOS
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadTextFile('run_macos.command', RUN_MACOS_COMMAND)
                  }
                  className="w-full py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-center"
                >
                  Tải .command
                </button>
              </div>

              {/* Linux Launcher */}
              <div className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-2">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Linux (.sh)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Script Shell cho Ubuntu, Debian, v.v.
                  </div>
                </div>
                <button
                  onClick={() =>
                    downloadTextFile('run_linux.sh', RUN_LINUX_SH)
                  }
                  className="w-full py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors text-center"
                >
                  Tải .sh
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Electron Desktop Packaging Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Đóng gói ứng dụng Desktop với Electron (EXE / DMG / AppImage)</span>
            </h4>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-mono text-[11px]">
              <div className="text-slate-600 font-sans">
                Các bước đóng gói file .exe chạy trực tiếp không cần cài đặt:
              </div>
              <pre className="p-2.5 bg-slate-900 text-slate-100 rounded overflow-x-auto text-[11px]">
{`# 1. Tải gói ZIP ở trên và giải nén thư mục electron-desktop
cd electron-desktop

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Đóng gói thành ứng dụng Portable cho hệ điều hành mong muốn:
npm run pack:win    # Xuất file .exe portable cho Windows
npm run pack:mac    # Xuất file .dmg cho macOS
npm run pack:linux  # Xuất file .AppImage cho Linux`}
              </pre>
            </div>
          </div>

          {/* Section 3: Flutter Cross-Platform Notes */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Khả năng tương thích với Flutter Desktop</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Ứng dụng này được thiết kế theo kiến trúc phi tập trung: quy tắc làm sạch Unicode NFC, xử lý ký tự cấm Windows, và thuật toán tránh trùng tên có thể được gọi trực tiếp qua engine Dart chuẩn bằng thư viện <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">dart:io</code> (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">File(oldPath).renameSync(newPath)</code>) hoặc thông qua thư viện <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Process.run('python', ['rename_files.py', ...])</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
