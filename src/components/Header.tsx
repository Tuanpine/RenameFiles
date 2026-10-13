import React from 'react';
import {
  Sparkles,
  RotateCcw,
  History,
  Download,
  FolderOpen,
  Terminal,
} from 'lucide-react';

interface HeaderProps {
  onLoadSamples: () => void;
  onOpenDirectory: () => void;
  onOpenHistory: () => void;
  onOpenPortable: () => void;
  onOpenCli: () => void;
  canUndo: boolean;
  onUndoLatest: () => void;
  activeView: 'renamer' | 'history' | 'portable';
  setActiveView: (view: 'renamer' | 'history' | 'portable') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSamples,
  onOpenDirectory,
  onOpenHistory,
  onOpenPortable,
  onOpenCli,
  canUndo,
  onUndoLatest,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Brand title & Platform badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            FR
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Batch File Renamer Pro
            </h1>
            <div className="text-xs text-slate-500 font-normal">
              Đổi tên tệp đa nền tảng · Windows, macOS, Linux
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation views */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveView('renamer')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'renamer'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bảng đổi tên (Workspace)
        </button>
        <button
          onClick={() => {
            setActiveView('history');
            onOpenHistory();
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeView === 'history'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch sử & Hoàn tác</span>
        </button>
        <button
          onClick={() => {
            setActiveView('portable');
            onOpenPortable();
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeView === 'portable'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Chạy Portable / Desktop</span>
        </button>
      </nav>

      {/* Zone 3: Quick tools & Primary actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onLoadSamples}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Nạp 11 tệp mẫu thực tế để thử nghiệm tính năng"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Tệp mẫu thử</span>
        </button>

        <button
          onClick={onOpenDirectory}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Chọn thư mục trên máy tính của bạn"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Chọn thư mục</span>
        </button>

        <button
          onClick={onOpenCli}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Xem lệnh Terminal CLI tương đương"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {canUndo && (
          <button
            onClick={onUndoLatest}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Hoàn tác lần đổi tên gần nhất"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Hoàn tác (Undo)</span>
          </button>
        )}
      </div>
    </header>
  );
};
