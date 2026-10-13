import React from 'react';
import { RenameRuleConfig } from '../types/renamer';
import { Zap, X, RotateCcw } from 'lucide-react';

interface ActiveRulesBarProps {
  config: RenameRuleConfig;
  onChangeConfig: (newConfig: RenameRuleConfig) => void;
  onReset: () => void;
}

interface ActiveRuleTag {
  id: string;
  label: string;
  clear: () => void;
}

export const ActiveRulesBar: React.FC<ActiveRulesBarProps> = ({
  config,
  onChangeConfig,
  onReset,
}) => {
  const update = (partial: Partial<RenameRuleConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const activeRules: ActiveRuleTag[] = [];

  if (config.removeAccents) {
    activeRules.push({
      id: 'removeAccents',
      label: 'Bỏ dấu tiếng Việt',
      clear: () => update({ removeAccents: false }),
    });
  }

  if (config.asciiOnly) {
    activeRules.push({
      id: 'asciiOnly',
      label: 'ASCII thuần',
      clear: () => update({ asciiOnly: false }),
    });
  }

  if (config.unicode !== 'none') {
    activeRules.push({
      id: 'unicode',
      label: `Unicode ${config.unicode.toUpperCase()}`,
      clear: () => update({ unicode: 'none' }),
    });
  }

  if (config.stripNumbering) {
    activeRules.push({
      id: 'stripNumbering',
      label: 'Xóa số thứ tự đầu',
      clear: () => update({ stripNumbering: false }),
    });
  }

  if (config.removeBrackets) {
    activeRules.push({
      id: 'removeBrackets',
      label: `Xóa ngoặc ${config.keepBracketContent ? '(giữ nội dung)' : ''}`,
      clear: () => update({ removeBrackets: false }),
    });
  }

  if (config.removeTextList.length > 0) {
    activeRules.push({
      id: 'removeTextList',
      label: `Xóa ${config.removeTextList.length} từ khóa`,
      clear: () => update({ removeTextList: [] }),
    });
  }

  if (config.replacePairs.length > 0) {
    activeRules.push({
      id: 'replacePairs',
      label: `Thay ${config.replacePairs.length} cặp chuỗi`,
      clear: () => update({ replacePairs: [] }),
    });
  }

  if ((config.regexReplacePairs || []).length > 0) {
    activeRules.push({
      id: 'regexReplace',
      label: `Regex: ${config.regexReplacePairs.length} quy tắc`,
      clear: () => update({ regexReplacePairs: [] }),
    });
  }

  if ((config.charMaps || []).length > 0) {
    activeRules.push({
      id: 'charMaps',
      label: `Ánh xạ ký tự (${config.charMaps.length})`,
      clear: () => update({ charMaps: [] }),
    });
  }

  if (config.fullwidth) {
    activeRules.push({
      id: 'fullwidth',
      label: 'Full-width → ASCII',
      clear: () => update({ fullwidth: false }),
    });
  }

  if (config.colonToDash) {
    activeRules.push({
      id: 'colonToDash',
      label: "Đổi ':' → ' - '",
      clear: () => update({ colonToDash: false }),
    });
  }

  if (config.removeBefore) {
    activeRules.push({
      id: 'removeBefore',
      label: `Cắt trước "${config.removeBefore}"`,
      clear: () => update({ removeBefore: '' }),
    });
  }

  if (config.removeAfter) {
    activeRules.push({
      id: 'removeAfter',
      label: `Cắt sau "${config.removeAfter}"`,
      clear: () => update({ removeAfter: '' }),
    });
  }

  if (config.caseMode !== 'keep') {
    const caseLabels: Record<string, string> = {
      lower: 'chữ thường',
      upper: 'CHỮ HOA',
      title: 'Viết Hoa Đầu Từ',
      sentence: 'Viết hoa đầu câu',
      snake: 'snake_case',
      kebab: 'kebab-case',
      camel: 'camelCase',
      pascal: 'PascalCase',
    };
    activeRules.push({
      id: 'caseMode',
      label: `Kiểu chữ: ${caseLabels[config.caseMode] || config.caseMode}`,
      clear: () => update({ caseMode: 'keep' }),
    });
  }

  if (config.spaces !== 'keep') {
    const spaceLabels: Record<string, string> = {
      underscore: 'Space &rarr; _',
      dash: 'Space &rarr; -',
      dot: 'Space &rarr; .',
      remove: 'Xóa space',
    };
    activeRules.push({
      id: 'spaces',
      label: spaceLabels[config.spaces] || config.spaces,
      clear: () => update({ spaces: 'keep' }),
    });
  }

  if (config.removeSpecial) {
    activeRules.push({
      id: 'removeSpecial',
      label: 'Xóa ký tự đặc biệt',
      clear: () => update({ removeSpecial: false }),
    });
  }

  if (config.removeDigits) {
    activeRules.push({
      id: 'removeDigits',
      label: 'Xóa chữ số',
      clear: () => update({ removeDigits: false }),
    });
  }

  if (config.prefix) {
    activeRules.push({
      id: 'prefix',
      label: `Tiền tố: "${config.prefix}"`,
      clear: () => update({ prefix: '' }),
    });
  }

  if (config.suffix) {
    activeRules.push({
      id: 'suffix',
      label: `Hậu tố: "${config.suffix}"`,
      clear: () => update({ suffix: '' }),
    });
  }

  if (config.numbering) {
    activeRules.push({
      id: 'numbering',
      label: `Đánh số thứ tự (từ ${config.numberStart})`,
      clear: () => update({ numbering: false }),
    });
  }

  if (config.dateSource !== 'none') {
    activeRules.push({
      id: 'dateSource',
      label: `Chèn ngày (${config.dateSource})`,
      clear: () => update({ dateSource: 'none' }),
    });
  }

  if (config.parentFolder !== 'none') {
    activeRules.push({
      id: 'parentFolder',
      label: `Thêm thư mục cha (${config.parentFolder})`,
      clear: () => update({ parentFolder: 'none' }),
    });
  }

  if (config.extCase !== 'keep') {
    activeRules.push({
      id: 'extCase',
      label: `Đuôi: ${config.extCase === 'lower' ? '.ext thường' : '.EXT HOA'}`,
      clear: () => update({ extCase: 'keep' }),
    });
  }

  if (config.extMappings.length > 0) {
    activeRules.push({
      id: 'extMappings',
      label: `Đổi đuôi (${config.extMappings.length} quy tắc)`,
      clear: () => update({ extMappings: [] }),
    });
  }

  if (config.windowsSafe) {
    activeRules.push({
      id: 'windowsSafe',
      label: 'An toàn Windows Safe',
      clear: () => update({ windowsSafe: false }),
    });
  }

  if (config.collapseSeparators) {
    activeRules.push({
      id: 'collapseSeparators',
      label: 'Gộp dấu phân cách trùng',
      clear: () => update({ collapseSeparators: false }),
    });
  }

  if (activeRules.length === 0) {
    return (
      <div className="px-4 sm:px-6 py-2 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-slate-400" />
          <span>Chưa bật quy tắc nào. Chọn một mẫu sẵn (Preset) hoặc cài đặt ở cột bên trái để bắt đầu đổi tên.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-2 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        <span className="font-semibold text-slate-700 flex items-center gap-1 shrink-0 mr-1 text-[11px]">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>{activeRules.length} quy tắc đang bật:</span>
        </span>
        {activeRules.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-md text-[11px] shadow-2xs"
          >
            <span dangerouslySetInnerHTML={{ __html: r.label }} />
            <button
              onClick={r.clear}
              className="text-slate-400 hover:text-rose-600 rounded-xs transition-colors ml-0.5"
              title="Tắt quy tắc này"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <button
        onClick={onReset}
        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors whitespace-nowrap shrink-0"
        title="Đặt lại tất cả các quy tắc về mặc định"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Đặt lại</span>
      </button>
    </div>
  );
};
