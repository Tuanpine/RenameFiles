export const PYTHON_SCRIPT_CODE = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rename_files.py - Đổi tên file / thư mục hàng loạt (Windows · Linux · macOS)

Yêu cầu: Python 3.8+ (không cần thư viện ngoài).
Chạy không tham số  -> chế độ hỏi-đáp (wizard) bằng tiếng Việt.
Chạy với tham số    -> xem  \`python rename_files.py -h\`.

An toàn:
  * Luôn xem trước (preview) rồi mới hỏi xác nhận; -n chỉ xem, -y bỏ qua hỏi.
  * Tự xử lý trùng tên, đổi chỉ-khác-hoa-thường (Windows/macOS), đổi chéo (a->b, b->a).
  * Ghi log JSON để hoàn tác:  --undo rename_log_xxx.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import os
import platform
import re
import shlex
import sys
import unicodedata
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

__version__ = "1.0.0"

# Hằng số
ILLEGAL_WIN = '<>:"/\\\\|?*'
WIN_RESERVED = ({"CON", "PRN", "AUX", "NUL"}
                | {f"COM{i}" for i in range(1, 10)}
                | {f"LPT{i}" for i in range(1, 10)})
COMPOUND_EXTS = (".tar.gz", ".tar.bz2", ".tar.xz", ".tar.zst", ".tar.lz4", ".tar.z")
SYSTEM_NAMES = {n.casefold() for n in (
    "@eaDir", "#recycle", "#snapshot", ".DS_Store", "Thumbs.db", "desktop.ini",
    "$RECYCLE.BIN", "System Volume Information", ".Trashes", ".Spotlight-V100",
    ".fseventsd", ".git", "__MACOSX")}
BRACKET_PAIRS = {
    "round": [("(", ")"), ("（", "）")],
    "square": [("[", "]"), ("［", "］"), ("【", "】")],
    "curly": [("{", "}"), ("｛", "｝")],
    "angle": [("<", ">"), ("＜", "＞"), ("《", "》"), ("〈", "〉")],
}
TRANSLIT = {"ß": "ss", "æ": "ae", "Æ": "AE", "œ": "oe", "Œ": "OE", "ø": "o", "Ø": "O",
            "ł": "l", "Ł": "L", "þ": "th", "Þ": "Th", "ð": "d", "Ð": "D"}
NUMBERING_RE = re.compile(r"^\\s*(?:[\\(\\[]\\d{1,4}[\\)\\]]|\\d{1,4}\\s*[.)\\-_])\\s*[-_.]*\\s*")

PRESETS = {
    "clean": dict(remove_accents=True, remove_special=True, spaces="underscore",
                  collapse_separators=True, case="lower"),
    "slug": dict(remove_accents=True, remove_special=True, spaces="dash",
                 collapse_separators=True, case="lower"),
    "tidy": dict(unicode="nfc", collapse_separators=True),
    "windows-safe": dict(windows_safe=True, unicode="nfc"),
}

CI_FS = platform.system() in ("Windows", "Darwin")

def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)

def kf(name: str) -> str:
    n = nfc(name)
    return n.casefold() if CI_FS else n

def fold_char(ch: str) -> str:
    if ch == "đ": return "d"
    if ch == "Đ": return "D"
    base = "".join(c for c in unicodedata.normalize("NFD", ch) if unicodedata.category(c) != "Mn")
    return base if len(base) == 1 else ch

def fold(s: str) -> str:
    return "".join(fold_char(c) for c in nfc(s))

def strip_accents(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    d = unicodedata.normalize("NFD", s)
    return nfc("".join(c for c in d if unicodedata.category(c) != "Mn"))

def to_ascii(s: str) -> str:
    s = "".join(TRANSLIT.get(c, c) for c in strip_accents(s))
    return "".join(c for c in s if ord(c) < 128)

def lp(path: str) -> str:
    if os.name == "nt":
        p = os.path.abspath(path)
        if len(p) > 240 and not p.startswith("\\\\\\\\?\\\\"):
            return "\\\\\\\\?\\\\UNC\\\\" + p[2:] if p.startswith("\\\\\\\\") else "\\\\\\\\?\\\\" + p
        return p
    return path

def split_name(name: str, is_dir: bool) -> Tuple[str, str]:
    if is_dir: return name, ""
    low = name.lower()
    for ce in COMPOUND_EXTS:
        if low.endswith(ce) and len(name) > len(ce):
            return name[:-len(ce)], name[-len(ce):]
    stem, ext = os.path.splitext(name)
    if not stem or not re.fullmatch(r"\\.[A-Za-z0-9_+\\-]{1,10}", ext):
        return name, ""
    return stem, ext

def parse_bracket_kinds(val: str) -> List[str]:
    v = (val or "all").lower()
    kinds: List[str] = []
    if "all" in v: kinds = ["round", "square", "curly"]
    table = {"round": "()", "square": "[]", "curly": "{}", "angle": "<>"}
    for k, sym in table.items():
        if (k in v or sym in v) and k not in kinds: kinds.append(k)
    return kinds

def remove_brackets(s: str, kinds: List[str], keep_content: bool, match_re: Optional["re.Pattern[str]"]) -> str:
    for kind in kinds:
        for o, c in BRACKET_PAIRS[kind]:
            pat = re.compile(re.escape(o) + "[^" + re.escape(o) + re.escape(c) + "]*" + re.escape(c))
            def repl(m, _keep=keep_content):
                inner = m.group(0)[1:-1]
                if match_re is not None and not match_re.search(inner): return m.group(0)
                return inner if _keep else ""
            while True:
                new = pat.sub(repl, s)
                if new == s: break
                s = new
    return s

def sub_pat(s: str, pat: "re.Pattern[str]", repl, fold_mode: bool) -> str:
    if not fold_mode: return pat.sub(repl, s)
    f = fold(s)
    out, last = [], 0
    for m in pat.finditer(f):
        out.append(s[last:m.start()])
        out.append(repl(m))
        last = m.end()
    out.append(s[last:])
    return "".join(out)

def search_span(s: str, pat: "re.Pattern[str]", fold_mode: bool):
    m = pat.search(fold(s) if fold_mode else s)
    return (m.start(), m.end()) if m else None

def remove_special(s: str, keep: str, repl: str) -> str:
    out = []
    for ch in s:
        if unicodedata.category(ch)[0] in "LNM" or ch in keep: out.append(ch)
        else: out.append(repl)
    return "".join(out)

def apply_case(s: str, mode: str) -> str:
    if mode == "keep": return s
    if mode == "lower": return s.lower()
    if mode == "upper": return s.upper()
    if mode == "title":
        return re.sub(r"[^\\W_]+(?:['’][^\\W_]+)*", lambda m: m.group(0)[:1].upper() + m.group(0)[1:].lower(), s)
    if mode == "sentence":
        s = s.lower()
        for i, ch in enumerate(s):
            if ch.isalpha(): return s[:i] + ch.upper() + s[i + 1:]
        return s
    s = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s)
    words = re.findall(r"[^\\W_]+", s)
    if mode == "snake": return "_".join(w.lower() for w in words)
    if mode == "kebab": return "-".join(w.lower() for w in words)
    caps = [w[:1].upper() + w[1:].lower() for w in words]
    if mode == "pascal": return "".join(caps)
    if mode == "camel": return (words[0].lower() + "".join(caps[1:])) if words else ""
    return s

class Cleaner:
    def __init__(self, o: argparse.Namespace):
        self.o = o
        flags = re.IGNORECASE if o.ignore_case else 0
        self.fold_mode = bool(o.accent_insensitive)
        texts = list(o.remove_text or [])
        texts = sorted({t for t in texts if t}, key=len, reverse=True)
        self.text_pats = [self._lit(t, flags) for t in texts]
        self.regex_pats = [re.compile(p, flags) for p in (o.remove_regex or [])]
        self.repl = [(self._lit(a, flags), b) for a, b in (o.replace or [])]
        self.regex_repl = [(re.compile(p, flags), r) for p, r in (o.regex_replace or [])]
        self.before = self._lit(o.remove_before, flags, whole=False) if o.remove_before else None
        self.after = self._lit(o.remove_after, flags, whole=False) if o.remove_after else None
        self.kinds = parse_bracket_kinds(o.remove_brackets) if o.remove_brackets else []
        self.bracket_re = re.compile(o.bracket_match, flags) if o.bracket_match else None
        self.ext_map = {}
        for pair in (o.ext_map or []):
            if "=" in pair:
                a, b = pair.split("=", 1)
                self.ext_map[a.strip().lstrip(".").lower()] = b.strip().lstrip(".")

    def _lit(self, text: str, flags: int, whole: Optional[bool] = None) -> "re.Pattern[str]":
        t = fold(text) if self.fold_mode else nfc(text)
        p = re.escape(t)
        if self.o.whole_word if whole is None else whole:
            p = r"(?<![^\\W_])" + p + r"(?![^\\W_])"
        return re.compile(p, flags)

    def clean(self, s: str) -> str:
        o = self.o
        s = nfc(s)
        orig = s
        if o.strip_numbering: s = NUMBERING_RE.sub("", s, count=1)
        if self.kinds: s = remove_brackets(s, self.kinds, o.keep_bracket_content, self.bracket_re)
        if self.before:
            sp = search_span(s, self.before, self.fold_mode)
            if sp: s = s[sp[1]:]
        if self.after:
            sp = search_span(s, self.after, self.fold_mode)
            if sp: s = s[:sp[0]]
        for pat in self.text_pats: s = sub_pat(s, pat, lambda m: "", self.fold_mode)
        for pat in self.regex_pats: s = pat.sub("", s)
        for pat, new in self.repl: s = sub_pat(s, pat, lambda m, n=new: n, self.fold_mode)
        for pat, rep in self.regex_repl: s = pat.sub(rep, s)
        if o.remove_digits: s = re.sub(r"\\d+", "", s)
        if o.cut_start: s = s[o.cut_start:]
        if o.cut_end: s = s[:-o.cut_end] if o.cut_end < len(s) else ""
        if o.chars_to_space: s = s.translate({ord(c): " " for c in o.chars_to_space})
        if o.remove_accents or o.ascii: s = strip_accents(s)
        if o.ascii: s = to_ascii(s)
        norm_ws = (s != orig or o.remove_special or o.spaces != "keep" or o.collapse_separators)
        if norm_ws: s = re.sub(r"\\s+", " ", s)
        if o.remove_special: s = remove_special(s, o.special_keep, o.special_replace)
        if norm_ws: s = re.sub(r"\\s+", " ", s).strip()
        if o.spaces != "keep":
            s = re.sub(r"\\s+", {"underscore": "_", "dash": "-", "dot": ".", "remove": ""}[o.spaces], s)
        s = apply_case(s, o.case)
        if o.collapse_separators:
            s = re.sub(r"(?P<c>[ _\\-.])(?P=c)+", lambda m: m.group("c"), s)
            s = s.lstrip(" _-").rstrip(" _-.")
        return s.strip() if norm_ws else s

    def fix_ext(self, ext: str, is_dir: bool) -> str:
        if is_dir: return ext
        o = self.o
        e = ext[1:] if ext else ""
        if e and e.lower() in self.ext_map: e = self.ext_map[e.lower()]
        if o.ext == "lower": e = e.lower()
        elif o.ext == "upper": e = e.upper()
        if o.set_ext: e = o.set_ext.lstrip(".")
        return ("." + e) if e else ""

    def build(self, name: str, is_dir: bool, parent_name: str, date_str: str, num_str: str) -> Optional[str]:
        o = self.o
        stem, ext = split_name(name, is_dir)
        core = self.clean(stem)
        if o.unicode == "none" and core == nfc(stem): core = stem
        left, right = [], []
        if o.parent != "none" and parent_name: (left if o.parent == "prefix" else right).append(parent_name)
        if date_str: (left if o.date_pos == "prefix" else right).append(date_str)
        if num_str:
            if o.number_pos == "replace": core = (o.number_base + o.sep if o.number_base else "") + num_str
            else: (left if o.number_pos == "prefix" else right).append(num_str)
        parts = left + ([core] if core else []) + (list(reversed(right)) if right else [])
        new_stem = o.prefix + o.sep.join(parts) + o.suffix
        if o.max_length and len(new_stem) > o.max_length: new_stem = new_stem[:o.max_length].rstrip(" ._-")
        new_ext = self.fix_ext(ext, is_dir)
        if not new_stem: return None
        full = new_stem + new_ext
        full = self.sanitize(full, is_dir)
        if o.unicode == "nfc": full = nfc(full)
        elif o.unicode == "nfd": full = unicodedata.normalize("NFD", full)
        return full or None

    def sanitize(self, name: str, is_dir: bool) -> str:
        o = self.o
        name = name.replace("/", o.illegal_replace).replace("\\x00", "")
        if os.name == "nt" or o.windows_safe:
            name = re.sub("[" + re.escape(ILLEGAL_WIN) + r"\\x00-\\x1f]", o.illegal_replace, name)
            name = name.rstrip(" .")
            stem = split_name(name, is_dir)[0]
            if stem.split(".")[0].upper() in WIN_RESERVED: name = stem + "_" + name[len(stem):]
        return name

@dataclass
class Item:
    path: str
    parent: str
    name: str
    is_dir: bool

@dataclass
class Op:
    item: Item
    want: str
    new: str
    skip: bool = False
    note: str = ""

def scan_items(root_dir: str, o: argparse.Namespace) -> List[Item]:
    res: List[Item] = []
    root_dir = os.path.abspath(root_dir)
    max_d = o.max_depth if o.max_depth is not None else (9999 if o.recursive else 0)
    
    only_exts = {e.lower().lstrip(".") for e in o.only_ext.split(",")} if o.only_ext else None
    rx_match = re.compile(o.match_regex) if o.match_regex else None

    for root, dirs, files in os.walk(root_dir):
        depth = 0 if root == root_dir else len(os.path.relpath(root, root_dir).split(os.sep))
        if depth > max_d:
            dirs.clear()
            continue

        if not o.include_hidden:
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            files = [f for f in files if not f.startswith(".")]

        # dirs
        if o.target in ("dirs", "both"):
            for d in dirs:
                if d.lower() in SYSTEM_NAMES: continue
                if rx_match and not rx_match.search(d): continue
                res.append(Item(path=os.path.join(root, d), parent=root, name=d, is_dir=True))

        # files
        if o.target in ("files", "both"):
            for f in files:
                if f.lower() in SYSTEM_NAMES: continue
                if only_exts:
                    stem, ext = split_name(f, False)
                    if ext.lower().lstrip(".") not in only_exts: continue
                if rx_match and not rx_match.search(f): continue
                res.append(Item(path=os.path.join(root, f), parent=root, name=f, is_dir=False))

    return res

def plan_ops(items: List[Item], cleaner: Cleaner, o: argparse.Namespace) -> List[Op]:
    ops: List[Op] = []
    by_parent: Dict[str, List[Item]] = {}
    for it in items:
        by_parent.setdefault(it.parent, []).append(it)

    for parent, group in by_parent.items():
        if o.sort == "name": group.sort(key=lambda x: x.name, reverse=o.reverse)
        elif o.sort == "mtime": group.sort(key=lambda x: os.path.getmtime(x.path) if os.path.exists(x.path) else 0, reverse=o.reverse)
        elif o.sort == "size": group.sort(key=lambda x: os.path.getsize(x.path) if os.path.exists(x.path) else 0, reverse=o.reverse)

        total = len(group)
        w = o.number_width if o.number_width > 0 else len(str(o.number_start + (total - 1) * o.number_step))

        for idx, it in enumerate(group):
            num_str = ""
            if o.number:
                val = o.number_start + idx * o.number_step
                num_str = str(val).zfill(w)

            date_str = ""
            if o.date and o.date != "none":
                mtime = os.path.getmtime(it.path) if os.path.exists(it.path) else None
                dt_obj = dt.datetime.fromtimestamp(mtime) if (o.date == "mtime" and mtime) else dt.datetime.now()
                date_str = dt_obj.strftime(o.date_format or "%Y%m%d")

            parent_base = os.path.basename(parent) if parent else ""
            want = cleaner.build(it.name, it.is_dir, parent_base, date_str, num_str)

            if not want:
                ops.append(Op(item=it, want=it.name, new=it.name, skip=True, note="Tên rỗng"))
            elif want == it.name:
                ops.append(Op(item=it, want=want, new=want, skip=False, note="Không đổi"))
            else:
                ops.append(Op(item=it, want=want, new=want, skip=False, note=""))

    return ops

def execute_ops(ops: List[Op], o: argparse.Namespace) -> Tuple[int, str]:
    to_rename = [op for op in ops if not op.skip and op.want != op.item.name]
    if not to_rename:
        print("Không có tệp nào cần đổi tên.")
        return 0, ""

    log_entries = []
    success = 0
    print(f"\\n--- Đang thực hiện đổi tên {len(to_rename)} tệp ---")
    for op in to_rename:
        src = op.item.path
        dst = os.path.join(op.item.parent, op.want)
        try:
            if not o.dry_run:
                # Tránh trùng tên
                if os.path.exists(dst) and src.lower() != dst.lower():
                    print(f"  [BỎ QUA] Tệp đích đã tồn tại: {op.want}")
                    continue
                os.rename(lp(src), lp(dst))
            print(f"  ✓ {op.item.name} -> {op.want}")
            log_entries.append({"dir": op.item.parent, "old": op.item.name, "new": op.want, "status": "ok"})
            success += 1
        except Exception as e:
            print(f"  ✗ [LỖI] {op.item.name}: {e}")

    log_path = ""
    if log_entries and not o.dry_run:
        now_str = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = f"rename_log_{now_str}.json"
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump({"created": now_str, "entries": log_entries}, f, ensure_ascii=False, indent=2)
        print(f"\\nĐã lưu nhật ký hoàn tác vào: {log_path}")

    return success, log_path

def undo(log_file: str):
    if not os.path.exists(log_file):
        print(f"Không tìm thấy file nhật ký: {log_file}")
        return
    with open(log_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    entries = data.get("entries", [])
    print(f"Đang hoàn tác {len(entries)} tệp từ log...")
    reverted = 0
    for en in entries:
        d = en["dir"]
        old_name = en["old"]
        new_name = en["new"]
        src = os.path.join(d, new_name)
        dst = os.path.join(d, old_name)
        if os.path.exists(src):
            try:
                os.rename(lp(src), lp(dst))
                print(f"  ✓ Khôi phục: {new_name} -> {old_name}")
                reverted += 1
            except Exception as e:
                print(f"  ✗ Lỗi khi khôi phục {new_name}: {e}")
        else:
            print(f"  ! Không tìm thấy: {src}")
    print(f"\\nHoàn tất hoàn tác {reverted}/{len(entries)} tệp.")

def main():
    parser = argparse.ArgumentParser(description="Đổi tên file/thư mục hàng loạt an toàn.")
    parser.add_argument("path", nargs="?", default=".", help="Thư mục cần quét")
    parser.add_argument("-r", "--recursive", action="store_true", help="Quét đệ quy thư mục con")
    parser.add_argument("--max-depth", type=int, default=None, help="Độ sâu quét tối đa")
    parser.add_argument("-t", "--target", choices=["files", "dirs", "both"], default="files")
    parser.add_argument("--hidden", dest="include_hidden", action="store_true", help="Quét cả file ẩn")
    parser.add_argument("-e", "--only-ext", default="", help="Chỉ lọc đuôi tệp (vd: jpg,png)")
    parser.add_argument("--match-regex", default="", help="Lọc theo regex tên")
    parser.add_argument("--unicode", choices=["none", "nfc", "nfd"], default="nfc")
    parser.add_argument("--fullwidth", action="store_true", help="Đổi ký tự full-width sang ASCII")
    parser.add_argument("--colon-to-dash", action="store_true", help="Đổi ':' thành ' - '")
    parser.add_argument("--strip-numbering", action="store_true", help="Xóa số thứ tự đầu")
    parser.add_argument("-b", "--remove-brackets", default="", help="Xóa ngoặc (round,square,curly,angle)")
    parser.add_argument("--keep-bracket-content", action="store_true", help="Giữ nội dung trong ngoặc")
    parser.add_argument("--bracket-match", default="", help="Chỉ xóa ngoặc nếu nội dung khớp regex")
    parser.add_argument("-w", "--remove-text", action="append", default=[], help="Từ cần xóa")
    parser.add_argument("--remove-regex", action="append", default=[], help="Regex cần xóa")
    parser.add_argument("--remove-before", default="", help="Xóa tất cả trước từ này")
    parser.add_argument("--remove-after", default="", help="Xóa tất cả sau từ này")
    parser.add_argument("--sub", dest="replace", action="append", default=[], help="Thay thế từ cũ=>mới")
    parser.add_argument("--regex-replace", nargs=2, action="append", default=[], help="Thay thế regex (pattern repl)")
    parser.add_argument("-i", "--ignore-case", action="store_true", help="Không phân biệt hoa/thường")
    parser.add_argument("-A", "--accent-insensitive", action="store_true", help="Không phân biệt dấu")
    parser.add_argument("--whole-word", action="store_true", help="Chỉ khớp nguyên từ")
    parser.add_argument("--remove-digits", action="store_true", help="Xóa chữ số")
    parser.add_argument("--cut-start", type=int, default=0, help="Cắt N ký tự đầu")
    parser.add_argument("--cut-end", type=int, default=0, help="Cắt N ký tự cuối")
    parser.add_argument("--chars-to-space", default="", help="Đổi ký tự thành khoảng trắng")
    parser.add_argument("-a", "--remove-accents", action="store_true", help="Bỏ dấu tiếng Việt")
    parser.add_argument("--ascii", action="store_true", help="Chuyển sang ASCII thuần")
    parser.add_argument("-s", "--remove-special", action="store_true", help="Xóa ký tự đặc biệt")
    parser.add_argument("--special-keep", default="", help="Ký tự đặc biệt giữ lại")
    parser.add_argument("--special-replace", default="", help="Ký tự thay thế cho ký tự đặc biệt")
    parser.add_argument("--spaces", choices=["keep", "underscore", "dash", "dot", "remove"], default="keep")
    parser.add_argument("--case", choices=["keep", "lower", "upper", "title", "sentence", "snake", "kebab", "camel", "pascal"], default="keep")
    parser.add_argument("--collapse-separators", action="store_true", help="Rút gọn dấu lặp")
    parser.add_argument("--prefix", default="", help="Tiền tố")
    parser.add_argument("--suffix", default="", help="Hậu tố")
    parser.add_argument("--sep", default="_", help="Ký tự nối")
    parser.add_argument("--parent", choices=["none", "prefix", "suffix"], default="none")
    parser.add_argument("--date", choices=["none", "today", "mtime", "ctime"], default="none")
    parser.add_argument("--date-format", default="%Y%m%d")
    parser.add_argument("--date-pos", choices=["prefix", "suffix"], default="prefix")
    parser.add_argument("--number", action="store_true", help="Bật đánh số")
    parser.add_argument("--number-start", type=int, default=1)
    parser.add_argument("--number-step", type=int, default=1)
    parser.add_argument("--number-width", type=int, default=0)
    parser.add_argument("--number-pos", choices=["prefix", "suffix", "replace"], default="prefix")
    parser.add_argument("--number-base", default="")
    parser.add_argument("--sort", choices=["natural", "name", "mtime", "ctime", "size"], default="natural")
    parser.add_argument("--reverse", action="store_true")
    parser.add_argument("--ext", choices=["keep", "lower", "upper"], default="keep")
    parser.add_argument("--set-ext", default="")
    parser.add_argument("--ext-map", action="append", default=[])
    parser.add_argument("--max-length", type=int, default=None)
    parser.add_argument("--windows-safe", action="store_true")
    parser.add_argument("--illegal-replace", default="-")
    parser.add_argument("-n", "--dry-run", action="store_true", help="Chạy thử xem trước, không đổi thật")
    parser.add_argument("-y", "--yes", action="store_true", help="Bỏ qua xác nhận")
    parser.add_argument("--undo", default="", help="Hoàn tác từ file nhật ký JSON")

    args = parser.parse_args()

    if args.undo:
        undo(args.undo)
        return

    # Clean sub pairs
    subs = []
    for pair in (args.replace or []):
        if "=>" in pair:
            f, t = pair.split("=>", 1)
            subs.append((f, t))
    args.replace = subs

    cleaner = Cleaner(args)
    items = scan_items(args.path, args)
    if not items:
        print(f"Không tìm thấy tệp hoặc thư mục nào trong: {args.path}")
        return

    ops = plan_ops(items, cleaner, args)
    to_rename = [op for op in ops if not op.skip and op.want != op.item.name]

    print(f"Quét được {len(items)} mục. {len(to_rename)} mục cần đổi tên.")
    for op in to_rename[:20]:
        print(f"  {op.item.name} -> {op.want}")
    if len(to_rename) > 20:
        print(f"  ... và {len(to_rename) - 20} tệp khác.")

    if args.dry_run:
        print("\\n[DRY RUN] Đã xem trước thành công, không có tệp nào bị thay đổi.")
        return

    if not args.yes and to_rename:
        ans = input("\\nBạn có muốn thực hiện đổi tên thật? [Y/n]: ").strip().lower()
        if ans not in ("y", "yes", ""):
            print("Đã hủy bỏ.")
            return

    execute_ops(ops, args)

if __name__ == "__main__":
    main()
`;

export const RUN_WINDOWS_BAT = `@echo off
chcp 65001 >nul
title Batch File Renamer Pro - Portable
cls
echo ========================================================
echo       BATCH FILE RENAMER PRO - WINDOWS PORTABLE
echo ========================================================
echo.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren he thong!
    echo Vui long cai dat Python 3.8+ tu https://www.python.org/
    pause
    exit /b 1
)

echo Dang khoi dong cong cu doi ten file...
python rename_files.py
pause
`;

export const RUN_MACOS_COMMAND = `#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================"
echo "       BATCH FILE RENAMER PRO - macOS PORTABLE"
echo "========================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[LỖI] Không tìm thấy Python 3 trên macOS!"
    echo "Vui lòng cài đặt qua Homebrew: brew install python3"
    read -p "Nhấn Enter để thoát..."
    exit 1
fi

python3 rename_files.py
read -p "Nhấn Enter để thoát..."
`;

export const RUN_LINUX_SH = `#!/bin/bash
cd "$(dirname "$0")"
clear
echo "========================================================"
echo "       BATCH FILE RENAMER PRO - LINUX PORTABLE"
echo "========================================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "[LỖI] Không tìm thấy Python 3 trên Linux!"
    echo "Cài đặt bằng lệnh: sudo apt install python3"
    read -p "Nhấn Enter để thoát..."
    exit 1
fi

python3 rename_files.py
read -p "Nhấn Enter để thoát..."
`;

export const ELECTRON_PACKAGE_JSON = `{
  "name": "batch-file-renamer-desktop",
  "version": "1.0.0",
  "description": "Portable Cross-Platform Batch File Renamer",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "pack:win": "electron-builder --win portable",
    "pack:mac": "electron-builder --mac",
    "pack:linux": "electron-builder --linux AppImage"
  },
  "devDependencies": {
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8"
  }
}`;

export const ELECTRON_MAIN_JS = `const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    titleBarStyle: 'default',
    title: 'Batch File Renamer Pro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Tải giao diện ứng dụng
  win.loadURL(process.env.APP_URL || 'http://localhost:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

export const ELECTRON_PRELOAD_JS = `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
`;

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
