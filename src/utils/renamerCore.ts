import {
  RenameRuleConfig,
  FileItem,
  RenameOp,
  PlanResult,
  DiffSegment,
  BracketKind,
} from '../types/renamer';

export const COMPOUND_EXTS = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tar.zst', '.tar.lz4', '.tar.z'];

export const WIN_RESERVED = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

export const SYSTEM_NAMES = new Set([
  '@eadir', '#recycle', '#snapshot', '.ds_store', 'thumbs.db', 'desktop.ini',
  '$recycle.bin', 'system volume information', '.trashes', '.spotlight-v100',
  '.fseventsd', '.git', '__macosx'
]);

export const BRACKET_PAIRS: Record<BracketKind, Array<[string, string]>> = {
  round: [['(', ')'], ['（', '）']],
  square: [['[', ']'], ['［', '］'], ['【', '】']],
  curly: [['{', '}'], ['｛', '｝']],
  angle: [['<', '>'], ['＜', '＞'], ['《', '》'], ['〈', '〉']],
};

export const TRANSLIT: Record<string, string> = {
  'ß': 'ss', 'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE', 'ø': 'o', 'Ø': 'O',
  'ł': 'l', 'Ł': 'L', 'þ': 'th', 'Þ': 'Th', 'ð': 'd', 'Ð': 'D'
};

export const NUMBERING_RE = /^\s*(?:[\(\[]\d{1,4}[\)\]]|\d{1,4}\s*[.)\-_])\s*[-_.]*\s*/;

// Unicode NFC
export function nfc(s: string): string {
  return s.normalize('NFC');
}

export function foldChar(ch: string): string {
  if (ch === 'đ') return 'd';
  if (ch === 'Đ') return 'D';
  // NFKD: ngoài bỏ dấu còn đưa ký tự full-width (： ？ ＡＢＣ) và dạng tương thích về ASCII
  const base = ch.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return base.length === 1 ? base : ch;
}

export function fold(s: string): string {
  return Array.from(nfc(s)).map(foldChar).join('');
}

export function fullwidthToAscii(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCharCode(code - 0xfee0);
    } else if (s.charAt(i) === '\u3000') {
      out += ' ';
    } else {
      out += s.charAt(i);
    }
  }
  return out;
}

export function colonToDash(s: string): string {
  return s.replace(/\s*[:：]\s*/g, (match, offset) => {
    const a = offset;
    const b = offset + match.length;
    if (a === 0 || b === s.length) {
      return '';
    }
    if (/\d/.test(s.charAt(a - 1)) && /\d/.test(s.charAt(b))) {
      return match;
    }
    return ' - ';
  });
}

export function applyCharMap(s: string, fromChars: string, toChars: string): string {
  if (!fromChars) return s;
  const map = new Map<string, string>();
  if (toChars === '') {
    for (const c of fromChars) map.set(c, '');
  } else if (toChars.length === 1) {
    for (const c of fromChars) map.set(c, toChars);
  } else if (toChars.length === fromChars.length) {
    for (let i = 0; i < fromChars.length; i++) {
      map.set(fromChars[i], toChars[i]);
    }
  } else {
    return s;
  }
  let out = '';
  for (const ch of s) {
    if (map.has(ch)) {
      out += map.get(ch) || '';
    } else {
      out += ch;
    }
  }
  return out;
}

export function stripAccents(s: string): string {
  let res = s.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  res = res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return nfc(res);
}

export function toAscii(s: string): string {
  const stripped = stripAccents(s);
  let out = '';
  for (const ch of stripped) {
    const t = TRANSLIT[ch] || ch;
    if (t.charCodeAt(0) < 128) {
      out += t;
    }
  }
  return out;
}

export function splitName(name: string, isDir: boolean): [string, string] {
  if (isDir) {
    return [name, ''];
  }
  const low = name.toLowerCase();
  for (const ce of COMPOUND_EXTS) {
    if (low.endsWith(ce) && name.length > ce.length) {
      return [name.slice(0, -ce.length), name.slice(-ce.length)];
    }
  }
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) {
    return [name, ''];
  }
  const ext = name.slice(lastDot);
  // Valid ext format check: 1 to 10 chars
  if (/^\.[A-Za-z0-9_+\-]{1,10}$/.test(ext)) {
    return [name.slice(0, lastDot), ext];
  }
  return [name, ''];
}

export function removeBrackets(
  s: string,
  kinds: BracketKind[],
  keepContent: boolean,
  matchRegex?: RegExp
): string {
  for (const kind of kinds) {
    const pairs = BRACKET_PAIRS[kind] || [];
    for (const [openB, closeB] of pairs) {
      const escO = escapeRegex(openB);
      const escC = escapeRegex(closeB);
      const pat = new RegExp(`${escO}[^${escO}${escC}]*${escC}`, 'g');

      let prev = '';
      while (prev !== s) {
        prev = s;
        s = s.replace(pat, (fullMatch) => {
          const inner = fullMatch.slice(openB.length, -closeB.length);
          if (matchRegex && !matchRegex.test(inner)) {
            return fullMatch;
          }
          return keepContent ? inner : '';
        });
      }
    }
  }
  return s;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyCase(s: string, mode: RenameRuleConfig['caseMode']): string {
  if (mode === 'keep') return s;
  if (mode === 'lower') return s.toLowerCase();
  if (mode === 'upper') return s.toUpperCase();
  if (mode === 'title') {
    return s.replace(/[^\W_]+(?:['’][^\W_]+)*/g, (m) => {
      return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
    });
  }
  if (mode === 'sentence') {
    const lower = s.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      if (/[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/.test(lower[i])) {
        return lower.slice(0, i) + lower[i].toUpperCase() + lower.slice(i + 1);
      }
    }
    return lower;
  }
  // split camelCase / PascalCase boundary
  const spaced = s.replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' ');
  const words = spaced.match(/[^\W_]+/g) || [];
  if (mode === 'snake') {
    return words.map((w) => w.toLowerCase()).join('_');
  }
  if (mode === 'kebab') {
    return words.map((w) => w.toLowerCase()).join('-');
  }
  const caps = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (mode === 'pascal') {
    return caps.join('');
  }
  if (mode === 'camel') {
    const firstWord = words[0];
    if (!firstWord) return '';
    return firstWord.toLowerCase() + caps.slice(1).join('');
  }
  return s;
}

export function removeSpecial(s: string, keepChars: string, replaceChar: string): string {
  let out = '';
  for (const ch of s) {
    // Unicode letter or number or mark or in keep list
    if (/[\p{L}\p{N}\p{M}]/u.test(ch) || keepChars.includes(ch)) {
      out += ch;
    } else {
      out += replaceChar;
    }
  }
  return out;
}

export function cleanStem(stem: string, config: RenameRuleConfig): string {
  let s = nfc(stem);
  const orig = s;

  if (config.fullwidth) {
    s = fullwidthToAscii(s);
  }

  if (config.colonToDash) {
    s = colonToDash(s);
  }

  if (config.stripNumbering) {
    s = s.replace(NUMBERING_RE, '');
  }

  if (config.removeBrackets && config.bracketKinds.length > 0) {
    let rx: RegExp | undefined;
    if (config.bracketMatchRegex.trim()) {
      try {
        rx = new RegExp(config.bracketMatchRegex.trim(), config.ignoreCase ? 'i' : '');
      } catch {
        rx = undefined;
      }
    }
    s = removeBrackets(s, config.bracketKinds, config.keepBracketContent, rx);
  }

  // Remove before
  if (config.removeBefore.trim()) {
    const target = config.removeBefore.trim();
    const flags = config.ignoreCase ? 'i' : '';
    let idx = -1;
    if (config.accentInsensitive) {
      const fS = fold(s);
      const fT = fold(target);
      const rx = new RegExp(escapeRegex(fT), flags);
      const match = rx.exec(fS);
      if (match) idx = match.index + match[0].length;
    } else {
      const rx = new RegExp(escapeRegex(target), flags);
      const match = rx.exec(s);
      if (match) idx = match.index + match[0].length;
    }
    if (idx !== -1) {
      s = s.slice(idx);
    }
  }

  // Remove after
  if (config.removeAfter.trim()) {
    const target = config.removeAfter.trim();
    const flags = config.ignoreCase ? 'i' : '';
    let idx = -1;
    if (config.accentInsensitive) {
      const fS = fold(s);
      const fT = fold(target);
      const rx = new RegExp(escapeRegex(fT), flags);
      const match = rx.exec(fS);
      if (match) idx = match.index;
    } else {
      const rx = new RegExp(escapeRegex(target), flags);
      const match = rx.exec(s);
      if (match) idx = match.index;
    }
    if (idx !== -1) {
      s = s.slice(0, idx);
    }
  }

  // Remove text list
  const textList = [...config.removeTextList].filter((t) => t.trim().length > 0);
  // longest first
  textList.sort((a, b) => b.length - a.length);
  for (const text of textList) {
    const flags = config.ignoreCase ? 'gi' : 'g';
    let patternStr = escapeRegex(config.accentInsensitive ? fold(text) : text);
    if (config.wholeWord) {
      patternStr = `(?<![^\\W_])${patternStr}(?![^\\W_])`;
    }
    try {
      const rx = new RegExp(patternStr, flags);
      if (config.accentInsensitive) {
        // fold-based replacement keeping unaccented indices
        const fS = fold(s);
        let match: RegExpExecArray | null;
        let lastIdx = 0;
        let out = '';
        while ((match = rx.exec(fS)) !== null) {
          out += s.slice(lastIdx, match.index);
          lastIdx = match.index + match[0].length;
        }
        out += s.slice(lastIdx);
        s = out;
      } else {
        s = s.replace(rx, '');
      }
    } catch {
      // ignore regex error
    }
  }

  // Remove regex list
  for (const pattern of config.removeRegexList) {
    if (!pattern.trim()) continue;
    try {
      const rx = new RegExp(pattern, config.ignoreCase ? 'gi' : 'g');
      s = s.replace(rx, '');
    } catch {
      // ignore
    }
  }

  // Replace pairs
  for (const { from, to } of config.replacePairs) {
    if (!from) continue;
    const flags = config.ignoreCase ? 'gi' : 'g';
    let patternStr = escapeRegex(config.accentInsensitive ? fold(from) : from);
    if (config.wholeWord) {
      patternStr = `(?<![^\\W_])${patternStr}(?![^\\W_])`;
    }
    try {
      const rx = new RegExp(patternStr, flags);
      if (config.accentInsensitive) {
        const fS = fold(s);
        let match: RegExpExecArray | null;
        let lastIdx = 0;
        let out = '';
        while ((match = rx.exec(fS)) !== null) {
          out += s.slice(lastIdx, match.index) + to;
          lastIdx = match.index + match[0].length;
        }
        out += s.slice(lastIdx);
        s = out;
      } else {
        s = s.replace(rx, to);
      }
    } catch {
      // ignore
    }
  }

  // Regex replace pairs
  for (const { pattern, repl } of config.regexReplacePairs) {
    if (!pattern) continue;
    try {
      const rx = new RegExp(pattern, config.ignoreCase ? 'gi' : 'g');
      s = s.replace(rx, repl);
    } catch {
      // ignore
    }
  }

  // Char map translation (--map like tr)
  for (const cm of config.charMaps || []) {
    if (cm.from) {
      s = applyCharMap(s, cm.from, cm.to);
    }
  }

  // Remove digits
  if (config.removeDigits) {
    s = s.replace(/\d+/g, '');
  }

  // Cut start / cut end
  if (config.cutStart > 0) {
    s = s.slice(config.cutStart);
  }
  if (config.cutEnd > 0) {
    s = config.cutEnd < s.length ? s.slice(0, -config.cutEnd) : '';
  }

  // Chars to space
  if (config.charsToSpace) {
    const chars = new Set(config.charsToSpace.split(''));
    s = Array.from(s).map((ch) => (chars.has(ch) ? ' ' : ch)).join('');
  }

  // Remove accents
  if (config.removeAccents || config.asciiOnly) {
    s = stripAccents(s);
  }
  if (config.asciiOnly) {
    s = toAscii(s);
  }

  const normWs =
    s !== orig ||
    config.removeSpecial ||
    config.spaces !== 'keep' ||
    config.collapseSeparators;

  if (normWs) {
    s = s.replace(/\s+/g, ' ');
  }

  if (config.removeSpecial) {
    const keep =
      config.specialKeepOnly !== null
        ? config.specialKeepOnly
        : ' -_.' + (config.specialKeep || '');
    s = removeSpecial(s, keep, config.specialReplace || '');
  }

  if (normWs) {
    s = s.replace(/\s+/g, ' ').trim();
  }

  if (config.spaces !== 'keep') {
    const spaceMap: Record<string, string> = {
      underscore: '_',
      dash: '-',
      dot: '.',
      remove: '',
    };
    const repl = spaceMap[config.spaces] ?? ' ';
    s = s.replace(/\s+/g, repl);
  }

  s = applyCase(s, config.caseMode);

  if (config.collapseSeparators) {
    // collapse double separators: __ -- ..
    s = s.replace(/([ _\-.])\1+/g, '$1');
    s = s.replace(/^[ _\-]+/, '').replace(/[ _\-.]+$/, '');
  }

  return normWs ? s.trim() : s;
}

export function fixExt(ext: string, isDir: boolean, config: RenameRuleConfig): string {
  if (isDir) return '';
  let e = ext.startsWith('.') ? ext.slice(1) : ext;

  // Extension mapping check (e.g. jpeg -> jpg)
  const low = e.toLowerCase();
  for (const map of config.extMappings) {
    const fromClean = map.from.trim().replace(/^\./, '').toLowerCase();
    const toClean = map.to.trim().replace(/^\./, '');
    if (low === fromClean) {
      e = toClean;
      break;
    }
  }

  if (config.extCase === 'lower') {
    e = e.toLowerCase();
  } else if (config.extCase === 'upper') {
    e = e.toUpperCase();
  }

  if (config.setExt.trim()) {
    e = config.setExt.trim().replace(/^\./, '');
  }

  return e ? `.${e}` : '';
}

export function sanitizeWindowsSafe(name: string, isDir: boolean, illegalRepl: string): string {
  // Disallow / and \x00
  let res = name.replace(/\//g, illegalRepl).replace(/\x00/g, '');
  // Windows forbidden chars: <>:"/\|?* and 0x00-0x1F
  res = res.replace(/[<>:"/\\|?*\x00-\x1f]/g, illegalRepl);
  // Windows forbids ending with dot or space
  res = res.replace(/[ .]+$/, '');

  const [stem, ext] = splitName(res, isDir);
  const baseUpper = stem.split('.')[0].toUpperCase();
  if (WIN_RESERVED.has(baseUpper)) {
    res = `${stem}_${ext}`;
  }
  return res;
}

export function formatDateToken(date: Date, fmt: string): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const Y = date.getFullYear();
  const y = String(Y).slice(-2);
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const H = pad(date.getHours());
  const M = pad(date.getMinutes());
  const S = pad(date.getSeconds());

  return fmt
    .replace(/%Y/g, String(Y))
    .replace(/%y/g, y)
    .replace(/%m/g, m)
    .replace(/%d/g, d)
    .replace(/%H/g, H)
    .replace(/%M/g, M)
    .replace(/%S/g, S);
}

export function naturalSortKey(s: string): Array<[number, string | number]> {
  const parts = s.split(/(\d+)/);
  return parts.map((part) => {
    if (/^\d+$/.test(part)) {
      return [0, parseInt(part, 10)];
    }
    return [1, part.toLowerCase()];
  });
}

export function compareNatural(a: string, b: string): number {
  const keyA = naturalSortKey(a);
  const keyB = naturalSortKey(b);
  const len = Math.max(keyA.length, keyB.length);
  for (let i = 0; i < len; i++) {
    const itemA = keyA[i];
    const itemB = keyB[i];
    if (!itemA) return -1;
    if (!itemB) return 1;
    if (itemA[0] !== itemB[0]) return itemA[0] - itemB[0];
    if (itemA[1] < itemB[1]) return -1;
    if (itemA[1] > itemB[1]) return 1;
  }
  return 0;
}

export function buildNewName(
  item: FileItem,
  config: RenameRuleConfig,
  parentName: string,
  dateStr: string,
  numStr: string
): string | null {
  const [stem, ext] = splitName(item.name, item.isDir);
  let core = cleanStem(stem, config);

  if (config.unicode === 'none' && core === nfc(stem)) {
    core = stem;
  }

  const left: string[] = [];
  const right: string[] = [];

  if (config.parentFolder !== 'none' && parentName) {
    if (config.parentFolder === 'prefix') {
      left.push(parentName);
    } else {
      right.push(parentName);
    }
  }

  if (dateStr) {
    if (config.datePos === 'prefix') {
      left.push(dateStr);
    } else {
      right.push(dateStr);
    }
  }

  if (numStr) {
    if (config.numberPos === 'replace') {
      core = (config.numberBase ? config.numberBase + config.separator : '') + numStr;
    } else if (config.numberPos === 'prefix') {
      left.push(numStr);
    } else {
      right.push(numStr);
    }
  }

  let parts = [...left, ...(core ? [core] : []), ...(right.length > 0 ? [...right].reverse() : [])];
  let newStem = config.prefix + parts.join(config.separator) + config.suffix;

  if (config.maxLength && config.maxLength > 0 && newStem.length > config.maxLength) {
    newStem = newStem.slice(0, config.maxLength).replace(/[ ._\-]+$/, '');
  }

  const newExt = fixExt(ext, item.isDir, config);
  if (!newStem) {
    return null;
  }

  let full = newStem + newExt;

  if (config.windowsSafe) {
    full = sanitizeWindowsSafe(full, item.isDir, config.illegalReplace || '-');
  }

  if (config.unicode === 'nfc') {
    full = nfc(full);
  } else if (config.unicode === 'nfd') {
    full = full.normalize('NFD');
  }

  return full || null;
}

// Compute diff between original string and new string
export function computeDiff(oldStr: string, newStr: string): DiffSegment[] {
  if (oldStr === newStr) {
    return [{ text: newStr, type: 'same' }];
  }
  // Simple prefix and suffix match
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }

  let oldEnd = oldStr.length - 1;
  let newEnd = newStr.length - 1;
  while (oldEnd >= start && newEnd >= start && oldStr[oldEnd] === newStr[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  const result: DiffSegment[] = [];
  if (start > 0) {
    result.push({ text: oldStr.slice(0, start), type: 'same' });
  }

  const removedPart = oldStr.slice(start, oldEnd + 1);
  const addedPart = newStr.slice(start, newEnd + 1);

  if (removedPart) {
    result.push({ text: removedPart, type: 'removed' });
  }
  if (addedPart) {
    result.push({ text: addedPart, type: 'added' });
  }

  if (oldStr.length - 1 > oldEnd) {
    result.push({ text: oldStr.slice(oldEnd + 1), type: 'same' });
  }

  return result;
}

export function buildPlan(
  items: FileItem[],
  config: RenameRuleConfig,
  isCiFs = true,
  excludedIds?: Set<string>
): PlanResult {
  // 1. Filter items based on configuration
  const onlyExts = config.onlyExt
    ? new Set(
        config.onlyExt
          .split(',')
          .map((e) => e.trim().replace(/^\./, '').toLowerCase())
          .filter(Boolean)
      )
    : null;

  let rxMatch: RegExp | null = null;
  if (config.matchRegex.trim()) {
    try {
      rxMatch = new RegExp(config.matchRegex.trim());
    } catch {
      rxMatch = null;
    }
  }

  const filteredItems = items.filter((item) => {
    // System name filtering
    if (SYSTEM_NAMES.has(item.name.toLowerCase())) return false;
    if (item.name.startsWith('.') && !config.includeHidden) return false;

    // Target type
    if (item.isDir && config.target === 'files') return false;
    if (!item.isDir && config.target === 'dirs') return false;

    // Extension filter
    if (onlyExts && !item.isDir) {
      const low = item.name.toLowerCase();
      let match = false;
      for (const ext of onlyExts) {
        if (low.endsWith(`.${ext}`)) {
          match = true;
          break;
        }
      }
      if (!match) return false;
    }

    // Regex match
    if (rxMatch && !rxMatch.test(item.name)) {
      return false;
    }

    return true;
  });

  // 2. Sort items
  const sorted = [...filteredItems].sort((a, b) => {
    // Parent group first
    const pCmp = compareNatural(a.parentDir, b.parentDir);
    if (pCmp !== 0) return pCmp;

    if (config.sortMode === 'natural') {
      const cmp = compareNatural(a.name, b.name);
      return config.reverseSort ? -cmp : cmp;
    }
    if (config.sortMode === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return config.reverseSort ? -cmp : cmp;
    }
    if (config.sortMode === 'mtime') {
      const cmp = (a.mtime || 0) - (b.mtime || 0);
      return config.reverseSort ? -cmp : cmp;
    }
    if (config.sortMode === 'ctime') {
      const cmp = (a.ctime || 0) - (b.ctime || 0);
      return config.reverseSort ? -cmp : cmp;
    }
    if (config.sortMode === 'size') {
      const cmp = (a.size || 0) - (b.size || 0);
      return config.reverseSort ? -cmp : cmp;
    }
    return 0;
  });

  // 3. Count items per folder for numbering padding
  const groupCount: Record<string, number> = {};
  for (const it of sorted) {
    const gk = config.numberPerDir ? it.parentDir : '__all__';
    groupCount[gk] = (groupCount[gk] || 0) + 1;
  }
  const counters: Record<string, number> = {};

  const preliminaryOps: Array<{
    item: FileItem;
    want: string;
    skip: boolean;
    note: string;
  }> = [];

  let unchangedCount = 0;

  for (const it of sorted) {
    let numStr = '';
    if (config.numbering) {
      const gk = config.numberPerDir ? it.parentDir : '__all__';
      const idx = counters[gk] || 0;
      counters[gk] = idx + 1;
      const val = config.numberStart + idx * config.numberStep;
      const last = config.numberStart + ((groupCount[gk] || 1) - 1) * config.numberStep;
      const width =
        config.numberWidth > 0
          ? config.numberWidth
          : Math.max(
              String(val).length,
              String(last).length,
              String(config.numberStart).length
            );
      numStr = String(val).padStart(width, '0');
    }

    let dateStr = '';
    if (config.dateSource !== 'none') {
      let ts = new Date();
      if (config.dateSource === 'mtime' && it.mtime) {
        ts = new Date(it.mtime);
      } else if (config.dateSource === 'ctime' && it.ctime) {
        ts = new Date(it.ctime);
      }
      dateStr = formatDateToken(ts, config.dateFormat || '%Y%m%d');
    }

    const parentBaseName = it.parentDir.split(/[/\\]/).filter(Boolean).pop() || '';
    const newName = buildNewName(it, config, parentBaseName, dateStr, numStr);

    if (excludedIds && excludedIds.has(it.id)) {
      preliminaryOps.push({
        item: it,
        want: it.name,
        skip: true,
        note: 'Đã bỏ chọn',
      });
      continue;
    }

    if (newName === null) {
      preliminaryOps.push({
        item: it,
        want: it.name,
        skip: true,
        note: 'Tên mới bị rỗng',
      });
    } else if (newName === it.name) {
      unchangedCount++;
      preliminaryOps.push({
        item: it,
        want: newName,
        skip: false,
        note: 'Không có thay đổi',
      });
    } else {
      preliminaryOps.push({
        item: it,
        want: newName,
        skip: false,
        note: '',
      });
    }
  }

  // 4. Resolve conflicts per directory
  const keyFn = (s: string) => (isCiFs ? s.toLowerCase() : s);
  const byDir: Record<string, typeof preliminaryOps> = {};
  for (const op of preliminaryOps) {
    const dir = op.item.parentDir;
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(op);
  }

  const finalOps: RenameOp[] = [];
  let conflictCount = 0;
  let skippedCount = 0;
  let willChangeCount = 0;

  for (const dir in byDir) {
    const dirOps = byDir[dir];
    const planned = new Set<string>();

    for (const op of dirOps) {
      if (op.skip) {
        skippedCount++;
        finalOps.push({
          item: op.item,
          wantName: op.want,
          newName: op.want,
          skip: true,
          excluded: Boolean(excludedIds?.has(op.item.id)),
          note: op.note,
          status: 'skip',
          diff: computeDiff(op.item.name, op.want),
        });
        continue;
      }

      let cand = op.want;
      let k = keyFn(cand);
      let isConflict = false;

      if (planned.has(k)) {
        isConflict = true;
        conflictCount++;
        if (config.onConflict === 'abort') {
          finalOps.push({
            item: op.item,
            wantName: op.want,
            newName: cand,
            skip: true,
            note: 'Xung đột trùng tên (chế độ Dừng)',
            status: 'conflict',
            diff: computeDiff(op.item.name, cand),
          });
          skippedCount++;
          continue;
        } else if (config.onConflict === 'skip') {
          finalOps.push({
            item: op.item,
            wantName: op.want,
            newName: op.item.name,
            skip: true,
            note: 'Trùng tên trong đợt đổi (bỏ qua)',
            status: 'conflict',
            diff: computeDiff(op.item.name, op.item.name),
          });
          skippedCount++;
          continue;
        } else if (config.onConflict === 'number') {
          // generate unique name
          const [stem, ext] = splitName(cand, op.item.isDir);
          let n = 1;
          const fmt = config.conflictFormat || '_{n}';
          while (true) {
            const numPart = fmt.replace('{n}', String(n));
            const testName = `${stem}${numPart}${ext}`;
            if (!planned.has(keyFn(testName))) {
              cand = testName;
              k = keyFn(cand);
              break;
            }
            n++;
          }
        }
      }

      planned.add(k);

      if (cand === op.item.name) {
        finalOps.push({
          item: op.item,
          wantName: op.want,
          newName: cand,
          skip: false,
          note: 'Không đổi',
          status: 'unchanged',
          diff: [{ text: cand, type: 'same' }],
        });
      } else {
        willChangeCount++;
        finalOps.push({
          item: op.item,
          wantName: op.want,
          newName: cand,
          skip: false,
          note: isConflict ? 'Đổi tên tránh trùng' : '',
          status: isConflict ? 'conflict' : 'changed',
          diff: computeDiff(op.item.name, cand),
        });
      }
    }
  }

  // 5. Post-pass: Detect all duplicate filename collisions (OVERWRITE HAZARDS)
  // Group by (parentDir, keyFn(newName)) among active operations
  const newNameGroups = new Map<string, RenameOp[]>();
  const wantNameGroups = new Map<string, RenameOp[]>();

  for (const op of finalOps) {
    if (op.skip || op.excluded) continue;
    const dir = op.item.parentDir;
    const newKey = `${dir}:::${keyFn(op.newName)}`;
    const wantKey = `${dir}:::${keyFn(op.wantName)}`;

    if (!newNameGroups.has(newKey)) newNameGroups.set(newKey, []);
    newNameGroups.get(newKey)!.push(op);

    if (!wantNameGroups.has(wantKey)) wantNameGroups.set(wantKey, []);
    wantNameGroups.get(wantKey)!.push(op);
  }

  let severeDuplicatesCount = 0;

  for (const [, group] of newNameGroups.entries()) {
    if (group.length > 1) {
      severeDuplicatesCount += group.length;
      const allNames = group.map((g) => g.item.name);
      for (const op of group) {
        op.isSevereDuplicate = true;
        op.hasCollision = true;
        op.status = 'conflict';
        op.collisionPeers = allNames.filter((n) => n !== op.item.name);
        op.note = `Trùng tên mới "${op.newName}" với ${op.collisionPeers.length} tệp khác (nguy cơ ghi đè!)`;
      }
    }
  }

  for (const [, group] of wantNameGroups.entries()) {
    if (group.length > 1) {
      const allNames = group.map((g) => g.item.name);
      for (const op of group) {
        op.hasCollision = true;
        if (!op.collisionPeers) {
          op.collisionPeers = allNames.filter((n) => n !== op.item.name);
        }
      }
    }
  }

  return {
    ops: finalOps,
    totalScanned: items.length,
    willChange: willChangeCount,
    unchanged: unchangedCount,
    skipped: skippedCount,
    conflicts: conflictCount,
    severeDuplicates: severeDuplicatesCount,
  };
}

// Generate Equivalent CLI Command for python script
export function generateCliCommand(config: RenameRuleConfig, targetPath = '.'): string {
  const parts: string[] = ['python rename_files.py', `"${targetPath}"`];

  if (config.recursive) parts.push('-r');
  if (config.maxDepth !== null && config.maxDepth !== undefined) parts.push(`--max-depth ${config.maxDepth}`);
  if (config.target !== 'files') parts.push(`-t ${config.target}`);
  if (config.includeHidden) parts.push('--hidden');
  if (config.onlyExt) parts.push(`-e "${config.onlyExt}"`);
  if (config.matchRegex) parts.push(`--match-regex "${config.matchRegex}"`);

  if (config.unicode !== 'none') parts.push(`--unicode ${config.unicode}`);
  if (config.fullwidth) parts.push('--fullwidth');
  if (config.colonToDash) parts.push('--colon-to-dash');
  if (config.stripNumbering) parts.push('--strip-numbering');
  if (config.removeBrackets && config.bracketKinds.length > 0) {
    parts.push(`-b ${config.bracketKinds.join(',')}`);
    if (config.keepBracketContent) parts.push('--keep-bracket-content');
    if (config.bracketMatchRegex) parts.push(`--bracket-match "${config.bracketMatchRegex}"`);
  }
  if (config.removeBefore) parts.push(`--remove-before "${config.removeBefore}"`);
  if (config.removeAfter) parts.push(`--remove-after "${config.removeAfter}"`);

  for (const text of config.removeTextList) {
    if (text) parts.push(`-w "${text}"`);
  }
  for (const regex of config.removeRegexList) {
    if (regex) parts.push(`--remove-regex "${regex}"`);
  }
  for (const { from, to } of config.replacePairs) {
    if (from) parts.push(`--sub "${from}=>${to}"`);
  }
  // ponytail: charMaps / specialKeepOnly / numberPerDir / onConflict không emit vào CLI
  // vì rename_files.py (portableAssets.PYTHON_SCRIPT_CODE) không có argparse tương ứng.
  // Nếu thêm flag vào Python thì emit lại tại đây.
  for (const { pattern, repl } of config.regexReplacePairs) {
    if (pattern) parts.push(`--regex-replace "${pattern}" "${repl}"`);
  }

  if (config.ignoreCase) parts.push('-i');
  if (config.accentInsensitive) parts.push('-A');
  if (config.wholeWord) parts.push('--whole-word');
  if (config.removeDigits) parts.push('--remove-digits');
  if (config.cutStart > 0) parts.push(`--cut-start ${config.cutStart}`);
  if (config.cutEnd > 0) parts.push(`--cut-end ${config.cutEnd}`);
  if (config.charsToSpace) parts.push(`--chars-to-space "${config.charsToSpace}"`);
  if (config.removeAccents) parts.push('-a');
  if (config.asciiOnly) parts.push('--ascii');
  if (config.removeSpecial) {
    parts.push('-s');
    if (config.specialKeep) parts.push(`--special-keep="${config.specialKeep}"`);
    if (config.specialReplace) parts.push(`--special-replace="${config.specialReplace}"`);
  }
  if (config.spaces !== 'keep') parts.push(`--spaces ${config.spaces}`);
  if (config.caseMode !== 'keep') parts.push(`--case ${config.caseMode}`);
  if (config.collapseSeparators) parts.push('--collapse-separators');

  if (config.prefix) parts.push(`--prefix "${config.prefix}"`);
  if (config.suffix) parts.push(`--suffix "${config.suffix}"`);
  if (config.separator !== '_') parts.push(`--sep "${config.separator}"`);
  if (config.parentFolder !== 'none') parts.push(`--parent ${config.parentFolder}`);
  if (config.dateSource !== 'none') {
    parts.push(`--date ${config.dateSource}`);
    if (config.dateFormat !== '%Y%m%d') parts.push(`--date-format "${config.dateFormat}"`);
    if (config.datePos !== 'prefix') parts.push(`--date-pos ${config.datePos}`);
  }
  if (config.numbering) {
    parts.push('--number');
    if (config.numberStart !== 1) parts.push(`--number-start ${config.numberStart}`);
    if (config.numberStep !== 1) parts.push(`--number-step ${config.numberStep}`);
    if (config.numberWidth > 0) parts.push(`--number-width ${config.numberWidth}`);
    if (config.numberPos !== 'prefix') parts.push(`--number-pos ${config.numberPos}`);
    if (config.numberBase) parts.push(`--number-base "${config.numberBase}"`);
    if (config.sortMode !== 'natural') parts.push(`--sort ${config.sortMode}`);
    if (config.reverseSort) parts.push('--reverse');
  }

  if (config.extCase !== 'keep') parts.push(`--ext ${config.extCase}`);
  if (config.setExt) parts.push(`--set-ext "${config.setExt}"`);
  for (const map of config.extMappings) {
    if (map.from && map.to) parts.push(`--ext-map ${map.from}=${map.to}`);
  }
  if (config.maxLength) parts.push(`--max-length ${config.maxLength}`);
  if (config.windowsSafe) parts.push('--windows-safe');

  return parts.join(' ');
}
