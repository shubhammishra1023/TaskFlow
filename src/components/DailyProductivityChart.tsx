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
  HeartHandshake,
  Lightbulb,
  Brain,
  Compass,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Task, DailyNote } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DailyProductivityChartProps {
  tasks: Task[];
  dailyNotes?: DailyNote[];
  onOpenDailyNoteModal?: () => void;
}

type TimeframeOption = '7days' | '14days';
type ChartViewMode = 'all' | 'noteProductivity' | 'tasks';

export const DailyProductivityChart: React.FC<DailyProductivityChartProps> = ({
  tasks,
  dailyNotes = [],
  onOpenDailyNoteModal,
}) => {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7days');
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('all');

  const daysCount = timeframe === '7days' ? 7 : 14;

  // Process tasks and daily notes into daily time buckets
  const { dailyData, summaryStats, latestNoteWithFeedback } = useMemo(() => {
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
      noteProductivityScore: number | null;
      positivityScore: number | null;
      detectedEmotion: string | null;
      sentimentType: string | null;
      hasNote: boolean;
      noteSnippet: string;
      improveThinking: string | null;
      howToDoBetter: string | null;
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
        noteProductivityScore: null,
        positivityScore: null,
        detectedEmotion: null,
        sentimentType: null,
        hasNote: false,
        noteSnippet: '',
        improveThinking: null,
        howToDoBetter: null,
      });
    }

    // Attach daily notes sentiment & productivity
    let totalNoteProductivity = 0;
    let notesCount = 0;
    let highMomentumNotesCount = 0;

    dailyNotes.forEach((note) => {
      const bucket = buckets.find((b) => b.dateKey === note.date);
      if (bucket) {
        const prodScore = typeof note.productivityScore === 'number' ? note.productivityScore : note.positivityScore;
        bucket.noteProductivityScore = prodScore;
        bucket.positivityScore = note.positivityScore;
        bucket.detectedEmotion = note.detectedEmotion || (note.sentimentType === 'needs_encouragement' ? 'Needs Encouragement' : 'Reflective');
        bucket.sentimentType = note.sentimentType;
        bucket.hasNote = true;
        bucket.noteSnippet = (note.noteText || note.emotionSummary || '').slice(0, 90);
        bucket.improveThinking = note.feedback?.improveThinking || note.feedback?.perspective || null;
        bucket.howToDoBetter = note.feedback?.howToDoBetter || note.feedback?.encouragement || null;

        totalNoteProductivity += prodScore;
        notesCount += 1;
        if (prodScore >= 75) {
          highMomentumNotesCount += 1;
        }
      }
    });

    // Populate task counts based on task timestamps
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

      // 2. Task Completion Day
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

    // Calculate summary statistics
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

    // Compute Streak
    let currentStreak = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (buckets[i].completed > 0) {
        currentStreak += 1;
      } else {
        if (i === buckets.length - 1) {
          continue;
        }
        break;
      }
    }

    const avgNoteProductivity = notesCount > 0 ? Math.round(totalNoteProductivity / notesCount) : null;

    // Check most recent note for feedback display
    const latestNote = dailyNotes.length > 0 ? dailyNotes[0] : null;

    return {
      dailyData: buckets,
      summaryStats: {
        totalCompleted,
        totalCreated,
        currentStreak,
        peakDay,
        daysWithCompletedTasks,
        avgNoteProductivity,
        notesCount,
        highMomentumNotesCount,
      },
      latestNoteWithFeedback: latestNote,
    };
  }, [tasks, dailyNotes, daysCount]);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#94A3B8' : '#64748B';

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2">
          <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
            <span>{dataPoint.fullDateStr}</span>
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-slate-300">
              {dataPoint.dayOfWeek}
            </span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed Tasks:
              </span>
              <span className="font-bold text-white">{dataPoint.completed}</span>
            </div>
            <div className="flex items-center justify-between text-indigo-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Created Tasks:
              </span>
              <span className="font-bold text-white">{dataPoint.created}</span>
            </div>

            {/* Daily Note Measured Productivity & Emotion */}
            {dataPoint.hasNote && (
              <div className="pt-2 border-t border-slate-800 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-amber-300">
                  <span className="flex items-center gap-1 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Note Productivity:
                  </span>
                  <span className="font-bold">{dataPoint.noteProductivityScore}%</span>
                </div>
                {dataPoint.detectedEmotion && (
                  <div className="text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="font-semibold text-slate-400">Emotion:</span>
                    <span className="text-amber-200 font-medium">{dataPoint.detectedEmotion}</span>
                  </div>
                )}
                {dataPoint.noteSnippet && (
                  <div className="text-[10px] text-slate-300 italic truncate max-w-[200px]">
                    "{dataPoint.noteSnippet}..."
                  </div>
                )}
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
      {/* Header with Title, Mode & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Daily Progress & Note-Measured Productivity
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Reflection Synced
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Productivity measured directly from your honest daily notes & task output
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setChartViewMode('all')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('noteProductivity')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'noteProductivity'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              Note Productivity
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('tasks')}
              className={`px-2 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                viewMode === 'tasks'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tasks
            </button>
          </div>

          {/* Timeframe switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
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
              7D
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
              14D
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Completed Tasks */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Completed
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summaryStats.totalCompleted}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
              in {daysCount}d
            </span>
          </div>
        </div>

        {/* Note-Measured Productivity Score */}
        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/70 rounded-xl">
          <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Note Productivity
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-950 dark:text-amber-200">
              {summaryStats.avgNoteProductivity !== null ? `${summaryStats.avgNoteProductivity}%` : 'N/A'}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              {summaryStats.notesCount} {summaryStats.notesCount === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl">
          <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1 mb-1">
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            Task Streak
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-950 dark:text-emerald-200">
              {summaryStats.currentStreak}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              {summaryStats.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Active Days */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
            Active Days
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {summaryStats.daysWithCompletedTasks}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              of {daysCount}d
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dailyData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.6} />
            <XAxis
              dataKey="displayDate"
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              yAxisId="left"
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              allowDecimals={false}
              label={{ value: 'Tasks', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              stroke="#F59E0B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              label={{ value: 'Productivity %', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 10 }}
            />
            <Tooltip content={<CustomChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
            />

            {/* Created Tasks Bar */}
            {(viewMode === 'all' || viewMode === 'tasks') && (
              <Bar
                yAxisId="left"
                name="Created"
                dataKey="created"
                fill={isDark ? '#6366F1' : '#4F46E5'}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            )}

            {/* Completed Tasks Bar */}
            {(viewMode === 'all' || viewMode === 'tasks') && (
              <Bar
                yAxisId="left"
                name="Completed"
                dataKey="completed"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            )}

            {/* Note Productivity Progress Curve */}
            {(viewMode === 'all' || viewMode === 'noteProductivity') && (
              <Line
                yAxisId="right"
                type="monotone"
                name="Note Productivity %"
                dataKey="noteProductivityScore"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ fill: '#F59E0B', r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6, fill: '#D97706' }}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* FEEDBACK SECTION BASED ON RECENT NOTE */}
      {latestNoteWithFeedback?.feedback && (
        <div className="mt-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 text-xs text-slate-850 dark:text-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white">
                Mindset Analysis & Growth Advice ({latestNoteWithFeedback.date})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {latestNoteWithFeedback.detectedEmotion || 'Reflective'}
              </span>
            </div>

            {onOpenDailyNoteModal && (
              <button
                type="button"
                onClick={onOpenDailyNoteModal}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                Open Note
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            {/* Thinking Improvement */}
            <div className="space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                Improving Your Way of Thinking:
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {latestNoteWithFeedback.feedback.improveThinking || latestNoteWithFeedback.feedback.perspective}
              </p>
            </div>

            {/* How to do better */}
            <div className="space-y-1">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                How You Can Do Better:
              </span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {latestNoteWithFeedback.feedback.howToDoBetter || latestNoteWithFeedback.feedback.encouragement}
              </p>
            </div>
          </div>

          {/* Gentle Next Action Step */}
          {latestNoteWithFeedback.feedback.suggestedAction && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>Next Micro-Step:</strong> {latestNoteWithFeedback.feedback.suggestedAction}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>
            {summaryStats.daysWithCompletedTasks} of {daysCount} days had completed tasks
          </span>
        </div>
        {summaryStats.notesCount === 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            <HeartHandshake className="w-3.5 h-3.5" />
            Write your humble daily thoughts in one box to activate note productivity tracking
          </span>
        ) : (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ Notes analyze emotion, evaluate productivity, and guide your thinking
          </span>
        )}
      </div>
    </div>
  );
};
