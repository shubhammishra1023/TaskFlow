import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle,
  Coffee,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  Minus,
  Clock,
  Maximize2,
  Minimize2,
  Flame,
} from 'lucide-react';
import { Task } from '../types';
import { playFocusCompleteChime } from '../utils/audio';

interface FocusTimerProps {
  tasks?: Task[];
  onCompleteTask?: (taskId: string, completed: boolean) => Promise<void>;
}

type TimerMode = 'focus' | 'break';

interface Preset {
  label: string;
  minutes: number;
  mode: TimerMode;
  icon?: React.ReactNode;
}

const PRESETS: Preset[] = [
  { label: '15m Sprint', minutes: 15, mode: 'focus' },
  { label: '25m Pomodoro', minutes: 25, mode: 'focus' },
  { label: '45m Deep Work', minutes: 45, mode: 'focus' },
  { label: '60m Extended', minutes: 60, mode: 'focus' },
  { label: '5m Short Break', minutes: 5, mode: 'break', icon: <Coffee className="w-3 h-3" /> },
  { label: '15m Long Break', minutes: 15, mode: 'break', icon: <Coffee className="w-3 h-3" /> },
];

export const FocusTimer: React.FC<FocusTimerProps> = ({
  tasks = [],
  onCompleteTask,
}) => {
  // Timer state in seconds
  const [initialMinutes, setInitialMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Full Screen Distraction-Free Mode State
  const [isFullscreenFocus, setIsFullscreenFocus] = useState<boolean>(false);
  const [autoFullscreenOnStart, setAutoFullscreenOnStart] = useState<boolean>(true);

  // Custom Time Setup
  const [showCustomSetup, setShowCustomSetup] = useState<boolean>(false);
  const [customInputMinutes, setCustomInputMinutes] = useState<string>('30');

  // Linked Task to focus on
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Finished alert message
  const [showCompletedBanner, setShowCompletedBanner] = useState<boolean>(false);

  const activeTasks = tasks.filter((t) => !t.completed);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Keep track of interval
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, soundEnabled]);

  // Handle keyboard shortcuts in Fullscreen (Space for play/pause, Esc to exit)
  useEffect(() => {
    if (!isFullscreenFocus) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreenMode();
      } else if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenFocus]);

  const enterFullscreenMode = () => {
    setIsFullscreenFocus(true);
    // Request browser native fullscreen if supported
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          // Ignored if blocked in iframe
        });
      }
    } catch {
      // Ignored
    }
  };

  const exitFullscreenMode = () => {
    setIsFullscreenFocus(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignored
    }
  };

  const handleStartTimer = () => {
    const nextRunningState = !isRunning;
    setIsRunning(nextRunningState);

    // If starting in focus mode and auto-fullscreen is enabled, enter fullscreen
    if (nextRunningState && timerMode === 'focus' && autoFullscreenOnStart) {
      enterFullscreenMode();
    }
  };

  const handleTimerComplete = () => {
    if (soundEnabled) {
      playFocusCompleteChime();
    }
    if (timerMode === 'focus') {
      setCompletedSessions((prev) => prev + 1);
    }
    setShowCompletedBanner(true);
  };

  const handleSelectPreset = (preset: Preset) => {
    setIsRunning(false);
    setInitialMinutes(preset.minutes);
    setTimeLeft(preset.minutes * 60);
    setTimerMode(preset.mode);
    setShowCompletedBanner(false);
  };

  const handleApplyCustomTime = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mins = parseInt(customInputMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    const boundedMins = Math.min(Math.max(mins, 1), 240); // 1 to 240 mins
    setIsRunning(false);
    setInitialMinutes(boundedMins);
    setTimeLeft(boundedMins * 60);
    setTimerMode('focus');
    setShowCustomSetup(false);
    setShowCompletedBanner(false);
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    setTimeLeft((prev) => {
      const next = Math.max(prev + deltaSeconds, 10);
      return next;
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
    setShowCompletedBanner(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSeconds = initialMinutes * 60;
  const progressFraction = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const progressPercent = Math.min(Math.max(progressFraction * 100, 0), 100);

  // SVG Circle calculations (Dashboard card)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // SVG Circle calculations (Fullscreen mode)
  const fsRadius = 140;
  const fsCircumference = 2 * Math.PI * fsRadius;
  const fsDashoffset = fsCircumference - (progressPercent / 100) * fsCircumference;

  return (
    <>
      {/* 1. Normal Dashboard Card Focus Timer */}
      <div
        id="focus-timer-container"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-all duration-200"
      >
        {/* Header bar: Compact or Expanded Toggle */}
        <div className="px-4 py-3 sm:px-5 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors ${
                timerMode === 'focus' ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-emerald-600 dark:bg-emerald-500'
              }`}
            >
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Focus Timer
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    timerMode === 'focus'
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {timerMode === 'focus' ? 'Focus Mode' : 'Break'}
                </span>
                {isRunning && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact Right Header: Fullscreen trigger, Mini Timer & Toggle */}
          <div className="flex items-center gap-2">
            {/* Enter Fullscreen Focus Button */}
            <button
              type="button"
              onClick={enterFullscreenMode}
              title="Enter Distraction-Free Fullscreen Mode"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            {/* Completed sessions badge */}
            {completedSessions > 0 && (
              <span
                title={`${completedSessions} focus session(s) completed`}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 px-2 py-0.5 rounded-lg"
              >
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'}
              </span>
            )}

            {/* Compact Mini Timer when collapsed */}
            {!isExpanded && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatTime(timeLeft)}
                </span>
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className={`p-1 rounded-lg text-white transition cursor-pointer ${
                    isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={isExpanded ? 'Collapse Timer' : 'Expand Timer'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Timer Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 sm:p-5 space-y-4"
            >
              {/* Completion Banner */}
              {showCompletedBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold">
                      {timerMode === 'focus'
                        ? '🎉 Focus session complete! Time for a well-deserved break.'
                        : '☕ Break time is over. Ready to dive back in?'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompletedBanner(false)}
                    className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-medium underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {/* Prescribed Presets & Custom Trigger */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Prescribed Presets
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoFullscreenOnStart}
                        onChange={(e) => setAutoFullscreenOnStart(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 dark:border-slate-700"
                      />
                      <span>Auto fullscreen on start</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomSetup(!showCustomSetup)}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      {showCustomSetup ? 'Hide Custom' : 'Custom Time...'}
                    </button>
                  </div>
                </div>

                {/* Prescribed Preset Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {PRESETS.map((preset) => {
                    const isSelected =
                      initialMinutes === preset.minutes && timerMode === preset.mode && !showCustomSetup;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? preset.mode === 'focus'
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-xs font-semibold'
                              : 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-xs font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {preset.icon}
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Focus Time Setup Drawer */}
              {showCustomSetup && (
                <motion.form
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleApplyCustomTime}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Set Custom Duration:</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={customInputMinutes}
                        onChange={(e) => setCustomInputMinutes(e.target.value)}
                        className="w-14 text-center font-bold text-slate-900 dark:text-white outline-hidden"
                      />
                      <span className="text-slate-500 dark:text-slate-400 text-xs">minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick stepper presets */}
                    <div className="flex items-center gap-1">
                      {[10, 20, 30, 90, 120].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setCustomInputMinutes(String(m));
                            setIsRunning(false);
                            setInitialMinutes(m);
                            setTimeLeft(m * 60);
                            setTimerMode('focus');
                          }}
                          className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md cursor-pointer transition"
                        >
                          {m}m
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Central Circular Display & Active Task Anchor */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-1">
                {/* Circular Progress & Digital Clock */}
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-100 dark:text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={`transition-all duration-300 ${
                          timerMode === 'focus' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                        {Math.round(progressPercent)}% done
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        id="focus-timer-toggle-button"
                        type="button"
                        onClick={handleStartTimer}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer ${
                          isRunning
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : timerMode === 'focus'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 ml-0.5" /> Start Focus
                          </>
                        )}
                      </button>

                      <button
                        id="focus-timer-fullscreen-btn"
                        type="button"
                        onClick={enterFullscreenMode}
                        title="Enter Distraction-Free Mode"
                        className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-xl transition cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id="focus-timer-reset-button"
                        type="button"
                        onClick={handleReset}
                        title="Reset Timer"
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Micro adjustment controls */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleAdjustTime(-60)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center"
                      >
                        <Minus className="w-2.5 h-2.5 mr-0.5" /> 1m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustTime(60)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center"
                      >
                        <Plus className="w-2.5 h-2.5 mr-0.5" /> 1m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjustTime(300)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer flex items-center"
                      >
                        <Plus className="w-2.5 h-2.5 mr-0.5" /> 5m
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task Linking Target Module */}
                <div className="w-full sm:w-auto flex-1 max-w-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Focus Target Task
                    </span>
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        soundEnabled
                          ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700'
                          : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {activeTasks.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        id="focus-target-task-select"
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- No specific task (General focus) --</option>
                        {activeTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} {t.priority === 'high' ? '🔥 [High]' : ''}
                          </option>
                        ))}
                      </select>

                      {selectedTask && (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                            {selectedTask.title}
                          </span>
                          {onCompleteTask && (
                            <button
                              type="button"
                              onClick={() => {
                                onCompleteTask(selectedTask.id, true);
                                setSelectedTaskId('');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> Done
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      Add tasks to link a specific task to your focus session.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Full-Screen Distraction-Free Overlay Mode */}
      <AnimatePresence>
        {isFullscreenFocus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto"
          >
            {/* Fullscreen Top Navigation */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
              {/* Mode & Streak Pill */}
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    timerMode === 'focus'
                      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>{timerMode === 'focus' ? 'Distraction-Free Focus Mode' : 'Break Time'}</span>
                </div>

                {completedSessions > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold bg-slate-800/80 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    {completedSessions} {completedSessions === 1 ? 'session' : 'sessions'} completed
                  </span>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                  className={`p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white transition cursor-pointer`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                <button
                  id="exit-fullscreen-btn"
                  type="button"
                  onClick={exitFullscreenMode}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white flex items-center gap-2 transition cursor-pointer shadow-sm"
                  title="Exit Fullscreen (or press Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Fullscreen</span>
                  <kbd className="hidden md:inline text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">ESC</kbd>
                </button>
              </div>
            </div>

            {/* Fullscreen Centerpiece: Giant Ring & Timer */}
            <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center my-auto py-8">
              {/* Linked Target Task Spotlight */}
              {selectedTask ? (
                <div className="mb-6 p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl max-w-md w-full text-center shadow-xl shadow-indigo-950/40">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" /> Current Focus Target
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">
                    {selectedTask.title}
                  </h3>
                  {selectedTask.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {selectedTask.description}
                    </p>
                  )}
                  {onCompleteTask && (
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteTask(selectedTask.id, true);
                        setSelectedTaskId('');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Task Complete
                    </button>
                  )}
                </div>
              ) : activeTasks.length > 0 ? (
                <div className="mb-6 max-w-xs w-full">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-200 bg-slate-900/90 border border-slate-800 rounded-xl outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Select a task to anchor your focus session...</option>
                    {activeTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} {t.priority === 'high' ? '🔥 [High]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Giant Circular SVG Display */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center my-2">
                <svg className="w-64 h-64 sm:w-80 sm:h-80 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r={fsRadius}
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-800/80"
                    fill="transparent"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r={fsRadius}
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={fsCircumference}
                    strokeDashoffset={fsDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-300 ${
                      timerMode === 'focus' ? 'text-indigo-500' : 'text-emerald-400'
                    }`}
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl sm:text-7xl font-mono font-extrabold text-white tracking-tight leading-none">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-400 font-semibold tracking-wider uppercase mt-3">
                    {Math.round(progressPercent)}% Elapsed
                  </span>
                </div>
              </div>

              {/* Fullscreen Primary Controls */}
              <div className="flex flex-col items-center gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-60)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="-1 Minute"
                  >
                    <Minus className="w-3.5 h-3.5" /> 1m
                  </button>

                  <button
                    id="fullscreen-toggle-timer-btn"
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-8 py-3.5 rounded-2xl text-base font-bold shadow-2xl flex items-center gap-3 transition cursor-pointer transform hover:scale-105 active:scale-95 ${
                      isRunning
                        ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
                        : timerMode === 'focus'
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5 fill-current" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current ml-0.5" /> Resume Focus
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAdjustTime(60)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="+1 Minute"
                  >
                    <Plus className="w-3.5 h-3.5" /> 1m
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset Session"
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Press <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">Space</kbd> to toggle, <kbd className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd> to exit
                  </span>
                </div>
              </div>
            </div>

            {/* Fullscreen Bottom Presets Switcher */}
            <div className="w-full max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-900">
              {PRESETS.map((p) => {
                const isSelected = initialMinutes === p.minutes && timerMode === p.mode;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? p.mode === 'focus'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-semibold'
                          : 'bg-emerald-600 text-white border-emerald-500 shadow-md font-semibold'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
