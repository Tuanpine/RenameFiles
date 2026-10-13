import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_CONFIG } from '../src/utils/defaultPresets.ts';
import { buildPlan, generateCliCommand } from '../src/utils/renamerCore.ts';
import {
  PYTHON_SCRIPT_CODE,
  ELECTRON_MAIN_JS,
  ELECTRON_PRELOAD_JS,
  ELECTRON_PACKAGE_JSON,
} from '../src/utils/portableAssets.ts';
import type { FileItem, RenameRuleConfig } from '../src/types/renamer.ts';

const makeItem = (name: string, parentDir = 'root'): FileItem => ({
  id: `id_${parentDir}_${name}`,
  name,
  path: `${parentDir}/${name}`,
  parentDir,
  isDir: false,
  size: 0,
  mtime: 0,
  ctime: 0,
});

const makeConfig = (overrides: Partial<RenameRuleConfig> = {}): RenameRuleConfig => ({
  ...DEFAULT_CONFIG,
  ...overrides,
});

// Hai tệp "a (1).txt" / "a (2).txt" sau khi xóa ngoặc đều muốn thành "a.txt"
const bracketClean = {
  removeBrackets: true,
  bracketKinds: ['round' as const],
  keepBracketContent: false,
};

test('onConflict=overwrite: trùng tên mới bị đánh dấu severeDuplicate (nguy cơ ghi đè)', () => {
  const items = [makeItem('a (1).txt'), makeItem('a (2).txt')];
  const plan = buildPlan(items, makeConfig({ ...bracketClean, onConflict: 'overwrite' }));

  // Cả hai vẫn "sẽ đổi" nhưng bị đánh dấu severeDuplicate để UI chặn/cảnh báo
  assert.equal(plan.severeDuplicates, 2);
  assert.equal(plan.willChange, 2);
  for (const op of plan.ops) {
    assert.equal(op.status, 'conflict');
    assert.equal(op.isSevereDuplicate, true);
    assert.equal(op.newName, 'a.txt');
    assert.ok(op.collisionPeers && op.collisionPeers.length === 1);
  }
});

test('onConflict=number: tệp trùng được đánh số lại, không còn severeDuplicate', () => {
  const items = [makeItem('a (1).txt'), makeItem('a (2).txt'), makeItem('a (3).txt')];
  const plan = buildPlan(items, makeConfig({ ...bracketClean, onConflict: 'number' }));

  assert.equal(plan.severeDuplicates, 0);
  assert.equal(plan.willChange, 3);
  const names = plan.ops.map((op) => op.newName);
  assert.deepEqual(names, ['a.txt', 'a_1.txt', 'a_2.txt']);
  assert.equal(plan.ops[1].status, 'conflict');
  assert.equal(plan.ops[1].note, 'Đổi tên tránh trùng');
});

test('onConflict=skip: tệp trùng giữ nguyên tên và bị đánh dấu bỏ qua', () => {
  const items = [makeItem('a (1).txt'), makeItem('a (2).txt')];
  const plan = buildPlan(items, makeConfig({ ...bracketClean, onConflict: 'skip' }));

  assert.equal(plan.willChange, 1);
  assert.equal(plan.skipped, 1);
  assert.equal(plan.conflicts, 1);
  const skippedOp = plan.ops.find((op) => op.skip)!;
  assert.equal(skippedOp.newName, 'a (2).txt');
  assert.equal(skippedOp.status, 'conflict');
});

test('onConflict=abort: tệp trùng bị dừng, tệp đầu vẫn đổi', () => {
  const items = [makeItem('a (1).txt'), makeItem('a (2).txt')];
  const plan = buildPlan(items, makeConfig({ ...bracketClean, onConflict: 'abort' }));

  assert.equal(plan.willChange, 1);
  assert.equal(plan.ops[0].newName, 'a.txt');
  const stopped = plan.ops[1];
  assert.equal(stopped.skip, true);
  assert.equal(stopped.status, 'conflict');
  assert.equal(stopped.note, 'Xung đột trùng tên (chế độ Dừng)');
});

test('CIFS case-insensitive: "B.txt" và "b.txt" xung đột khi isCiFs, không xung đột khi case-sensitive', () => {
  const items = [makeItem('B (x).txt'), makeItem('b (y).txt')];
  const config = makeConfig({ ...bracketClean, onConflict: 'number', caseMode: 'keep' });

  const cifPlan = buildPlan(items, config, true);
  assert.equal(cifPlan.conflicts, 1);

  const csPlan = buildPlan(items, config, false);
  assert.equal(csPlan.conflicts, 0);
  assert.equal(csPlan.willChange, 2);
});

test('excludedIds: tệp bị bỏ chọn không đổi tên và không tính vào willChange', () => {
  const items = [makeItem('keep.txt'), makeItem('a (1).txt'), makeItem('a (2).txt')];
  const excluded = new Set([items[1].id]);
  const plan = buildPlan(
    items,
    makeConfig({ ...bracketClean, onConflict: 'number' }),
    true,
    excluded
  );

  const excludedOp = plan.ops.find((op) => op.excluded)!;
  assert.equal(excludedOp.skip, true);
  assert.equal(excludedOp.newName, 'a (1).txt'); // giữ nguyên tên gốc
  assert.equal(excludedOp.note, 'Đã bỏ chọn');
  assert.equal(plan.willChange, 1); // chỉ "a (2).txt" -> "a.txt"
});

test('CLI generator: mọi flag emit ra đều tồn tại trong rename_files.py', () => {
  const config = makeConfig({
    target: 'both',
    recursive: true,
    maxDepth: 3,
    includeHidden: true,
    onlyExt: 'jpg,png',
    matchRegex: '^a',
    unicode: 'nfc',
    fullwidth: true,
    colonToDash: true,
    stripNumbering: true,
    ...bracketClean,
    keepBracketContent: true,
    bracketMatchRegex: '1080',
    removeBefore: 'x',
    removeAfter: 'y',
    removeTextList: ['abc'],
    removeRegexList: ['\\d+'],
    replacePairs: [{ from: 'a', to: 'b' }],
    regexReplacePairs: [{ pattern: 'p', repl: 'r' }],
    ignoreCase: true,
    accentInsensitive: true,
    wholeWord: true,
    removeDigits: true,
    cutStart: 1,
    cutEnd: 2,
    charsToSpace: '-',
    removeAccents: true,
    asciiOnly: true,
    removeSpecial: true,
    specialKeep: '#',
    specialReplace: '_',
    spaces: 'dash',
    caseMode: 'snake',
    collapseSeparators: true,
    prefix: 'p_',
    suffix: '_s',
    separator: '-',
    parentFolder: 'suffix',
    dateSource: 'mtime',
    dateFormat: '%Y-%m-%d',
    datePos: 'suffix',
    numbering: true,
    numberStart: 5,
    numberStep: 2,
    numberWidth: 3,
    numberPos: 'suffix',
    numberBase: 'img',
    sortMode: 'name',
    reverseSort: true,
    extCase: 'lower',
    extMappings: [{ from: 'jpeg', to: 'jpg' }],
    maxLength: 50,
    windowsSafe: true,
  });

  const cmd = generateCliCommand(config, '/tmp/x');
  const flags = [...cmd.matchAll(/(?:^|\s)(--?[a-zA-Z][\w-]*)/g)].map((m) => m[1]);

  assert.ok(flags.length > 20, `quá ít flag emit: ${flags.join(' ')}`);
  for (const flag of flags) {
    assert.ok(
      PYTHON_SCRIPT_CODE.includes(flag),
      `flag "${flag}" không có trong rename_files.py (CLI sinh ra sẽ crash argparse)`
    );
  }
});

test('CLI generator: 4 flag không hỗ trợ không được emit kể cả khi bật trong config', () => {
  const cmd = generateCliCommand(
    makeConfig({
      charMaps: [{ from: 'a', to: 'b' }],
      specialKeepOnly: 'ab',
      numberPerDir: true,
      numbering: true,
      onConflict: 'abort',
    }),
    '.'
  );

  for (const flag of ['--map', '--special-keep-only', '--number-per-dir', '--on-conflict']) {
    assert.ok(!cmd.includes(flag), `"${flag}" không được emit (rename_files.py không hiểu flag này)`);
  }
});

// --- Portable package contracts: file tải về phải chạy được thật ---

const withTempFile = (name: string, content: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'renamer-pkg-'));
  const file = join(dir, name);
  writeFileSync(file, content, 'utf8');
  return file;
};

test('PYTHON_SCRIPT_CODE là Python hợp lệ (py_compile pass)', () => {
  const python = ['python3', 'python'].find((bin) => {
    const r = spawnSync(bin, ['--version'], { stdio: 'ignore' });
    return r.status === 0 || r.error === undefined;
  });
  assert.ok(python, 'cần python3 trên máy để kiểm tra script portable');

  const file = withTempFile('rename_files.py', PYTHON_SCRIPT_CODE);
  try {
    const r = spawnSync(python, ['-m', 'py_compile', file], { encoding: 'utf8' });
    assert.equal(
      r.status,
      0,
      `rename_files.py không compile: ${r.stderr}\n(escape \\n trong template literal bị hỏng là nguyên nhân kinh điển)`
    );
  } finally {
    rmSync(file, { force: true });
    rmSync(file.replace(/\.py$/, '__pycache__'), { recursive: true, force: true });
  }
});

test('ELECTRON_MAIN_JS / ELECTRON_PRELOAD_JS là JavaScript hợp lệ (node --check pass)', () => {
  for (const [name, code] of [
    ['main.js', ELECTRON_MAIN_JS],
    ['preload.js', ELECTRON_PRELOAD_JS],
  ] as const) {
    const file = withTempFile(name, code);
    try {
      const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      assert.equal(r.status, 0, `${name} không parse: ${r.stderr}`);
    } finally {
      rmSync(file, { force: true });
    }
  }
});

test('ELECTRON_PACKAGE_JSON là JSON hợp lệ', () => {
  assert.doesNotThrow(() => JSON.parse(ELECTRON_PACKAGE_JSON));
});
