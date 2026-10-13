import React, { useState, useRef } from 'react';
import { HistoryEntry } from '../types/renamer';
import {
  RotateCcw,
  FileJson,
  Upload,
  Clock,
  Search,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { downloadTextFile } from '../utils/portableAssets';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onRevertBatch: (entry: HistoryEntry) => void;
  onImportLogFile: (logData: any) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRevertBatch,
  onImportLogFile,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter history entries by search query
  const filteredHistory = history.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchDate = new Date(entry.timestamp).toLocaleString('vi-VN').toLowerCase().includes(q);
    const matchFiles = entry.log.some(
      (item) =>
        item.old.toLowerCase().includes(q) ||
        item.new.toLowerCase().includes(q) ||
        item.dir.toLowerCase().includes(q)
    );
    return matchDate || matchFiles;
  });

  const totalFilesRenamed = history.reduce((sum, h) => sum + h.successCount, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportLogFile(json);
      } catch (err) {
        alert('File JSON không hợp lệ hoặc bị lỗi cú pháp.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportBatch = (entry: HistoryEntry) => {
    const exportData = {
      version: '1.0.0',
      created: entry.timestamp,
      entries: entry.log.map((item) => ({
        dir: item.dir,
        old: item.old,
        new: item.new,
      })),
    };
    downloadTextFile(
      `rename_log_${entry.timestamp.replace(/[:.]/g, '-')}.json`,
      JSON.stringify(exportData, null, 2)
    );
  };

  const handleExportAllHistory = () => {
    downloadTextFile(
      `batch_renamer_full_history_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(history, null, 2)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Lịch sử đổi tên & Hoàn tác (Revert / Rollback)
              </h2>
              <div className="text-[11px] text-slate-500 font-mono">
                {history.length} đợt đã lưu · {totalFilesRenamed} tệp đã xử lý
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Nhập file log JSON từ Python CLI để hoàn tác"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Nhập Log JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />

            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportAllHistory}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Xuất toàn bộ lịch sử ra file JSON sao lưu"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Sao lưu tất cả</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đổi tên?')) {
                      onClearHistory();
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Xóa toàn bộ lịch sử"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tệp cũ, tên mới, thư mục hoặc thời gian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40">
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">
                {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử đổi tên nào'}
              </p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Thử thay đổi từ khóa tìm kiếm của bạn.'
                  : 'Mỗi khi bạn thực hiện đổi tên, thông tin sẽ được lưu tại đây để có thể hoàn tác an toàn bất kỳ lúc nào.'}
              </p>
            </div>
          ) : (
            filteredHistory.map((entry) => {
              const isExpanded = expandedBatchId === entry.id;
              const hasErrors = entry.failCount > 0;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
                >
                  {/* Batch Summary Header */}
                  <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {entry.successCount}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-2">
                          <span>{new Date(entry.timestamp).toLocaleString('vi-VN')}</span>
                          {hasErrors && (
                            <span className="text-[10px] font-sans font-medium text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {entry.failCount} lỗi
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Đã đổi {entry.successCount} / {entry.totalFiles} tệp tin
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportBatch(entry)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                        title="Xuất file Log JSON tương thích Python CLI"
                      >
                        <FileJson className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Xuất Log</span>
                      </button>

                      <button
                        onClick={() => onRevertBatch(entry)}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                        title="Hoàn tác đưa các tệp về lại tên ban đầu"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Hoàn tác đợt này</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedBatchId((prev) => (prev === entry.id ? null : entry.id))
                        }
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết các tệp'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Batch Details (Collapsible) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Chi tiết các tệp đã đổi trong đợt này:
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-mono">
                        {entry.log.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 py-1 border-b border-slate-50 last:border-0"
                          >
                            <div className="truncate flex-1">
                              <span className="text-rose-700 line-through mr-1.5" title={item.old}>
                                {item.old}
                              </span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-emerald-700 font-semibold ml-1.5" title={item.new}>
                                {item.new}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1 shrink-0">
                              <Folder className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{item.dir || '.'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
