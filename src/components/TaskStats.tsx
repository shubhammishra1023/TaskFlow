import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';

interface TaskStatsProps {
  total: number;
  completed: number;
  active: number;
  onClearCompleted?: () => void;
}

export const TaskStats: React.FC<TaskStatsProps> = ({
  total,
  completed,
  active,
  onClearCompleted,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-xs font-semibold text-amber-800">
            <span>{active} Active</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-semibold text-emerald-800">
            <span>{completed} Done</span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="text-slate-800 font-semibold">{total}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
            {percentage === 100 && total > 0 ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> All Tasks Done!
              </span>
            ) : (
              <span className="bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full text-slate-700 font-semibold text-[11px]">
                {percentage}% Completed
              </span>
            )}
          </div>

          {completed > 0 && onClearCompleted && (
            <button
              id="clear-completed-btn"
              onClick={onClearCompleted}
              className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-2.5 py-1 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

