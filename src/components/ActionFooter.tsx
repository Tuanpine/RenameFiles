import React from 'react';
import { PlanResult } from '../types/renamer';
import {
  Play,
  RotateCcw,
  FileArchive,
  FileJson,
  Loader2,
  HardDrive,
} from 'lucide-react';

interface ActionFooterProps {
  planResult: PlanResult;
  onApply: () => void;
  onDownloadZip: () => void;
  onExportLog: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isApplying: boolean;
  hasDirectoryHandle: boolean;
  hasFiles: boolean;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
  planResult,
  onApply,
  onDownloadZip,
  onExportLog,
  onUndo,
  canUndo,
  isApplying,
  hasDirectoryHandle,
  hasFiles,
}) => {
  const willChange = planResult.ops.filter(
    (op) => !op.excluded && (op.status === 'changed' || op.status === 'conflict')
  ).length;

  return (
    <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 bg-white border-t border-slate-200 shadow-xs">
      {/* Left zone: Information & File summary */}
      <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
        {hasDirectoryHandle ? (
          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold truncate">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Đổi tên trực tiếp trên ổ cứng máy tính</span>
          </div>
        ) : (
          hasFiles && (
            <span className="text-slate-500 hidden md:inline truncate">
              Chế độ an toàn · Sẵn sàng đổi tên hoặc xuất gói ZIP & Log
            </span>
          )
        )}
      </div>

      {/* Right zone: Action buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {canUndo && (
          <button
            onClick={onUndo}
            disabled={isApplying}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Khôi phục lại tên tệp trước khi đổi"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Hoàn tác</span>
          </button>
        )}

        {hasFiles && (
          <>
            <button
              onClick={onExportLog}
              className="hidden sm:flex px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors items-center gap-1.5 whitespace-nowrap"
              title="Xuất file nhật ký JSON hoàn tác tương thích Python CLI"
            >
              <FileJson className="w-3.5 h-3.5 text-slate-600" />
              <span>Log JSON</span>
            </button>

            <button
              onClick={onDownloadZip}
              disabled={isApplying || willChange === 0}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Tải gói ZIP chứa các tệp đã đổi tên"
            >
              <FileArchive className="w-3.5 h-3.5 text-slate-600" />
              <span>Tải ZIP</span>
            </button>
          </>
        )}

        <button
          onClick={onApply}
          disabled={isApplying || willChange === 0 || !hasDirectoryHandle}
          className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 text-white ${
            planResult.severeDuplicates > 0
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } disabled:opacity-50`}
          title={
            hasDirectoryHandle
              ? undefined
              : 'Cần mở thư mục bằng "Mở thư mục" để đổi tên trực tiếp trên ổ cứng'
          }
        >
          {isApplying ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang áp dụng...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Áp dụng đổi tên ({willChange})</span>
              {planResult.severeDuplicates > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1 py-0.5 rounded font-mono">
                  {planResult.severeDuplicates} trùng
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
