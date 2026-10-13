import React, { useRef } from 'react';
import { FileItem } from '../types/renamer';
import {
  FolderOpen,
  Upload,
  Sparkles,
  Trash2,
  HardDrive,
  FileText,
  Folder,
  FileImage,
  FileVideo,
  FileArchive,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

interface FileSourceStepProps {
  items: FileItem[];
  dirName: string;
  hasDirectoryHandle: boolean;
  onOpenDirectory: () => void;
  onAddFiles: (files: FileList | null) => void;
  onLoadSamples: () => void;
  onClearFiles: () => void;
  onRemoveItem: (id: string) => void;
  onProceedToRules: () => void;
}

export const FileSourceStep: React.FC<FileSourceStepProps> = ({
  items,
  dirName,
  hasDirectoryHandle,
  onOpenDirectory,
  onAddFiles,
  onLoadSamples,
  onClearFiles,
  onRemoveItem,
  onProceedToRules,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fsAccessSupported =
    typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Statistics
  const totalSize = items.reduce((acc, it) => acc + (it.size || 0), 0);
  const fileCount = items.filter((it) => !it.isDir).length;
  const dirCount = items.filter((it) => it.isDir).length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (name: string, isDir: boolean) => {
    if (isDir) return <Folder className="w-4 h-4 text-amber-500 shrink-0" />;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'cr2'].includes(ext)) {
      return <FileImage className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <FileVideo className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* 1. Header Banner & Ingestion Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bước 1: Nạp danh sách tệp & Thư mục cần đổi tên
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cách chính: chọn thư mục trên máy để quét và đổi tên trực tiếp trên ổ đĩa.
              Cần truy cập qua https:// hoặc localhost. Chế độ thêm tệp/tệp mẫu chỉ để xem trước &amp; xuất ZIP.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={onProceedToRules}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <span>Tiếp tục: Cài đặt quy tắc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!fsAccessSupported && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 leading-relaxed">
              <span className="font-semibold">Không thể đổi tên trực tiếp trên ổ cứng.</span>{' '}
              Trình duyệt chỉ cho phép File System Access API ở kết nối bảo mật (HTTPS hoặc
              localhost). Truy cập trang qua <code className="bg-amber-100 px-1 rounded">https://</code>{' '}
              hoặc <code className="bg-amber-100 px-1 rounded">http://localhost</code> để mở thư mục
              và đổi tên thật. Ở chế độ hiện tại, dùng &quot;Tải ZIP&quot; để xuất bộ tệp đã đổi tên.
            </div>
          </div>
        )}

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option A: Select Directory (LUỒNG CHÍNH) */}
          <button
            onClick={onOpenDirectory}
            className="p-4 rounded-xl border-2 border-indigo-300 bg-indigo-50/40 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-all flex flex-col justify-between group ring-1 ring-indigo-100"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                  CÁCH CHÍNH
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Chọn thư mục trên máy
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Quét thư mục và đổi tên trực tiếp ngay trên ổ đĩa qua File System Access API.
                Cần truy cập qua https:// hoặc localhost.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 mt-3 flex items-center gap-1">
              <span>Mở thư mục</span> &rarr;
            </span>
          </button>

          {/* Option B: Add Files (CHẾ ĐỘ PHỤ — chỉ xem trước/xuất ZIP) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-left transition-all flex flex-col justify-between group"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Xem trước &amp; Xuất ZIP
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thêm tệp riêng lẻ để xem trước kết quả đổi tên và tải gói ZIP về máy.
                <span className="text-amber-700 font-semibold"> Không đổi tên file trên ổ đĩa.</span>
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-3 flex items-center gap-1">
              <span>Tải tệp lên</span> &rarr;
            </span>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
            />
          </button>

          {/* Option C: Sample Files */}
          <button
            onClick={onLoadSamples}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 text-left transition-all flex flex-col justify-between group"
          >
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Nạp 11 tệp mẫu thực tế
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thử nghiệm ngay với tên phim, ảnh số, văn bản tiếng Việt, file trùng tên...
              </p>
            </div>
            <span className="text-[11px] font-semibold text-amber-700 mt-3 flex items-center gap-1">
              <span>Dùng tệp mẫu</span> &rarr;
            </span>
          </button>
        </div>
      </div>

      {/* 2. Current Folder & Inventory Breakdown */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {/* Status summary strip */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {hasDirectoryHandle ? (
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  <span>Thư mục: "{dirName}"</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Tệp trong phiên làm việc</span>
                </div>
              )}
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-mono tabular-nums">
                {fileCount} tệp tin {dirCount > 0 && `+ ${dirCount} thư mục`}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono tabular-nums">
                {formatSize(totalSize)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClearFiles}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa danh sách</span>
              </button>
            </div>
          </div>

          {/* Files List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="py-2.5 px-3.5">Tên tệp</th>
                    <th className="py-2.5 px-3">Thư mục cha</th>
                    <th className="py-2.5 px-3 text-right">Dung lượng</th>
                    <th className="py-2.5 pr-3.5 pl-2 text-right w-10">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3.5 flex items-center gap-2 truncate">
                        {getFileIcon(it.name, it.isDir)}
                        <span className="truncate text-slate-800" title={it.name}>
                          {it.name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 truncate text-[11px] font-sans">
                        {it.parentDir || '.'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-right tabular-nums text-[11px]">
                        {it.isDir ? 'Thư mục' : formatSize(it.size)}
                      </td>
                      <td className="py-2 pr-3.5 pl-2 text-right">
                        <button
                          onClick={() => onRemoveItem(it.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Loại bỏ tệp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 text-slate-500 bg-white">
          <FolderOpen className="w-10 h-10 text-indigo-300 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">Bắt đầu: chọn thư mục cần đổi tên</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Chọn thư mục trên máy → công cụ quét toàn bộ tệp/thư mục con → áp dụng đổi tên
            <span className="font-semibold text-slate-700"> ngay lập tức trên ổ đĩa</span>, có hoàn tác.
          </p>
          <button
            onClick={onOpenDirectory}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Chọn thư mục trên máy</span>
          </button>
          <p className="text-[11px] text-slate-400">
            Hoặc dùng &quot;Thêm tệp&quot; / &quot;Tệp mẫu&quot; ở trên để xem trước &amp; xuất ZIP
            (chế độ này không đổi tên file trên ổ đĩa).
          </p>
        </div>
      )}
    </div>
  );
};
