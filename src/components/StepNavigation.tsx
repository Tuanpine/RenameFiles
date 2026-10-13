import React from 'react';
import {
  FolderInput,
  Sliders,
  Eye,
  CheckCircle,
  Columns2,
  Workflow,
} from 'lucide-react';

export type StepId = 'source' | 'rules' | 'preview' | 'apply';

interface StepNavigationProps {
  currentStep: StepId;
  onSelectStep: (step: StepId) => void;
  fileCount: number;
  activeRulesCount: number;
  willChangeCount: number;
  layoutMode: 'split' | 'stepper';
  onToggleLayoutMode: () => void;
  mobileActiveTab: 'rules' | 'preview';
  onSelectMobileTab: (tab: 'rules' | 'preview') => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  fileCount,
  activeRulesCount,
  willChangeCount,
  layoutMode,
  onToggleLayoutMode,
  mobileActiveTab,
  onSelectMobileTab,
}) => {
  const steps: Array<{
    id: StepId;
    stepNumber: string;
    title: string;
    badge: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'source',
      stepNumber: '1',
      title: 'Tệp nguồn',
      badge: `${fileCount} tệp`,
      icon: <FolderInput className="w-4 h-4" />,
    },
    {
      id: 'rules',
      stepNumber: '2',
      title: 'Quy tắc đổi tên',
      badge: `${activeRulesCount} đang bật`,
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'preview',
      stepNumber: '3',
      title: 'Xem trước & Đối chiếu',
      badge: `${willChangeCount} sẽ đổi`,
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: 'apply',
      stepNumber: '4',
      title: 'Thực thi & Hoàn tác',
      badge: 'Sẵn sàng',
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Stepper Progress Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 max-w-full">
        {steps.map((s, index) => {
          const isActive = currentStep === s.id;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => onSelectStep(s.id)}
                className={`group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                  }`}
                >
                  {s.stepNumber}
                </span>
                <span className="font-semibold">{s.title}</span>
                <span
                  className={`hidden md:inline text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/15 text-slate-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {s.badge}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className="text-slate-300 text-xs select-none shrink-0"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Controls: Layout Mode Toggle (Split screen vs Wizard) & Mobile Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {/* On Mobile / Small screens: Tab switch between Rules and Preview */}
        <div className="flex lg:hidden items-center p-0.5 bg-slate-100 rounded-lg">
          <button
            onClick={() => onSelectMobileTab('rules')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileActiveTab === 'rules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cấu hình quy tắc
          </button>
          <button
            onClick={() => onSelectMobileTab('preview')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
              mobileActiveTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Xem trước</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded">
              {willChangeCount}
            </span>
          </button>
        </div>

        {/* On Desktop: Switch between Split-Screen and Step-by-Step Focused Mode */}
        <button
          onClick={onToggleLayoutMode}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          title={
            layoutMode === 'split'
              ? 'Chuyển sang chế độ Tập trung từng bước (Wizard)'
              : 'Chuyển sang chế độ Song song hai cột (Split View)'
          }
        >
          {layoutMode === 'split' ? (
            <>
              <Workflow className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chế độ từng bước</span>
            </>
          ) : (
            <>
              <Columns2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chế độ song song</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
