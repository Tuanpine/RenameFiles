import React, { useState } from 'react';
import {
  FileItem,
  RenameOp,
  PlanResult,
  DiffSegment,
} from '../types/renamer';
import {
  FileText,
  Folder,
  ArrowRight,
  Search,
  Upload,
  FolderPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  X,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface FilePreviewTableProps {
  items: FileItem[];
  planResult: PlanResult;
  onToggleExclude: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onAddFiles: (files: FileList | null) => void;
  onOpenDirectory: () => void;
  onClearFiles: () => void;
  onLoadSamples: () => void;
  onAutoResolveDuplicates?: () => void;
}

type FilterStatus = 'all' | 'changed' | 'unchanged' | 'duplicate' | 'problem';

export const FilePreviewTable: React.FC<FilePreviewTableProps> = ({
  items,
  planResult,
  onToggleExclude,
  onToggleAll,
  onAddFiles,
  onOpenDirectory,
  onClearFiles,
  onLoadSamples,
  onAutoResolveDuplicates,
}) => {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOp, setSelectedOp] = useState<RenameOp | null>(null);

  const duplicateOpsCount = planResult.ops.filter(
    (op) => op.isSevereDuplicate || op.hasCollision
  ).length;

  const filteredOps = planResult.ops.filter((op) => {
    // 1. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOld = op.item.name.toLowerCase().includes(q);
      const matchNew = op.newName.toLowerCase().includes(q);
      const matchPath = op.item.path.toLowerCase().includes(q);
      const matchPeers = op.collisionPeers?.some((p) => p.toLowerCase().includes(q));
      const statusText =
        op.status === 'changed'
          ? 'sẽ đổi thay đổi changed'
          : op.status === 'unchanged'
          ? 'không đổi giữ nguyên unchanged'
          : 'trùng xung đột conflict skip bỏ qua duplicate';
      const matchStatus = statusText.includes(q);
      if (!matchOld && !matchNew && !matchPath && !matchPeers && !matchStatus) return false;
    }

    // 2. Status filter
    if (filter === 'changed') return op.status === 'changed';
    if (filter === 'unchanged') return op.status === 'unchanged';
    if (filter === 'duplicate') return Boolean(op.isSevereDuplicate || op.hasCollision);
    if (filter === 'problem') return op.status === 'conflict' || op.status === 'skip';

    return true;
  });

  const allSelected =
    planResult.ops.length > 0 &&
    planResult.ops.every((op) => !op.excluded);

  const someSelected =
    planResult.ops.some((op) => !op.excluded) && !allSelected;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 1. Severe Duplicate Alert Banner (if two or more files result in the same name) */}
      {planResult.severeDuplicates > 0 && (
        <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Cảnh báo ghi đè:</span> Có{' '}
              <strong className="font-bold underline">{planResult.severeDuplicates} tệp</strong> có cùng tên mới sau khi áp dụng quy tắc.
              Các dòng này được đánh dấu màu đỏ dưới đây để ngăn ngừa mất dữ liệu.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onAutoResolveDuplicates && (
              <button
                onClick={onAutoResolveDuplicates}
                className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 font-semibold rounded text-[11px] whitespace-nowrap transition-colors flex items-center gap-1 shadow-2xs"
                title="Tự động thêm hậu tố _1, _2... để phân biệt các tệp trùng tên"
              >
                <span>Tự sửa bằng số (_1, _2...)</span>
              </button>
            )}
            <button
              onClick={() => setFilter('duplicate')}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[11px] whitespace-nowrap transition-colors"
            >
              Lọc các tệp trùng
            </button>
          </div>
        </div>
      )}

      {/* 2. Header Metrics & Controls Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Tabular summary counters */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-mono tabular-nums">
          <div>
            <span className="text-slate-400">Tổng cộng:</span>{' '}
            <strong className="text-slate-900 font-semibold">{planResult.totalScanned}</strong>
          </div>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <div>
            <span className="text-slate-400">Sẽ đổi:</span>{' '}
            <strong className="text-emerald-700 font-semibold">{planResult.willChange}</strong>
          </div>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <div>
            <span className="text-slate-400">Không đổi:</span>{' '}
            <strong className="text-slate-700 font-semibold">{planResult.unchanged}</strong>
          </div>
          {duplicateOpsCount > 0 && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <div className="text-rose-700">
                <span>Trùng tên mới:</span>{' '}
                <strong className="font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                  {duplicateOpsCount}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* Action buttons: Import, Folder, Clear */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Thêm tệp</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onAddFiles(e.target.files)}
            />
          </label>

          <button
            onClick={onOpenDirectory}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
            title="Mở thư mục trên máy (Chrome/Edge/Opera)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Chọn thư mục</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={onClearFiles}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Xóa danh sách tệp"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter tabs & Search row */}
      <div className="px-3.5 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({planResult.totalScanned})
          </button>
          <button
            onClick={() => setFilter('changed')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === 'changed'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sẽ đổi ({planResult.willChange})
          </button>
          <button
            onClick={() => setFilter('unchanged')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === 'unchanged'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Không đổi ({planResult.unchanged})
          </button>

          {duplicateOpsCount > 0 && (
            <button
              onClick={() => setFilter('duplicate')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                filter === 'duplicate'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Trùng tên mới ({duplicateOpsCount})</span>
            </button>
          )}

          {planResult.skipped > 0 && (
            <button
              onClick={() => setFilter('problem')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === 'problem'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bỏ qua ({planResult.skipped})
            </button>
          )}
        </div>

        {/* Search input with quick clear */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên gốc, tên mới, thư mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* 4. Table or Empty State */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Chưa có tệp tin nào được nạp
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Kéo thả các tệp tin vào đây (chế độ xem trước), bấm "Chọn thư mục" để đổi tên trực tiếp trên ổ đĩa, hoặc bấm nút dưới để xem ngay tệp mẫu.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onLoadSamples}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp 11 tệp mẫu thực tế</span>
              </button>
              <button
                onClick={onOpenDirectory}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Mở thư mục máy tính
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-medium z-10">
                <tr>
                  <th className="py-2.5 pl-3.5 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onToggleAll(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-700 min-w-[200px] w-[40%]">
                    Tên gốc ban đầu
                  </th>
                  <th className="py-2.5 px-2 w-6 text-center text-slate-400">
                    &rarr;
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-slate-700 min-w-[220px] w-[44%]">
                    Tên mới sau khi áp dụng quy tắc
                  </th>
                  <th className="py-2.5 pr-3.5 pl-2 font-semibold text-slate-700 text-right min-w-[110px]">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOps.map((op) => {
                  const isDir = op.item.isDir;
                  const isExcluded = op.excluded;
                  const isSevere = Boolean(op.isSevereDuplicate);
                  const isConflict = Boolean(op.hasCollision && !op.isSevereDuplicate);

                  return (
                    <tr
                      key={op.item.id}
                      className={`transition-colors cursor-pointer ${
                        isSevere
                          ? 'bg-rose-50/90 hover:bg-rose-100 border-l-4 border-rose-600'
                          : isConflict
                          ? 'bg-amber-50/60 hover:bg-amber-100/70 border-l-2 border-amber-500'
                          : isExcluded
                          ? 'opacity-40 bg-slate-50/30 hover:bg-slate-50/60'
                          : 'hover:bg-slate-50/80'
                      } ${selectedOp?.item.id === op.item.id ? 'ring-1 ring-inset ring-indigo-500' : ''}`}
                      onClick={() => setSelectedOp(op)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-2.5 pl-3.5 pr-2 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => onToggleExclude(op.item.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Original name & folder */}
                      <td className="py-2.5 px-3 align-middle font-mono">
                        <div className="flex items-center gap-2 truncate">
                          {isDir ? (
                            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`truncate ${isSevere ? 'font-medium text-rose-950' : 'text-slate-800'}`}
                            title={op.item.name}
                          >
                            {op.item.name}
                          </span>
                        </div>
                        {op.item.parentDir && op.item.parentDir !== '.' && (
                          <div className="text-[10px] text-slate-400 pl-5 truncate font-sans">
                            {op.item.parentDir}
                          </div>
                        )}
                      </td>

                      {/* Direction arrow */}
                      <td className="py-2.5 px-2 align-middle text-center text-slate-300">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                      </td>

                      {/* New name with diff highlight & duplicate notice */}
                      <td className="py-2.5 px-3 align-middle font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          {renderDiff(op.diff, op.status, isSevere)}
                        </div>
                        {isSevere && op.collisionPeers && op.collisionPeers.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-sans font-semibold mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span className="truncate">
                              Trùng tên với: {op.collisionPeers.join(', ')}
                            </span>
                          </div>
                        )}
                        {!isSevere && op.note && (
                          <div className="text-[10px] text-amber-600 font-sans mt-0.5">
                            {op.note}
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="py-2.5 pr-3.5 pl-2 align-middle text-right whitespace-nowrap">
                        {renderStatus(op.status, op.skip, isExcluded, isSevere)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Single-Item Inspector Drawer */}
      {selectedOp && (
        <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Chi tiết tệp & Biến đổi</span>
            </div>
            <button
              onClick={() => setSelectedOp(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Collision warning banner in drawer if applicable */}
            {selectedOp.isSevereDuplicate && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Cảnh báo nguy cơ ghi đè!</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Tệp này đang có cùng tên mới với{' '}
                  <strong>{selectedOp.collisionPeers?.length || 1} tệp khác</strong> trong thư mục:{' '}
                  {selectedOp.collisionPeers?.join(', ')}.
                </p>
              </div>
            )}

            {/* Old vs New Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold block mb-0.5">
                  Tên gốc ban đầu:
                </span>
                <div className="font-mono text-slate-900 bg-white p-2 rounded border border-slate-200 break-all select-all">
                  {selectedOp.item.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold block mb-0.5">
                  Tên mới dự kiến:
                </span>
                <div
                  className={`font-mono p-2 rounded border break-all select-all font-semibold ${
                    selectedOp.isSevereDuplicate
                      ? 'text-rose-900 bg-rose-100/60 border-rose-300'
                      : 'text-emerald-800 bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  {selectedOp.newName}
                </div>
              </div>
            </div>

            {/* Difference breakdown */}
            <div className="space-y-1.5">
              <span className="text-slate-700 font-semibold block">
                So sánh khác biệt (Diff):
              </span>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-xs break-all leading-relaxed">
                {renderDiff(selectedOp.diff, selectedOp.status, Boolean(selectedOp.isSevereDuplicate))}
              </div>
            </div>

            {/* Metadata properties */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Thư mục cha:</span>
                <span className="font-mono text-slate-800 truncate max-w-[180px]">
                  {selectedOp.item.parentDir || '.'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Loại mục:</span>
                <span className="font-medium text-slate-800">
                  {selectedOp.item.isDir ? 'Thư mục' : 'Tệp tin'}
                </span>
              </div>
              {selectedOp.item.size > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Dung lượng:</span>
                  <span className="font-mono text-slate-800">
                    {(selectedOp.item.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
              {selectedOp.note && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                  Ghi chú: {selectedOp.note}
                </div>
              )}
            </div>

            {/* Action inside drawer */}
            <div className="pt-3">
              <button
                onClick={() => {
                  onToggleExclude(selectedOp.item.id);
                  setSelectedOp({
                    ...selectedOp,
                    excluded: !selectedOp.excluded,
                  });
                }}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  selectedOp.excluded
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>
                  {selectedOp.excluded ? 'Bật lại tệp này vào danh sách' : 'Tạm thời loại trừ tệp này'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function renderDiff(diff: DiffSegment[], status: RenameOp['status'], isSevere = false) {
  if (status === 'unchanged') {
    return <span className="text-slate-400">{diff[0]?.text || ''}</span>;
  }

  return (
    <span className="truncate">
      {diff.map((seg, i) => {
        if (seg.type === 'same') {
          return (
            <span key={i} className={isSevere ? 'text-rose-950 font-medium' : 'text-slate-800'}>
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'removed') {
          return (
            <span
              key={i}
              className="line-through bg-rose-200/80 text-rose-800 px-0.5 rounded-xs mx-0.5"
            >
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'added') {
          return (
            <span
              key={i}
              className={
                isSevere
                  ? 'bg-rose-200 text-rose-900 font-bold px-0.5 rounded-xs mx-0.5'
                  : 'bg-emerald-100 text-emerald-900 font-medium px-0.5 rounded-xs mx-0.5'
              }
            >
              {seg.text}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

function renderStatus(
  status: RenameOp['status'],
  skip: boolean,
  excluded?: boolean,
  isSevere?: boolean
) {
  if (excluded) {
    return (
      <span className="text-xs text-slate-400">
        Bỏ qua (chọn tắt)
      </span>
    );
  }
  if (isSevere) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        <span>Trùng tên mới!</span>
      </span>
    );
  }
  if (skip) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
        <XCircle className="w-3 h-3" />
        <span>Bỏ qua</span>
      </span>
    );
  }
  if (status === 'changed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="w-3 h-3" />
        <span>Sẽ đổi</span>
      </span>
    );
  }
  if (status === 'conflict') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <AlertTriangle className="w-3 h-3" />
        <span>Tránh trùng</span>
      </span>
    );
  }
  return <span className="text-xs text-slate-400">Không đổi</span>;
}
