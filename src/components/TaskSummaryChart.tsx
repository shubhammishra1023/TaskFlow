import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, CircleDot, Sparkles, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Task } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TaskSummaryChartProps {
  tasks: Task[];
  onClearCompleted?: () => void;
}

export const TaskSummaryChart: React.FC<TaskSummaryChartProps> = ({
  tasks,
  onClearCompleted,
}) => {
  const { theme } = useTheme();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const incomplete = total - completed;
  const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const incompletePercentage = total > 0 ? 100 - completedPercentage : 0;

  // Additional metrics
  const highPriorityCount = tasks.filter((t) => !t.completed && t.priority === 'high').length;
  const overdueCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = t.dueDate.split('-');
    if (parts.length !== 3) return false;
    const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  }).length;

  const emptyColor = theme === 'dark' ? '#334155' : '#E2E8F0';

  const chartData = total > 0
    ? [
        { name: 'Completed', value: completed, color: '#10B981', percentage: completedPercentage },
        { name: 'Incomplete', value: incomplete, color: '#6366F1', percentage: incompletePercentage },
      ]
    : [
        { name: 'No tasks', value: 1, color: emptyColor, percentage: 0 },
      ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && total > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold">{data.name} Tasks</span>
          </div>
          <p className="text-slate-300">
            <span className="text-white font-bold">{data.value}</span> ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Task Overview & Progress
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ratio of completed versus incomplete tasks
          </p>
        </div>

        {completed > 0 && onClearCompleted && (
          <button
            id="summary-clear-completed-btn"
            onClick={onClearCompleted}
            className="text-xs text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg px-2.5 py-1 transition flex items-center gap-1 cursor-pointer font-medium"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Completed ({completed})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Recharts Pie Chart Visualizer */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[160px]">
          <div className="w-full h-36 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={total > 0 && completed > 0 && incomplete > 0 ? 4 : 0}
                  dataKey="value"
                  strokeWidth={0}
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Percentage Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {total > 0 ? (
                <>
                  <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                    {completedPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Done
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">0 Tasks</span>
              )}
            </div>
          </div>

          {/* Chart Mini Legend */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Completed ({completed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Incomplete ({incomplete})</span>
            </div>
          </div>
        </div>

        {/* Task Metrics Summary Cards */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Total Tasks */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
              Total Tasks
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{total}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">items</span>
            </div>
          </div>

          {/* Incomplete Tasks */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
            <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1 mb-1">
              <CircleDot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Incomplete
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-indigo-950 dark:text-indigo-200">{incomplete}</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                ({incompletePercentage}%)
              </span>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Completed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-950 dark:text-emerald-200">{completed}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ({completedPercentage}%)
              </span>
            </div>
          </div>

          {/* High Priority Attention */}
          {highPriorityCount > 0 && (
            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-xl">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> High Priority
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-rose-950 dark:text-rose-200">{highPriorityCount}</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400">pending</span>
              </div>
            </div>
          )}

          {/* Overdue Attention */}
          {overdueCount > 0 && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-xl">
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Overdue
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-amber-950 dark:text-amber-200">{overdueCount}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">deadline passed</span>
              </div>
            </div>
          )}

          {/* All Completed Celebration badge */}
          {total > 0 && completed === total && (
            <div className="col-span-2 sm:col-span-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Great job! All {total} tasks completed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
