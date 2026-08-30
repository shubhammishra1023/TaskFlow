import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Award,
  CalendarDays,
  Target,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { Task } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DailyProductivityChartProps {
  tasks: Task[];
}

type TimeframeOption = '7days' | '14days';

export const DailyProductivityChart: React.FC<DailyProductivityChartProps> = ({ tasks }) => {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7days');
  const [activeMetric, setActiveMetric] = useState<'all' | 'completed' | 'created'>('all');

  const daysCount = timeframe === '7days' ? 7 : 14;

  // Process tasks into daily time buckets
  const { dailyData, summaryStats } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const buckets: {
      dateKey: string;
      displayDate: string;
      dayOfWeek: string;
      fullDateStr: string;
      completed: number;
      created: number;
      highPriorityCompleted: number;
      completionRate: number;
    }[] = [];

    // Generate day list in ascending chronological order
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      buckets.push({
        dateKey,
        displayDate: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        dayOfWeek: dayNames[d.getDay()],
        fullDateStr: `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`,
        completed: 0,
        created: 0,
        highPriorityCompleted: 0,
        completionRate: 0,
      });
    }

    // Populate counts based on task timestamps and due dates
    tasks.forEach((task) => {
      // 1. Task Creation Day
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt);
        const y = createdDate.getFullYear();
        const m = String(createdDate.getMonth() + 1).padStart(2, '0');
        const d = String(createdDate.getDate()).padStart(2, '0');
        const createdKey = `${y}-${m}-${d}`;

        const bucket = buckets.find((b) => b.dateKey === createdKey);
        if (bucket) {
          bucket.created += 1;
        }
      }

      // 2. Task Completion Day (use updatedAt if completed, fallback to createdAt or dueDate)
      if (task.completed) {
        const completionTimestamp = task.updatedAt || task.createdAt;
        const compDate = new Date(completionTimestamp);
        const y = compDate.getFullYear();
        const m = String(compDate.getMonth() + 1).padStart(2, '0');
        const d = String(compDate.getDate()).padStart(2, '0');
        const compKey = `${y}-${m}-${d}`;

        const bucket = buckets.find((b) => b.dateKey === compKey);
        if (bucket) {
          bucket.completed += 1;
          if (task.priority === 'high') {
            bucket.highPriorityCompleted += 1;
          }
        } else {
          // If completion occurred today or outside range, assign to latest bucket if recent
          const latestBucket = buckets[buckets.length - 1];
          if (latestBucket) {
            latestBucket.completed += 1;
            if (task.priority === 'high') {
              latestBucket.highPriorityCompleted += 1;
            }
          }
        }
      }
    });

    // Calculate completion rates and summary stats
    let totalCompleted = 0;
    let totalCreated = 0;
    let daysWithCompletedTasks = 0;
    let peakDay = { day: '-', count: 0 };

    buckets.forEach((b) => {
      totalCompleted += b.completed;
      totalCreated += b.created;
      if (b.completed > 0) {
        daysWithCompletedTasks += 1;
      }
      if (b.completed > peakDay.count) {
        peakDay = { day: b.fullDateStr, count: b.completed };
      }
      const totalActivity = b.completed + b.created;
      b.completionRate = totalActivity > 0 ? Math.round((b.completed / totalActivity) * 100) : 0;
    });

    // Compute Streak (consecutive days with completed tasks ending today or yesterday)
    let currentStreak = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].completed > 0) {
        currentStreak += 1;
      } else {
        // If today has 0, but yesterday had >0, allow streak to maintain until day ends
        if (i === buckets.length - 1) {
          continue;
        }
        break;
      }
    }

    // Overall Productivity Score (Ratio of completed to created, weighted by high priority)
    const baseScore = totalCreated > 0 ? (totalCompleted / Math.max(totalCreated, 1)) * 100 : totalCompleted > 0 ? 100 : 0;
    const productivityScore = Math.min(Math.round(baseScore), 100);

    return {
      dailyData: buckets,
      summaryStats: {
        totalCompleted,
        totalCreated,
        currentStreak,
        productivityScore,
        peakDay,
        daysWithCompletedTasks,
      },
    };
  }, [tasks, daysCount]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#64748B';

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[170px]">
          <p className="font-semibold text-slate-200 border-b border-slate-700/80 pb-1.5 mb-2 flex items-center justify-between">
            <span>{dataPoint.fullDateStr}</span>
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-slate-300">
              {dataPoint.dayOfWeek}
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed:
              </span>
              <span className="font-bold text-white">{dataPoint.completed}</span>
            </div>
            <div className="flex items-center justify-between text-indigo-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Created:
              </span>
              <span className="font-bold text-white">{dataPoint.created}</span>
            </div>
            {dataPoint.highPriorityCompleted > 0 && (
              <div className="flex items-center justify-between text-rose-400 text-[11px] pt-1 border-t border-slate-800 dark:border-slate-700">
                <span>High Priority Done:</span>
                <span className="font-semibold">{dataPoint.highPriorityCompleted}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="daily-productivity-analytics-card"
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs transition-colors duration-200"
    >
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Daily Progress & Productivity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track task velocity and daily completion trends over time
            </p>
          </div>
        </div>

        {/* Timeframe switch button group */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
          <button
            id="timeframe-7days-btn"
            type="button"
            onClick={() => setTimeframe('7days')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeframe === '7days'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            7 Days
          </button>
          <button
            id="timeframe-14days-btn"
            type="button"
            onClick={() => setTimeframe('14days')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeframe === '14days'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            14 Days
          </button>
        </div>
      </div>

      {/* KPI Productivity Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Productivity Score */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Target className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            Productivity Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summaryStats.productivityScore}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">efficiency</span>
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 rounded-xl">
          <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            Daily Streak
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-950 dark:text-amber-200">
              {summaryStats.currentStreak}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              {summaryStats.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Total Completed in Period */}
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl">
          <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Done in {daysCount}d
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-950 dark:text-emerald-200">
              {summaryStats.totalCompleted}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">tasks</span>
          </div>
        </div>

        {/* Peak Velocity Day */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Peak Day
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {summaryStats.peakDay.count > 0 ? summaryStats.peakDay.day : 'No data yet'}
            </span>
            {summaryStats.peakDay.count > 0 && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold shrink-0">
                ({summaryStats.peakDay.count})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Recharts Composed Chart */}
      <div className="w-full h-56 sm:h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dailyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: textColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-slate-600 dark:text-slate-300 font-medium capitalize">
                  {value}
                </span>
              )}
            />
            {/* Created Tasks Bar */}
            <Bar
              name="Created"
              dataKey="created"
              fill={isDark ? '#6366F1' : '#4F46E5'}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            {/* Completed Tasks Bar */}
            <Bar
              name="Completed"
              dataKey="completed"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>
            {summaryStats.daysWithCompletedTasks} of {daysCount} days had completed task activity
          </span>
        </div>
        {summaryStats.currentStreak > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Keep the streak alive by finishing pending items!
          </span>
        )}
      </div>
    </div>
  );
};
