import React, { useState, useEffect, useMemo } from 'react';
import {
  FileItem,
  RenameRuleConfig,
  PlanResult,
  HistoryEntry,
  Preset,
} from './types/renamer';
import {
  DEFAULT_CONFIG,
  getSavedPresets,
  saveUserPreset,
  deleteUserPreset,
} from './utils/defaultPresets';
import { getSampleFiles } from './utils/sampleFiles';
import {
  buildPlan,
  generateCliCommand,
} from './utils/renamerCore';
import { downloadTextFile } from './utils/portableAssets';
import { Header } from './components/Header';
import { StepNavigation, StepId } from './components/StepNavigation';
import { ActiveRulesBar } from './components/ActiveRulesBar';
import { FileSourceStep } from './components/FileSourceStep';
import { RulesPanel } from './components/RulesPanel';
import { FilePreviewTable } from './components/FilePreviewTable';
import { ActionFooter } from './components/ActionFooter';
import { HistoryModal } from './components/HistoryModal';
import { PortableModal } from './components/PortableModal';
import { CliCommandModal } from './components/CliCommandModal';
import { PresetModal } from './components/PresetModal';
import JSZip from 'jszip';
import { UploadCloud } from 'lucide-react';

const HISTORY_STORAGE_KEY = 'batch_renamer_history_v1';

export default function App() {
  // 1. Core State
  const [items, setItems] = useState<FileItem[]>([]);
  const [config, setConfig] = useState<RenameRuleConfig>(DEFAULT_CONFIG);
  const [presets, setPresets] = useState<Preset[]>(() => getSavedPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // Directory Handle for File System Access API
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [dirName, setDirName] = useState<string>('');

  // Workflow, Layout & Responsive State
  const [currentStep, setCurrentStep] = useState<StepId>('rules');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stepper'>('split');
  const [mobileActiveTab, setMobileActiveTab] = useState<'rules' | 'preview'>('rules');
  const [isDragOver, setIsDragOver] = useState(false);

  // Execution & History
  const [isApplying, setIsApplying] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Views & Modals
  const [activeView, setActiveView] = useState<'renamer' | 'history' | 'portable'>('renamer');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPortableModal, setShowPortableModal] = useState(false);
  const [showCliModal, setShowCliModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  // Notification Banner
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const showBanner = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setBannerMessage({ type, text });
    setTimeout(() => setBannerMessage(null), 5000);
  };

  // 2. Real-Time Plan Evaluation
  const planResult: PlanResult = useMemo(() => {
    return buildPlan(items, config, true, excludedIds);
  }, [items, config, excludedIds]);

  // Count active non-default rules
  const activeRulesCount = useMemo(() => {
    let count = 0;
    if (config.removeAccents) count++;
    if (config.asciiOnly) count++;
    if (config.unicode !== 'none') count++;
    if (config.stripNumbering) count++;
    if (config.removeBrackets) count++;
    if (config.removeTextList.length > 0) count++;
    if (config.replacePairs.length > 0) count++;
    if (config.removeBefore || config.removeAfter) count++;
    if (config.caseMode !== 'keep') count++;
    if (config.spaces !== 'keep') count++;
    if (config.removeSpecial) count++;
    if (config.removeDigits) count++;
    if (config.prefix || config.suffix) count++;
    if (config.numbering) count++;
    if (config.dateSource !== 'none') count++;
    if (config.parentFolder !== 'none') count++;
    if (config.extCase !== 'keep') count++;
    if (config.extMappings.length > 0) count++;
    if (config.windowsSafe) count++;
    if (config.collapseSeparators) count++;
    return count;
  }, [config]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore
    }
  }, [history]);

  // 3. Selection Handlers
  const handleToggleExclude = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = (selectAll: boolean) => {
    if (selectAll) {
      setExcludedIds(new Set());
    } else {
      setExcludedIds(new Set(items.map((it) => it.id)));
    }
  };

  // 4. File Ingestion Handlers
  const handleLoadSamples = () => {
    setItems(getSampleFiles());
    setExcludedIds(new Set());
    setDirHandle(null);
    setDirName('');
    showBanner('Đã nạp 11 tệp mẫu thực tế để thử nghiệm!', 'info');
  };

  const handleClearFiles = () => {
    setItems([]);
    setExcludedIds(new Set());
    setDirHandle(null);
    setDirName('');
  };

  const handleRemoveSingleItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setExcludedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems: FileItem[] = [];
    const now = Date.now();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const relativePath = (file as any).webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      const parentDir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';

      newItems.push({
        id: `file_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        path: relativePath,
        parentDir,
        isDir: false,
        size: file.size,
        mtime: file.lastModified || now,
        ctime: file.lastModified || now,
        rawFile: file,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    showBanner(`Đã thêm ${newItems.length} tệp tin mới vào bảng.`, 'info');
  };

  // Native File System Access API
  const handleOpenDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert(
        'Trình duyệt/kết nối hiện tại không cho phép đổi tên trực tiếp trên ổ cứng.\n' +
          'File System Access API chỉ hoạt động ở kết nối bảo mật: truy cập qua https:// hoặc http://localhost.\n' +
          'Có thể kéo thả thư mục vào hoặc dùng nút "Thêm tệp" rồi "Tải ZIP".'
      );
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      setDirHandle(handle);
      setDirName(handle.name);

      const scannedItems: FileItem[] = [];
      const readDir = async (dirH: any, currentPath: string) => {
        for await (const entry of dirH.values()) {
          const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            scannedItems.push({
              id: `dir_${entryPath}_${Math.random().toString(36).substring(2, 6)}`,
              name: entry.name,
              path: entryPath,
              parentDir: currentPath || handle.name,
              isDir: false,
              size: file.size,
              mtime: file.lastModified,
              ctime: file.lastModified,
              rawFile: file,
              fileHandle: entry,
            });
          } else if (entry.kind === 'directory') {
            scannedItems.push({
              id: `dir_${entryPath}_${Math.random().toString(36).substring(2, 6)}`,
              name: entry.name,
              path: entryPath,
              parentDir: currentPath || handle.name,
              isDir: true,
              size: 0,
              mtime: Date.now(),
              ctime: Date.now(),
              fileHandle: entry,
            });
            if (config.recursive) {
              await readDir(entry, entryPath);
            }
          }
        }
      };

      await readDir(handle, '');
      setItems(scannedItems);
      setExcludedIds(new Set());
      showBanner(
        `Đã kết nối trực tiếp thư mục "${handle.name}" với ${scannedItems.length} mục.`,
        'success'
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert('Không thể mở thư mục: ' + err.message);
      }
    }
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // 5. Preset Handlers
  const handleSelectPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
    }));
    showBanner(`Đã áp dụng mẫu cấu hình: ${preset.name}`, 'info');
  };

  const handleSaveCustomPreset = (name: string, description: string) => {
    const saved = saveUserPreset({
      name,
      description,
      config: { ...config },
    });
    setPresets(getSavedPresets());
    setActivePresetId(saved.id);
    showBanner(`Đã lưu mẫu "${name}" thành công!`, 'success');
  };

  const handleDeleteCustomPreset = (id: string) => {
    deleteUserPreset(id);
    setPresets(getSavedPresets());
    if (activePresetId === id) setActivePresetId(null);
    showBanner('Đã xóa mẫu cấu hình tùy chỉnh.', 'info');
  };

  const handleResetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setActivePresetId(null);
    showBanner('Đã đưa tất cả quy tắc về mặc định ban đầu.', 'info');
  };

  const handleAutoResolveDuplicates = () => {
    setConfig((prev) => ({
      ...prev,
      onConflict: 'number',
      conflictFormat: '_{n}',
    }));
    showBanner(
      'Đã kích hoạt tự động đánh số phân biệt (_1, _2...) để loại bỏ xung đột trùng tên!',
      'success'
    );
  };

  // 6. Rename Execution & Rollback Engine
  const handleApplyRename = async () => {
    const candidates = planResult.ops.filter(
      (op) => !op.excluded && !op.skip && op.status !== 'unchanged'
    );

    if (candidates.length === 0) {
      alert('Không có tệp tin nào cần đổi tên theo quyết định hiện tại.');
      return;
    }

    // Đổi tên thật chỉ khả thi khi có quyền ghi trực tiếp qua File System Access API
    if (!dirHandle) {
      alert(
        'Chế độ xem trước: các tệp được thêm bằng kéo-thả không thể đổi tên trực tiếp trên ổ cứng.\n' +
          'Hãy dùng nút "Mở thư mục" để cấp quyền ghi, hoặc dùng "Tải ZIP" để xuất bộ tệp đã đổi tên.'
      );
      return;
    }

    const opsToApply = candidates.filter(
      (op) => op.item.fileHandle && typeof op.item.fileHandle.move === 'function'
    );
    const noHandleCount = candidates.length - opsToApply.length;

    if (opsToApply.length === 0) {
      alert('Không có tệp nào có quyền ghi trực tiếp. Hãy mở thư mục bằng "Mở thư mục".');
      return;
    }
    if (noHandleCount > 0) {
      const proceed = window.confirm(
        `CẢNH BÁO: ${noHandleCount} tệp không thể đổi tên trực tiếp (thiếu quyền ghi thư mục) và sẽ bị bỏ qua.\n` +
          `Chỉ ${opsToApply.length} tệp được đổi tên. Tiếp tục?`
      );
      if (!proceed) return;
    }

    if (planResult.severeDuplicates > 0) {
      const proceed = window.confirm(
        `CẢNH BÁO NGUY HIỂM GHI ĐÈ:\nCó ${planResult.severeDuplicates} tệp tin có cùng tên mới trong cùng một thư mục!\n` +
          `Nếu tiếp tục đổi tên, các tệp này sẽ ghi đè lên nhau và gây mất dữ liệu.\n\n` +
          `Bạn có chắc chắn muốn ghi đè không? (Khuyên dùng: Bật tính năng 'Đánh số thứ tự' ở Bước 2 để tránh trùng lặp)`
      );
      if (!proceed) return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn đổi tên ${opsToApply.length} tệp tin?`;
    if (!window.confirm(confirmMsg)) return;

    setIsApplying(true);
    const logEntries: HistoryEntry['log'] = [];
    let successCount = 0;
    let failCount = 0;

    for (const op of opsToApply) {
      try {
        await op.item.fileHandle.move(op.newName);
        logEntries.push({
          dir: op.item.parentDir,
          old: op.item.name,
          new: op.newName,
          status: 'ok',
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        logEntries.push({
          dir: op.item.parentDir,
          old: op.item.name,
          new: op.newName,
          status: 'fail',
          error: err?.message || 'Lỗi hệ điều hành',
        });
      }
    }

    for (const op of candidates) {
      if (!opsToApply.includes(op)) {
        logEntries.push({
          dir: op.item.parentDir,
          old: op.item.name,
          new: op.newName,
          status: 'skip',
          note: 'Không thể đổi tên trực tiếp (thiếu quyền ghi thư mục)',
        });
      }
    }

    // Update in-memory items
    const newItems = items.map((it) => {
      const matchOp = opsToApply.find((op) => op.item.id === it.id);
      if (matchOp && !matchOp.skip) {
        const parts = it.path.split('/');
        parts[parts.length - 1] = matchOp.newName;
        return {
          ...it,
          name: matchOp.newName,
          path: parts.join('/'),
        };
      }
      return it;
    });

    setItems(newItems);

    const newHistoryEntry: HistoryEntry = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalFiles: opsToApply.length,
      successCount,
      failCount,
      configSnapshot: { ...config },
      log: logEntries,
    };

    setHistory((prev) => [newHistoryEntry, ...prev]);
    setIsApplying(false);

    showBanner(
      `Đã hoàn tất: ${successCount} thành công, ${failCount} lỗi` +
        (noHandleCount > 0 ? `, ${noHandleCount} bỏ qua (không có quyền ghi)` : '') +
        '. Bạn có thể xem lại hoặc Hoàn tác bất kỳ lúc nào.',
      failCount > 0 ? 'error' : 'success'
    );
  };

  // Revert / Rollback a specific batch
  const handleRevertBatch = async (entry: HistoryEntry) => {
    const reversible = entry.log.filter((l) => l.status === 'ok' && l.old !== l.new);

    if (reversible.length === 0) {
      showBanner('Đợt lịch sử này không có thao tác đổi tên nào trên ổ cứng để hoàn tác.', 'info');
      return;
    }

    if (!dirHandle) {
      alert('Cần mở lại thư mục bằng nút "Mở thư mục" để hoàn tác trực tiếp trên ổ cứng.');
      return;
    }

    if (!window.confirm(`Xác nhận hoàn tác ${reversible.length} tệp về tên cũ ban đầu?`)) {
      return;
    }

    setIsApplying(true);
    const itemByName = new Map(items.map((it) => [it.name, it]));
    const revertingNames = new Set(reversible.map((l) => l.new));
    const failures: Array<{ file: string; error: string }> = [];
    const revertedNew: string[] = [];

    const tryMove = async (item: FileItem, to: string): Promise<boolean> => {
      try {
        await item.fileHandle.move(to);
        return true;
      } catch (err: any) {
        failures.push({ file: item.name, error: err?.message || 'Lỗi hệ điều hành' });
        return false;
      }
    };

    // Pha 1: tên cũ không bị chiếm bởi tệp khác trong đợt hoàn tác
    const phase2: Array<{ log: (typeof reversible)[number]; item: FileItem }> = [];
    for (const log of reversible) {
      if (revertingNames.has(log.old)) {
        const item = itemByName.get(log.new);
        if (item) phase2.push({ log, item });
        continue;
      }
      const item = itemByName.get(log.new);
      if (item && (await tryMove(item, log.old))) revertedNew.push(log.new);
    }

    // Pha 2: chuỗi hoán đổi (a→b, b→a) — đổi qua tên tạm để tránh đè lên nhau
    const tempMap = new Map<string, (typeof reversible)[number]>();
    for (const { log, item } of phase2) {
      const tmp = `${log.new}.ksb_revert_tmp`;
      if (await tryMove(item, tmp)) tempMap.set(tmp, log);
    }
    for (const log of tempMap.values()) {
      const item = itemByName.get(log.new)!;
      if (await tryMove(item, log.old)) revertedNew.push(log.new);
    }

    const restored = new Map(
      revertedNew.map((n) => [n, reversible.find((l) => l.new === n)!.old])
    );
    const restoredItems = items.map((it) => {
      const oldName = restored.get(it.name);
      if (!oldName) return it;
      const parts = it.path.split('/');
      parts[parts.length - 1] = oldName;
      return { ...it, name: oldName, path: parts.join('/') };
    });

    setItems(restoredItems);
    setIsApplying(false);

    if (failures.length > 0) {
      showBanner(
        `Hoàn tác ${restored.size}/${reversible.length} tệp. Lỗi ${failures.length}: ` +
          failures.map((f) => `${f.file} (${f.error})`).join('; '),
        'error'
      );
    } else {
      showBanner(`Đã hoàn tác khôi phục tên cũ cho ${restored.size} tệp!`, 'success');
    }
  };

  const handleUndoLatest = () => {
    if (history.length === 0) return;
    handleRevertBatch(history[0]);
  };

  // Import external JSON log to revert
  const handleImportLogFile = (logData: any) => {
    if (!logData || !Array.isArray(logData.entries)) {
      alert('File JSON không đúng định dạng log hoàn tác chuẩn (cần chứa mảng entries).');
      return;
    }

    const syntheticEntry: HistoryEntry = {
      id: `imported_${Date.now()}`,
      timestamp: logData.created || new Date().toISOString(),
      totalFiles: logData.entries.length,
      successCount: logData.entries.length,
      failCount: 0,
      configSnapshot: { ...config },
      log: logData.entries.map((en: any) => ({
        dir: en.dir || '.',
        old: en.old,
        new: en.new,
        status: 'ok',
      })),
    };

    setHistory((prev) => [syntheticEntry, ...prev]);
    showBanner(
      `Đã nạp file nhật ký hoàn tác (${syntheticEntry.totalFiles} mục). Bạn có thể bấm "Hoàn tác đợt này" ngay trong danh sách!`,
      'info'
    );
  };

  // 7. ZIP Export
  const handleDownloadZip = async () => {
    setIsApplying(true);
    try {
      const zip = new JSZip();
      for (const op of planResult.ops) {
        if (op.excluded || op.item.isDir) continue;
        const targetName = op.newName;
        const relativeFolder = op.item.parentDir !== '.' ? op.item.parentDir : '';
        const zipPath = relativeFolder ? `${relativeFolder}/${targetName}` : targetName;

        if (op.item.rawFile) {
          zip.file(zipPath, op.item.rawFile);
        } else {
          zip.file(zipPath, `Sample content for file: ${targetName}\nOriginal: ${op.item.name}`);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renamed_files_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showBanner('Đã tải xuống thành công gói ZIP chứa các tệp đã đổi tên!', 'success');
    } catch (err: any) {
      alert('Không thể tạo file ZIP: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  // 8. Export Current Plan as JSON Log
  const handleExportPlanLog = () => {
    const exportOps = planResult.ops.filter((op) => !op.excluded);
    const data = {
      version: '1.0.0',
      created: new Date().toISOString(),
      entries: exportOps.map((op) => ({
        dir: op.item.parentDir,
        old: op.item.name,
        new: op.newName,
      })),
    };

    downloadTextFile(
      `rename_log_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2)
    );
    showBanner('Đã xuất file log hoàn tác JSON tương thích Python CLI!', 'success');
  };

  const cliCommand = useMemo(() => {
    return generateCliCommand(config, dirName || '.');
  }, [config, dirName]);

  return (
    <div
      className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-white pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-dashed border-white flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Thả các tệp hoặc thư mục vào đây</h2>
          <p className="text-xs text-indigo-200 mt-1">Hệ thống sẽ nạp danh sách tệp tự động vào ứng dụng</p>
        </div>
      )}

      {/* Top Header */}
      <Header
        onLoadSamples={handleLoadSamples}
        onOpenDirectory={handleOpenDirectory}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenPortable={() => setShowPortableModal(true)}
        onOpenCli={() => setShowCliModal(true)}
        canUndo={history.length > 0}
        onUndoLatest={handleUndoLatest}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Step Navigation Bar */}
      <StepNavigation
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        fileCount={items.length}
        activeRulesCount={activeRulesCount}
        willChangeCount={planResult.willChange}
        layoutMode={layoutMode}
        onToggleLayoutMode={() =>
          setLayoutMode((prev) => (prev === 'split' ? 'stepper' : 'split'))
        }
        mobileActiveTab={mobileActiveTab}
        onSelectMobileTab={setMobileActiveTab}
      />

      {/* Active Rules Ribbon Bar */}
      <ActiveRulesBar
        config={config}
        onChangeConfig={setConfig}
        onReset={handleResetToDefaults}
      />

      {/* Notification Banner */}
      {bannerMessage && (
        <div
          className={`px-4 sm:px-6 py-2 text-xs font-medium border-b flex items-center justify-between shrink-0 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : bannerMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-xs hover:opacity-75 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* VIEW MODE 1: STEPPER FOCUS - STEP 1 (SOURCE FILES) */}
        {layoutMode === 'stepper' && currentStep === 'source' ? (
          <FileSourceStep
            items={items}
            dirName={dirName}
            hasDirectoryHandle={Boolean(dirHandle)}
            onOpenDirectory={handleOpenDirectory}
            onAddFiles={handleAddFiles}
            onLoadSamples={handleLoadSamples}
            onClearFiles={handleClearFiles}
            onRemoveItem={handleRemoveSingleItem}
            onProceedToRules={() => setCurrentStep('rules')}
          />
        ) : layoutMode === 'stepper' && currentStep === 'rules' ? (
          /* VIEW MODE 1: STEPPER FOCUS - STEP 2 (RULES ONLY) */
          <div className="flex-1 max-w-4xl mx-auto w-full h-full overflow-hidden flex flex-col p-4 sm:p-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs h-full flex flex-col overflow-hidden">
              <RulesPanel
                config={config}
                onChangeConfig={setConfig}
                presets={presets}
                activePresetId={activePresetId}
                onSelectPreset={handleSelectPreset}
                onOpenSavePresetModal={() => setShowPresetModal(true)}
                onResetToDefaults={handleResetToDefaults}
              />
            </div>
          </div>
        ) : layoutMode === 'stepper' && (currentStep === 'preview' || currentStep === 'apply') ? (
          /* VIEW MODE 1: STEPPER FOCUS - STEP 3/4 (PREVIEW & APPLY) */
          <section className="flex-1 h-full overflow-hidden flex flex-col bg-white">
            <FilePreviewTable
              items={items}
              planResult={planResult}
              onToggleExclude={handleToggleExclude}
              onToggleAll={handleToggleAll}
              onAddFiles={handleAddFiles}
              onOpenDirectory={handleOpenDirectory}
              onClearFiles={handleClearFiles}
              onLoadSamples={handleLoadSamples}
            />
          </section>
        ) : (
          /* VIEW MODE 2: SPLIT SCREEN (SIDE BY SIDE ON DESKTOP, TABBED ON MOBILE) */
          <>
            {/* Left Rules Configuration Panel (Desktop or Mobile tab) */}
            <aside
              className={`w-full lg:w-96 xl:w-[420px] shrink-0 h-full overflow-hidden flex flex-col border-r border-slate-200 bg-white ${
                mobileActiveTab === 'rules' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <RulesPanel
                config={config}
                onChangeConfig={setConfig}
                presets={presets}
                activePresetId={activePresetId}
                onSelectPreset={handleSelectPreset}
                onOpenSavePresetModal={() => setShowPresetModal(true)}
                onResetToDefaults={handleResetToDefaults}
              />
            </aside>

            {/* Right Live Preview & Verification Workspace (Desktop or Mobile tab) */}
            <section
              className={`flex-1 h-full overflow-hidden flex flex-col bg-white ${
                mobileActiveTab === 'preview' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <FilePreviewTable
                items={items}
                planResult={planResult}
                onToggleExclude={handleToggleExclude}
                onToggleAll={handleToggleAll}
                onAddFiles={handleAddFiles}
                onOpenDirectory={handleOpenDirectory}
                onClearFiles={handleClearFiles}
                onLoadSamples={handleLoadSamples}
                onAutoResolveDuplicates={handleAutoResolveDuplicates}
              />
            </section>
          </>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <ActionFooter
        planResult={planResult}
        onApply={handleApplyRename}
        onDownloadZip={handleDownloadZip}
        onExportLog={handleExportPlanLog}
        onUndo={handleUndoLatest}
        canUndo={history.length > 0}
        isApplying={isApplying}
        hasDirectoryHandle={Boolean(dirHandle)}
        hasFiles={items.length > 0}
      />

      {/* Modals */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onRevertBatch={handleRevertBatch}
        onImportLogFile={handleImportLogFile}
        onClearHistory={() => {
          setHistory([]);
          localStorage.removeItem(HISTORY_STORAGE_KEY);
        }}
      />

      <PortableModal
        isOpen={showPortableModal}
        onClose={() => setShowPortableModal(false)}
      />

      <CliCommandModal
        isOpen={showCliModal}
        onClose={() => setShowCliModal(false)}
        command={cliCommand}
      />

      <PresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        customPresets={presets.filter((p) => !p.isBuiltIn)}
        onSavePreset={handleSaveCustomPreset}
        onDeletePreset={handleDeleteCustomPreset}
      />
    </div>
  );
}
