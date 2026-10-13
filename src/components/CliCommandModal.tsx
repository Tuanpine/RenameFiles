import React, { useState } from 'react';
import { Terminal, Copy, Check, X } from 'lucide-react';

interface CliCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  command: string;
}

export const CliCommandModal: React.FC<CliCommandModalProps> = ({
  isOpen,
  onClose,
  command,
}) => {
  const [copied, setCopied] = useState(false);
  const [includeDryRun, setIncludeDryRun] = useState(false);
  const [includeYes, setIncludeYes] = useState(false);

  if (!isOpen) return null;

  let finalCmd = command;
  if (includeDryRun) finalCmd += ' -n';
  if (includeYes) finalCmd += ' -y';

  const handleCopy = () => {
    navigator.clipboard.writeText(finalCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Lệnh dòng lệnh Terminal CLI tương đương
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600">
            Bạn có thể sao chép lệnh dưới đây để chạy trực tiếp trên Command Prompt / PowerShell (Windows), Terminal (macOS) hoặc Linux:
          </p>

          <div className="relative">
            <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-xs whitespace-pre-wrap break-all leading-relaxed">
              {finalCmd}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDryRun}
                onChange={(e) => setIncludeDryRun(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">
                Thêm cờ xem trước <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">-n</code> (không đổi gì)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeYes}
                onChange={(e) => setIncludeYes(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700">
                Thêm cờ bỏ qua hỏi xác nhận <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">-y</code>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
