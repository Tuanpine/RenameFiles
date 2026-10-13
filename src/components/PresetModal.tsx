import React, { useState } from 'react';
import { Preset } from '../types/renamer';
import { BookmarkPlus, X, Trash2 } from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPresets: Preset[];
  onSavePreset: (name: string, description: string) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  customPresets,
  onSavePreset,
  onDeletePreset,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSavePreset(name.trim(), desc.trim());
    setName('');
    setDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Lưu mẫu quy tắc đổi tên (Custom Preset)
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
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tên mẫu cấu hình:
              </label>
              <input
                type="text"
                required
                placeholder="vd: Đổi tên ảnh du lịch Nha Trang..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mô tả (tùy chọn):
              </label>
              <textarea
                placeholder="Ghi chú về mục đích sử dụng của mẫu này..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-indigo-500 bg-white h-16 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Lưu mẫu này
              </button>
            </div>
          </form>

          {customPresets.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h3 className="font-semibold text-slate-900 text-xs">
                Các mẫu tùy chỉnh đã lưu:
              </h3>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {customPresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-500">{p.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Xóa mẫu này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
