import React, { useState } from 'react';
import {
  RenameRuleConfig,
  Preset,
  BracketKind,
  CaseMode,
  SpacesMode,
  NumberPos,
  SortMode,
  UnicodeMode,
} from '../types/renamer';
import {
  Eraser,
  Search,
  Type,
  Hash,
  Shield,
  Filter,
  BookmarkPlus,
  Plus,
  Trash2,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface RulesPanelProps {
  config: RenameRuleConfig;
  onChangeConfig: (newConfig: RenameRuleConfig) => void;
  presets: Preset[];
  activePresetId: string | null;
  onSelectPreset: (preset: Preset) => void;
  onOpenSavePresetModal: () => void;
  onResetToDefaults: () => void;
}

type TabType = 'clean' | 'replace' | 'case' | 'number' | 'ext' | 'filter';

export const RulesPanel: React.FC<RulesPanelProps> = ({
  config,
  onChangeConfig,
  presets,
  activePresetId,
  onSelectPreset,
  onOpenSavePresetModal,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('clean');
  const [newRemoveWord, setNewRemoveWord] = useState('');
  const [newReplaceFrom, setNewReplaceFrom] = useState('');
  const [newReplaceTo, setNewReplaceTo] = useState('');
  const [newCharMapFrom, setNewCharMapFrom] = useState('');
  const [newCharMapTo, setNewCharMapTo] = useState('');
  const [newExtMapFrom, setNewExtMapFrom] = useState('');
  const [newExtMapTo, setNewExtMapTo] = useState('');
  const [newRegexPattern, setNewRegexPattern] = useState('');
  const [newRegexRepl, setNewRegexRepl] = useState('');

  const update = (partial: Partial<RenameRuleConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const handleAddRegexReplace = () => {
    if (!newRegexPattern.trim()) return;
    try {
      new RegExp(newRegexPattern.trim());
    } catch {
      alert('Biểu thức chính quy (Regex) không đúng cú pháp!');
      return;
    }
    update({
      regexReplacePairs: [
        ...(config.regexReplacePairs || []),
        { pattern: newRegexPattern.trim(), repl: newRegexRepl },
      ],
    });
    setNewRegexPattern('');
    setNewRegexRepl('');
  };

  const handleRemoveRegexReplace = (index: number) => {
    update({
      regexReplacePairs: (config.regexReplacePairs || []).filter((_, i) => i !== index),
    });
  };

  const handleAddCharMap = () => {
    if (!newCharMapFrom) return;
    update({
      charMaps: [...(config.charMaps || []), { from: newCharMapFrom, to: newCharMapTo }],
    });
    setNewCharMapFrom('');
    setNewCharMapTo('');
  };

  const handleRemoveCharMap = (index: number) => {
    update({
      charMaps: (config.charMaps || []).filter((_, i) => i !== index),
    });
  };

  const handleAddRemoveWord = () => {
    if (!newRemoveWord.trim()) return;
    const words = newRemoveWord
      .split(/[;,]/)
      .map((w) => w.trim())
      .filter(Boolean);
    update({
      removeTextList: Array.from(new Set([...config.removeTextList, ...words])),
    });
    setNewRemoveWord('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    update({
      removeTextList: config.removeTextList.filter((w) => w !== wordToRemove),
    });
  };

  const handleAddReplacePair = () => {
    if (!newReplaceFrom.trim()) return;
    if (newReplaceFrom.includes('=>')) {
      const parts = newReplaceFrom.split(';');
      const newPairs: Array<{ from: string; to: string }> = [];
      for (const part of parts) {
        if (!part.includes('=>')) continue;
        const [f, t] = part.split('=>');
        if (f.trim()) {
          newPairs.push({ from: f.trim(), to: t !== undefined ? t : '' });
        }
      }
      if (newPairs.length > 0) {
        update({
          replacePairs: [...config.replacePairs, ...newPairs],
        });
        setNewReplaceFrom('');
        setNewReplaceTo('');
        return;
      }
    }
    update({
      replacePairs: [
        ...config.replacePairs,
        { from: newReplaceFrom.trim(), to: newReplaceTo },
      ],
    });
    setNewReplaceFrom('');
    setNewReplaceTo('');
  };

  const handleRemoveReplacePair = (index: number) => {
    update({
      replacePairs: config.replacePairs.filter((_, i) => i !== index),
    });
  };

  const handleAddExtMap = () => {
    if (!newExtMapFrom.trim() || !newExtMapTo.trim()) return;
    update({
      extMappings: [
        ...config.extMappings,
        {
          from: newExtMapFrom.trim().replace(/^\./, ''),
          to: newExtMapTo.trim().replace(/^\./, ''),
        },
      ],
    });
    setNewExtMapFrom('');
    setNewExtMapTo('');
  };

  const handleRemoveExtMap = (index: number) => {
    update({
      extMappings: config.extMappings.filter((_, i) => i !== index),
    });
  };

  const toggleBracketKind = (kind: BracketKind) => {
    const exists = config.bracketKinds.includes(kind);
    const updated = exists
      ? config.bracketKinds.filter((k) => k !== kind)
      : [...config.bracketKinds, kind];
    update({ bracketKinds: updated });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* 1. Presets Toolbar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mẫu cấu hình (Presets)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSavePresetModal}
              className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
              title="Lưu cấu hình đang chọn thành mẫu mới"
            >
              <BookmarkPlus className="w-3 h-3" />
              <span>Lưu mẫu</span>
            </button>
            <button
              onClick={onResetToDefaults}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 px-1.5 py-0.5 rounded transition-colors"
              title="Đặt lại cài đặt mặc định"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {presets.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={p.description}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Navigation Tabs with Active Badges */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('clean')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'clean'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eraser className="w-3.5 h-3.5 text-indigo-500" />
          <span>1. Làm sạch</span>
          {(config.removeAccents || config.asciiOnly || config.stripNumbering || config.removeBrackets || config.removeSpecial || config.removeDigits || config.unicode !== 'none') && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('replace')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'replace'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-emerald-500" />
          <span>2. Tìm & Thay</span>
          {(config.removeTextList.length > 0 || config.replacePairs.length > 0 || (config.regexReplacePairs || []).length > 0 || (config.charMaps || []).length > 0 || config.removeBefore || config.removeAfter) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('case')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'case'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-blue-500" />
          <span>3. Kiểu chữ</span>
          {(config.caseMode !== 'keep' || config.spaces !== 'keep') && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('number')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'number'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-purple-500" />
          <span>4. Đánh số</span>
          {(config.numbering || config.prefix || config.suffix || config.dateSource !== 'none' || config.parentFolder !== 'none') && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ext')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'ext'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-500" />
          <span>5. Đuôi & An toàn</span>
          {(config.extCase !== 'keep' || config.extMappings.length > 0 || config.setExt || config.maxLength) && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('filter')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'filter'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>6. Lọc tệp</span>
          {(config.target !== 'files' || config.onlyExt || config.matchRegex || config.recursive || config.includeHidden) && (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
          )}
        </button>
      </div>

      {/* 3. Tab Contents with Flat Design */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: LÀM SẠCH TÊN */}
        {activeTab === 'clean' && (
          <div className="space-y-4 text-xs">
            {/* Tiếng Việt & Dấu & Fullwidth */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Tiếng Việt & Chuẩn hóa Ký tự
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.fullwidth}
                  onChange={(e) => update({ fullwidth: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Đổi ký tự full-width sang ASCII (： ？ ｜ ＂ ＊ ＜ ＞ ／ ＼ ＡＢＣ １２３)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.colonToDash}
                  onChange={(e) => update({ colonToDash: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Đổi dấu ':' (kể cả '：') thành ' - ' (giữ nguyên giờ như 10:30)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.removeAccents}
                  onChange={(e) => update({ removeAccents: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Bỏ dấu tiếng Việt (đ, Đ &rarr; d, D; áo &rarr; ao)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.asciiOnly}
                  onChange={(e) => update({ asciiOnly: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Chuyển sang ASCII thuần (chuyển ß&rarr;ss, æ&rarr;ae, loại ký tự lạ)
                </span>
              </label>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-slate-700">Chuẩn hóa Unicode:</span>
                <select
                  value={config.unicode}
                  onChange={(e) =>
                    update({ unicode: e.target.value as UnicodeMode })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="none">Giữ nguyên (None)</option>
                  <option value="nfc">NFC (Sửa lỗi dấu macOS &rarr; Win)</option>
                  <option value="nfd">NFD (Dấu phân tách)</option>
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Bỏ số thứ tự đầu tên */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Số thứ tự & Dấu ngoặc
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.stripNumbering}
                  onChange={(e) =>
                    update({ stripNumbering: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Xóa số thứ tự đầu tên (01. , 1) , (02) , 03 - , 04_)
                </span>
              </label>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.removeBrackets}
                    onChange={(e) =>
                      update({ removeBrackets: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-slate-800">
                    Xóa dấu ngoặc
                  </span>
                </label>

                {config.removeBrackets && (
                  <div className="space-y-2 pl-5 pt-1">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBracketKind('round')}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          config.bracketKinds.includes('round')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Tròn ( )
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBracketKind('square')}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          config.bracketKinds.includes('square')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Vuông [ ]
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBracketKind('curly')}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          config.bracketKinds.includes('curly')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Nhọn {'{ }'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBracketKind('angle')}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          config.bracketKinds.includes('angle')
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        Nhọn &lt; &gt;
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={config.keepBracketContent}
                        onChange={(e) =>
                          update({ keepBracketContent: e.target.checked })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">
                        Giữ lại chữ bên trong (chỉ bỏ ký hiệu ngoặc)
                      </span>
                    </label>

                    <div className="pt-1">
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Chỉ xử lý ngoặc có nội dung khớp Regex (tùy chọn):
                      </label>
                      <input
                        type="text"
                        placeholder="vd: ^\d+$ (chỉ ngoặc chứa số)"
                        value={config.bracketMatchRegex}
                        onChange={(e) =>
                          update({ bracketMatchRegex: e.target.value })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Ký tự đặc biệt & Khoảng cắt */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Ký tự đặc biệt & Cắt vị trí
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.removeSpecial}
                  onChange={(e) => update({ removeSpecial: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Xóa ký tự đặc biệt (@, #, $, %, ^, &, *, ~, +, =, v.v.)
                </span>
              </label>

              {config.removeSpecial && (
                <div className="pl-5 space-y-1">
                  <label className="block text-slate-600 text-[11px]">
                    Ký tự cho phép giữ lại (mặc định: ' -_.'):
                  </label>
                  <input
                    type="text"
                    value={config.specialKeep}
                    onChange={(e) => update({ specialKeep: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.removeDigits}
                  onChange={(e) => update({ removeDigits: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Xóa toàn bộ chữ số</span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Cắt N ký tự đầu:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.cutStart || 0}
                    onChange={(e) =>
                      update({ cutStart: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Cắt N ký tự cuối:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.cutEnd || 0}
                    onChange={(e) =>
                      update({ cutEnd: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-slate-600 text-[11px] mb-1">
                  Đổi các ký tự sau thành khoảng trắng:
                </label>
                <input
                  type="text"
                  placeholder="vd: _.-"
                  value={config.charsToSpace}
                  onChange={(e) => update({ charsToSpace: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.collapseSeparators}
                  onChange={(e) =>
                    update({ collapseSeparators: e.target.checked })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Gộp dấu phân cách lặp (__ -- .. &rarr; _) và xóa thừa ở đầu/cuối
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: TÌM & THAY THẾ */}
        {activeTab === 'replace' && (
          <div className="space-y-4 text-xs">
            {/* Tùy chọn khớp */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <span className="font-semibold text-slate-900 text-xs block">
                Quy tắc so khớp
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.ignoreCase}
                    onChange={(e) => update({ ignoreCase: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Không phân biệt hoa/thường</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.accentInsensitive}
                    onChange={(e) =>
                      update({ accentInsensitive: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Không phân biệt dấu tiếng Việt</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.wholeWord}
                    onChange={(e) => update({ wholeWord: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">Chỉ khớp nguyên từ</span>
                </label>
              </div>
            </div>

            {/* Danh sách từ cần xóa */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Xóa từ / cụm từ cụ thể
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nhập từ cần xóa (cách nhau bằng dấu phẩy)..."
                  value={newRemoveWord}
                  onChange={(e) => setNewRemoveWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRemoveWord()}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddRemoveWord}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {config.removeTextList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {config.removeTextList.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWord(word)}
                        className="hover:text-rose-900"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Cắt trước / sau */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Xóa tất cả trước từ:
                </label>
                <input
                  type="text"
                  placeholder="Gồm cả từ này..."
                  value={config.removeBefore}
                  onChange={(e) => update({ removeBefore: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Xóa tất cả sau từ:
                </label>
                <input
                  type="text"
                  placeholder="Gồm cả từ này..."
                  value={config.removeAfter}
                  onChange={(e) => update({ removeAfter: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Cặp thay thế chuỗi */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Thay thế chuỗi (Old &rarr; New)
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Từ cũ..."
                  value={newReplaceFrom}
                  onChange={(e) => setNewReplaceFrom(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                />
                <span className="text-slate-400">&rarr;</span>
                <input
                  type="text"
                  placeholder="Từ mới..."
                  value={newReplaceTo}
                  onChange={(e) => setNewReplaceTo(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddReplacePair}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {config.replacePairs.length > 0 && (
                <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                  {config.replacePairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <div className="font-mono truncate">
                        <span className="text-rose-600">{pair.from}</span>
                        <span className="text-slate-400 mx-1.5">&rarr;</span>
                        <span className="text-emerald-600">
                          {pair.to || '(chuỗi rỗng)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveReplacePair(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Thay thế bằng Regex */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs block">
                  Thay thế bằng biểu thức chính quy (Regex)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">--regex-replace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Regex mẫu (vd: [0-9]+)..."
                  value={newRegexPattern}
                  onChange={(e) => setNewRegexPattern(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                />
                <span className="text-slate-400">&rarr;</span>
                <input
                  type="text"
                  placeholder="Thay bằng..."
                  value={newRegexRepl}
                  onChange={(e) => setNewRegexRepl(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddRegexReplace}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {(config.regexReplacePairs || []).length > 0 && (
                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                  {config.regexReplacePairs.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                    >
                      <div className="font-mono truncate text-[11px]">
                        <span className="text-purple-600 font-semibold">/{r.pattern}/</span>
                        <span className="text-slate-400 mx-1.5">&rarr;</span>
                        <span className="text-emerald-600">"{r.repl}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRegexReplace(idx)}
                        className="text-slate-400 hover:text-rose-600 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Bảng ánh xạ ký tự từng chữ (char map / tr) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 text-xs block">
                    Bảng ánh xạ ký tự (Character Map / tr)
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Ánh xạ từng ký tự tương ứng (vd: 'abc' &rarr; '123' thì a&rarr;1, b&rarr;2, c&rarr;3)
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">--map</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ký tự nguồn (vd: _-)..."
                  value={newCharMapFrom}
                  onChange={(e) => setNewCharMapFrom(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                />
                <span className="text-slate-400">&rarr;</span>
                <input
                  type="text"
                  placeholder="Đích (vd:  )..."
                  value={newCharMapTo}
                  onChange={(e) => setNewCharMapTo(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCharMap}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {(config.charMaps || []).length > 0 && (
                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                  {config.charMaps.map((cm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    >
                      <div className="truncate text-[11px]">
                        <span className="text-blue-700 font-semibold">{cm.from}</span>
                        <span className="text-slate-400 mx-1.5">&rarr;</span>
                        <span className="text-emerald-700">"{cm.to}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCharMap(idx)}
                        className="text-slate-400 hover:text-rose-600 ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KIỂU CHỮ & KHOẢNG TRẮNG */}
        {activeTab === 'case' && (
          <div className="space-y-4 text-xs">
            {/* Kiểu chữ */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Định dạng kiểu chữ (Case)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'keep', label: 'Giữ nguyên' },
                  { id: 'lower', label: 'chữ thường (lowercase)' },
                  { id: 'upper', label: 'CHỮ HOA (UPPERCASE)' },
                  { id: 'title', label: 'Viết Hoa Đầu Từ (Title)' },
                  { id: 'sentence', label: 'Viết hoa đầu câu (Sentence)' },
                  { id: 'snake', label: 'snake_case (gạch dưới)' },
                  { id: 'kebab', label: 'kebab-case (gạch ngang)' },
                  { id: 'camel', label: 'camelCase (lạc đà)' },
                  { id: 'pascal', label: 'PascalCase (hoa đầu)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ caseMode: item.id as CaseMode })}
                    className={`px-2.5 py-1.5 rounded border text-left transition-colors ${
                      config.caseMode === item.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Khoảng trắng */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Xử lý khoảng trắng (Spaces)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'keep', label: 'Giữ nguyên khoảng trắng' },
                  { id: 'underscore', label: 'Thay bằng dấu gạch dưới (_)' },
                  { id: 'dash', label: 'Thay bằng dấu gạch ngang (-)' },
                  { id: 'dot', label: 'Thay bằng dấu chấm (.)' },
                  { id: 'remove', label: 'Xóa bỏ mọi khoảng trắng' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => update({ spaces: item.id as SpacesMode })}
                    className={`px-2.5 py-1.5 rounded border text-left transition-colors ${
                      config.spaces === item.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ĐÁNH SỐ & GHÉP TÊN */}
        {activeTab === 'number' && (
          <div className="space-y-4 text-xs">
            {/* Đánh số thứ tự */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.numbering}
                  onChange={(e) => update({ numbering: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-900">
                  Bật đánh số thứ tự hàng loạt
                </span>
              </label>

              {config.numbering && (
                <div className="space-y-2.5 pl-5 pt-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Bắt đầu từ:
                      </label>
                      <input
                        type="number"
                        value={config.numberStart}
                        onChange={(e) =>
                          update({
                            numberStart: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Bước nhảy:
                      </label>
                      <input
                        type="number"
                        value={config.numberStep}
                        onChange={(e) =>
                          update({
                            numberStep: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Độ rộng (0=auto):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        placeholder="vd: 3 &rarr; 001"
                        value={config.numberWidth}
                        onChange={(e) =>
                          update({
                            numberWidth: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700">Vị trí số:</span>
                    <select
                      value={config.numberPos}
                      onChange={(e) =>
                        update({ numberPos: e.target.value as NumberPos })
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    >
                      <option value="prefix">Đầu tên (Prefix)</option>
                      <option value="suffix">Cuối tên (Suffix)</option>
                      <option value="replace">Thay thế hẳn tên gốc</option>
                    </select>
                  </div>

                  {config.numberPos === 'replace' && (
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Tên gốc thay thế (vd: Photo &rarr; Photo_001):
                      </label>
                      <input
                        type="text"
                        placeholder="Để trống nếu chỉ muốn đánh số..."
                        value={config.numberBase}
                        onChange={(e) => update({ numberBase: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.numberPerDir}
                      onChange={(e) =>
                        update({ numberPerDir: e.target.checked })
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">
                      Đánh số lại từ đầu trong mỗi thư mục con
                    </span>
                  </label>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-slate-700">Sắp xếp trước khi đánh số:</span>
                    <select
                      value={config.sortMode}
                      onChange={(e) =>
                        update({ sortMode: e.target.value as SortMode })
                      }
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                    >
                      <option value="natural">Tự nhiên (Natural 2 &lt; 10)</option>
                      <option value="name">Theo tên chữ cái A-Z</option>
                      <option value="mtime">Theo ngày sửa đổi (mtime)</option>
                      <option value="ctime">Theo ngày tạo (ctime)</option>
                      <option value="size">Theo dung lượng tệp</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.reverseSort}
                      onChange={(e) => update({ reverseSort: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">Đảo ngược thứ tự</span>
                  </label>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Tiền tố / Hậu tố / Thư mục cha */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Tiền tố, Hậu tố & Thư mục cha
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Tiền tố (Prefix đầu tên):
                  </label>
                  <input
                    type="text"
                    value={config.prefix}
                    onChange={(e) => update({ prefix: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Hậu tố (Suffix cuối tên):
                  </label>
                  <input
                    type="text"
                    value={config.suffix}
                    onChange={(e) => update({ suffix: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Ký tự nối (Separator):
                  </label>
                  <input
                    type="text"
                    value={config.separator}
                    onChange={(e) => update({ separator: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">
                    Chèn tên thư mục cha:
                  </label>
                  <select
                    value={config.parentFolder}
                    onChange={(e) =>
                      update({ parentFolder: e.target.value as any })
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="none">Không chèn</option>
                    <option value="prefix">Chèn ở đầu</option>
                    <option value="suffix">Chèn ở cuối</option>
                  </select>
                </div>
              </div>

              {/* Ngày tháng */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    Chèn ngày tháng:
                  </span>
                  <select
                    value={config.dateSource}
                    onChange={(e) =>
                      update({ dateSource: e.target.value as any })
                    }
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="none">Không chèn</option>
                    <option value="today">Hôm nay</option>
                    <option value="mtime">Ngày sửa đổi tệp</option>
                    <option value="ctime">Ngày tạo tệp</option>
                  </select>
                </div>

                {config.dateSource !== 'none' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Định dạng (%Y%m%d):
                      </label>
                      <input
                        type="text"
                        value={config.dateFormat}
                        onChange={(e) => update({ dateFormat: e.target.value })}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">
                        Vị trí ngày:
                      </label>
                      <select
                        value={config.datePos}
                        onChange={(e) =>
                          update({ datePos: e.target.value as any })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      >
                        <option value="prefix">Đầu tên</option>
                        <option value="suffix">Cuối tên</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ĐUÔI FILE & AN TOÀN */}
        {activeTab === 'ext' && (
          <div className="space-y-4 text-xs">
            {/* Đuôi tệp */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Xử lý đuôi mở rộng (Extension)
              </span>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700">Hoa / Thường của đuôi:</span>
                <select
                  value={config.extCase}
                  onChange={(e) => update({ extCase: e.target.value as any })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                >
                  <option value="keep">Giữ nguyên</option>
                  <option value="lower">chữ thường (.jpg, .pdf)</option>
                  <option value="upper">CHỮ HOA (.JPG, .PDF)</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="block text-slate-600 text-[11px] mb-1">
                  Đổi tất cả file thành đuôi này (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="vd: jpg hoặc mp4..."
                  value={config.setExt}
                  onChange={(e) => update({ setExt: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                />
              </div>

              {/* Ánh xạ đuôi */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
                <span className="font-medium text-slate-800 block">
                  Ánh xạ đổi đuôi (vd: jpeg &rarr; jpg)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Đuôi cũ (jpeg)..."
                    value={newExtMapFrom}
                    onChange={(e) => setNewExtMapFrom(e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-mono bg-white"
                  />
                  <span className="text-slate-400">&rarr;</span>
                  <input
                    type="text"
                    placeholder="Đuôi mới (jpg)..."
                    value={newExtMapTo}
                    onChange={(e) => setNewExtMapTo(e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddExtMap}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs"
                  >
                    Thêm
                  </button>
                </div>

                {config.extMappings.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {config.extMappings.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1 bg-white border border-slate-200 rounded text-xs font-mono"
                      >
                        <span>
                          .{m.from} &rarr; .{m.to}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtMap(i)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* An toàn & Xung đột */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                An toàn hệ điều hành & Xử lý trùng tên
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.windowsSafe}
                  onChange={(e) => update({ windowsSafe: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">
                  Chuẩn an toàn Windows (Lọc ký tự cấm &lt;&gt;:"/\|?*, tên cấm CON, PRN, NUL)
                </span>
              </label>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-700">Khi xảy ra trùng tên:</span>
                <select
                  value={config.onConflict}
                  onChange={(e) => update({ onConflict: e.target.value as any })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                >
                  <option value="number">Đổi tên tránh trùng (_1, _2...)</option>
                  <option value="skip">Bỏ qua mục bị trùng</option>
                  <option value="abort">Dừng toàn bộ quá trình</option>
                  <option value="overwrite">Ghi đè (nguy hiểm)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] mb-1">
                  Độ dài tối đa phần tên (cắt bớt nếu quá dài):
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Để trống nếu không giới hạn..."
                  value={config.maxLength || ''}
                  onChange={(e) =>
                    update({
                      maxLength: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BỘ LỌC TỆP */}
        {activeTab === 'filter' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 text-xs block">
                Phạm vi quét tệp
              </span>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700">Đối tượng xử lý:</span>
                <select
                  value={config.target}
                  onChange={(e) => update({ target: e.target.value as any })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800"
                >
                  <option value="files">Chỉ tệp tin (Files)</option>
                  <option value="dirs">Chỉ thư mục (Directories)</option>
                  <option value="both">Cả tệp tin và thư mục</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="block text-slate-600 text-[11px] mb-1">
                  Chỉ lọc các đuôi tệp (cách nhau dấu phẩy):
                </label>
                <input
                  type="text"
                  placeholder="vd: jpg, png, pdf (để trống = tất cả)"
                  value={config.onlyExt}
                  onChange={(e) => update({ onlyExt: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                />
              </div>

              <div className="pt-1">
                <label className="block text-slate-600 text-[11px] mb-1">
                  Lọc theo Regex tên tệp:
                </label>
                <input
                  type="text"
                  placeholder="vd: ^IMG_\d+ (chỉ tệp bắt đầu bằng IMG_)"
                  value={config.matchRegex}
                  onChange={(e) => update({ matchRegex: e.target.value })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.recursive}
                    onChange={(e) => update({ recursive: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">
                    Quét cả các thư mục con (Recursive)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeHidden}
                    onChange={(e) =>
                      update({ includeHidden: e.target.checked })
                    }
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700">
                    Bao gồm tệp và thư mục ẩn (bắt đầu bằng dấu '.')
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
