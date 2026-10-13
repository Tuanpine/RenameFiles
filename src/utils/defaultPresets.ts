import { RenameRuleConfig, Preset } from '../types/renamer';

export const DEFAULT_CONFIG: RenameRuleConfig = {
  // 1. Target & Filter
  target: 'files',
  recursive: false,
  maxDepth: null,
  includeHidden: false,
  onlyExt: '',
  matchGlob: '',
  excludeGlob: '',
  matchRegex: '',

  // 2. Name Cleaning
  unicode: 'none',
  fullwidth: false,
  colonToDash: false,
  stripNumbering: false,
  removeBrackets: false,
  bracketKinds: ['round', 'square', 'curly'],
  keepBracketContent: false,
  bracketMatchRegex: '',
  removeBefore: '',
  removeAfter: '',
  removeTextList: [],
  removeRegexList: [],
  replacePairs: [],
  charMaps: [],
  regexReplacePairs: [],
  ignoreCase: true,
  accentInsensitive: true,
  wholeWord: false,
  removeDigits: false,
  cutStart: 0,
  cutEnd: 0,
  charsToSpace: '',
  removeAccents: false,
  asciiOnly: false,
  removeSpecial: false,
  specialKeep: '',
  specialKeepOnly: null,
  specialReplace: '',
  spaces: 'keep',
  caseMode: 'keep',
  collapseSeparators: true,

  // 3. Adding Info
  prefix: '',
  suffix: '',
  separator: '_',
  parentFolder: 'none',
  dateSource: 'none',
  dateFormat: '%Y%m%d',
  datePos: 'prefix',
  numbering: false,
  numberStart: 1,
  numberStep: 1,
  numberWidth: 0,
  numberPos: 'prefix',
  numberBase: '',
  numberPerDir: false,
  sortMode: 'natural',
  reverseSort: false,

  // 4. File Extension & Safety
  extCase: 'keep',
  setExt: '',
  extMappings: [],
  maxLength: null,
  windowsSafe: true,
  illegalReplace: '-',
  onConflict: 'number',
  conflictFormat: '_{n}',
  fsCaseInsensitive: 'auto',
};

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'clean',
    name: 'Clean Standard',
    description: 'Full-width sang ASCII, bỏ dấu tiếng Việt, ký tự lạ, space thành gạch dưới, chữ thường, gộp dấu trùng.',
    isBuiltIn: true,
    config: {
      fullwidth: true,
      removeAccents: true,
      removeSpecial: true,
      spaces: 'underscore',
      collapseSeparators: true,
      caseMode: 'lower',
      windowsSafe: true,
    },
  },
  {
    id: 'slug',
    name: 'URL / Web Slug',
    description: 'Tối ưu cho website & URL: full-width sang ASCII, chữ thường, gạch ngang (-), không dấu, không ký tự đặc biệt.',
    isBuiltIn: true,
    config: {
      fullwidth: true,
      removeAccents: true,
      removeSpecial: true,
      spaces: 'dash',
      collapseSeparators: true,
      caseMode: 'lower',
      extCase: 'lower',
      windowsSafe: true,
    },
  },
  {
    id: 'tidy',
    name: 'Tidy & Unicode',
    description: 'Chuẩn hóa Unicode NFC (sửa lỗi gõ macOS), gộp khoảng trắng thừa và dấu phân cách lặp.',
    isBuiltIn: true,
    config: {
      unicode: 'nfc',
      collapseSeparators: true,
      windowsSafe: true,
    },
  },
  {
    id: 'windows-safe',
    name: 'Windows Safety',
    description: 'Full-width sang ASCII, bỏ ký tự cấm Windows (<>:\"/\\|?*), lọc tên bảo lưu CON, PRN, AUX, NUL.',
    isBuiltIn: true,
    config: {
      fullwidth: true,
      windowsSafe: true,
      illegalReplace: '-',
      unicode: 'nfc',
    },
  },
  {
    id: 'photo-sequence',
    name: 'Sắp xếp ảnh Photo_001',
    description: 'Đánh số thứ tự 3 chữ số Photo_001, Photo_002... sắp theo thời gian hoặc tên.',
    isBuiltIn: true,
    config: {
      numbering: true,
      numberPos: 'replace',
      numberBase: 'Photo',
      numberStart: 1,
      numberWidth: 3,
      sortMode: 'natural',
      extCase: 'lower',
      windowsSafe: true,
    },
  },
  {
    id: 'episode-organizer',
    name: 'Tập phim / Anime Organizer',
    description: 'Xóa tên nhóm sub trong ngoặc vuông [ ], xóa độ phân giải (1080p, 720p), làm sạch tên.',
    isBuiltIn: true,
    config: {
      removeBrackets: true,
      bracketKinds: ['square'],
      keepBracketContent: false,
      removeTextList: ['1080p', '720p', 'web-dl', 'x264', 'x265', 'h264'],
      spaces: 'underscore',
      collapseSeparators: true,
    },
  },
  {
    id: 'vietnamese-standard',
    name: 'Chuẩn hóa Tiếng Việt',
    description: 'Chuẩn hóa Unicode NFC, viết hoa chữ cái đầu mỗi từ (Title Case), giữ nguyên dấu.',
    isBuiltIn: true,
    config: {
      unicode: 'nfc',
      caseMode: 'title',
      collapseSeparators: true,
      windowsSafe: true,
    },
  },
];

const PRESETS_STORAGE_KEY = 'batch_renamer_saved_presets_v1';

export function getSavedPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return BUILTIN_PRESETS;
    const userPresets: Preset[] = JSON.parse(raw);
    return [...BUILTIN_PRESETS, ...userPresets];
  } catch {
    return BUILTIN_PRESETS;
  }
}

export function saveUserPreset(preset: Omit<Preset, 'id' | 'isBuiltIn'>): Preset {
  const newPreset: Preset = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...preset,
    isBuiltIn: false,
  };
  const current = getSavedPresets().filter((p) => !p.isBuiltIn);
  current.push(newPreset);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(current));
  return newPreset;
}

export function deleteUserPreset(id: string): void {
  const current = getSavedPresets().filter((p) => !p.isBuiltIn && p.id !== id);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(current));
}
