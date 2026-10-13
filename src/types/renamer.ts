export type TargetType = 'files' | 'dirs' | 'both';
export type UnicodeMode = 'none' | 'nfc' | 'nfd';
export type BracketKind = 'round' | 'square' | 'curly' | 'angle';
export type SpacesMode = 'keep' | 'underscore' | 'dash' | 'dot' | 'remove';
export type CaseMode = 'keep' | 'lower' | 'upper' | 'title' | 'sentence' | 'snake' | 'kebab' | 'camel' | 'pascal';
export type ParentPos = 'none' | 'prefix' | 'suffix';
export type DateSource = 'none' | 'today' | 'mtime' | 'ctime';
export type DatePos = 'prefix' | 'suffix';
export type NumberPos = 'prefix' | 'suffix' | 'replace';
export type SortMode = 'natural' | 'name' | 'mtime' | 'ctime' | 'size' | 'none';
export type ExtCaseMode = 'keep' | 'lower' | 'upper';
export type ConflictMode = 'number' | 'skip' | 'abort' | 'overwrite';
export type FsCaseInsensitive = 'auto' | 'yes' | 'no';

export interface RenameRuleConfig {
  // 1. Target & Filter
  target: TargetType;
  recursive: boolean;
  maxDepth: number | null;
  includeHidden: boolean;
  onlyExt: string; // comma separated: jpg,png
  matchGlob: string; // glob filter
  excludeGlob: string;
  matchRegex: string;

  // 2. Name Cleaning
  unicode: UnicodeMode;
  fullwidth: boolean; // Chuyển full-width (：？｜＂＊＜＞／＼ＡＢＣ) -> ASCII
  colonToDash: boolean; // Đổi dấu ':' và '：' thành ' - ', giữ nguyên giờ 10:30
  stripNumbering: boolean;
  removeBrackets: boolean;
  bracketKinds: BracketKind[];
  keepBracketContent: boolean;
  bracketMatchRegex: string;
  removeBefore: string;
  removeAfter: string;
  removeTextList: string[]; // text list to remove
  removeRegexList: string[];
  replacePairs: Array<{ from: string; to: string }>; // --sub and --replace
  charMaps: Array<{ from: string; to: string }>; // --map like tr (from => to)
  regexReplacePairs: Array<{ pattern: string; repl: string }>;
  ignoreCase: boolean;
  accentInsensitive: boolean;
  wholeWord: boolean;
  removeDigits: boolean;
  cutStart: number;
  cutEnd: number;
  charsToSpace: string;
  removeAccents: boolean;
  asciiOnly: boolean;
  removeSpecial: boolean;
  specialKeep: string; // extra characters to keep with -s
  specialKeepOnly: string | null; // overrides standard keep set if non-null
  specialReplace: string; // default ""
  spaces: SpacesMode;
  caseMode: CaseMode;
  collapseSeparators: boolean;

  // 3. Adding Info
  prefix: string;
  suffix: string;
  separator: string; // default "_"
  parentFolder: ParentPos;
  dateSource: DateSource;
  dateFormat: string; // default "%Y%m%d"
  datePos: DatePos;
  numbering: boolean;
  numberStart: number;
  numberStep: number;
  numberWidth: number; // 0 = auto
  numberPos: NumberPos;
  numberBase: string; // for replace mode, e.g. "Photo"
  numberPerDir: boolean;
  sortMode: SortMode;
  reverseSort: boolean;

  // 4. File Extension & Safety
  extCase: ExtCaseMode;
  setExt: string; // force extension
  extMappings: Array<{ from: string; to: string }>; // e.g. jpeg -> jpg
  maxLength: number | null;
  windowsSafe: boolean;
  illegalReplace: string; // default "-"
  onConflict: ConflictMode;
  conflictFormat: string; // default "_{n}"
  fsCaseInsensitive: FsCaseInsensitive;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  parentDir: string;
  isDir: boolean;
  size: number;
  mtime: number;
  ctime: number;
  rawFile?: File; // In browser, original File object if uploaded
  fileHandle?: any; // FileSystemFileHandle if picked via showDirectoryPicker
}

export interface DiffSegment {
  text: string;
  type: 'same' | 'added' | 'removed';
}

export interface RenameOp {
  item: FileItem;
  wantName: string;
  newName: string;
  skip: boolean;
  note: string;
  status: 'changed' | 'unchanged' | 'conflict' | 'skip';
  diff: DiffSegment[];
  excluded?: boolean; // user manual unchecked
  hasCollision?: boolean; // True if another file in the same folder wants or shares the same name
  isSevereDuplicate?: boolean; // True if newName is identical to another file's newName (OVERWRITE HAZARD!)
  collisionPeers?: string[]; // Names of the files it clashes with
}

export interface PlanResult {
  ops: RenameOp[];
  totalScanned: number;
  willChange: number;
  unchanged: number;
  skipped: number;
  conflicts: number;
  severeDuplicates: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  config: Partial<RenameRuleConfig>;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  totalFiles: number;
  successCount: number;
  failCount: number;
  configSnapshot: RenameRuleConfig;
  log: Array<{
    dir: string;
    old: string;
    new: string;
    status: 'ok' | 'fail' | 'skip';
    error?: string;
    note?: string;
  }>;
}
