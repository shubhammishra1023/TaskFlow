import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Keyboard,
  X,
  Sparkles,
  Command,
  CornerDownLeft,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Task Actions & Management',
    shortcuts: [
      { keys: ['N'], description: 'Focus new task input field', badge: 'Power User' },
      { keys: ['Space', 'or', 'X'], description: 'Toggle complete / incomplete on selected task' },
      { keys: ['E', 'or', 'Enter'], description: 'Open edit modal for selected task' },
      { keys: ['Delete', 'or', 'Backspace'], description: 'Delete selected task' },
    ],
  },
  {
    title: 'Navigation & Selection',
    shortcuts: [
      { keys: ['J', 'or', '↓'], description: 'Move selection to next task down' },
      { keys: ['K', 'or', '↑'], description: 'Move selection to previous task up' },
      { keys: ['Esc'], description: 'Deselect active task or close modals' },
    ],
  },
  {
    title: 'Lists & Real-Time Collaboration',
    shortcuts: [
      { keys: ['S'], description: 'Open Share List modal to invite users via email' },
      { keys: ['L'], description: 'Toggle task list switcher menu' },
      { keys: ['C'], description: 'Create a new task list' },
    ],
  },
  {
    title: 'Search & Global Controls',
    shortcuts: [
      { keys: ['M'], description: 'Open Daily Mind & Emotion Journal (Reflect & Get Feedback)', badge: 'Mindset' },
      { keys: ['F', 'or', '/'], description: 'Focus search & filter input' },
      { keys: ['?'], description: 'Toggle this keyboard shortcuts guide' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">Keyboard Shortcuts Guide</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control everything quickly without lifting your hands from the keyboard
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
            {/* Quick tips alert */}
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Tip: Press <kbd className="px-1.5 py-0.5 font-mono text-[11px] font-semibold bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs">J</kbd> or <kbd className="px-1.5 py-0.5 font-mono text-[11px] font-semibold bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs">K</kbd> to select tasks, then <kbd className="px-1.5 py-0.5 font-mono text-[11px] font-semibold bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs">Space</kbd> to toggle completion!
                </span>
              </span>
            </div>

            {/* Shortcuts Grid */}
            <div className="space-y-4">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    {group.title}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {group.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:px-3 sm:py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {shortcut.description}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {shortcut.keys.map((k, kIdx) => {
                            if (k === 'or') {
                              return (
                                <span key={kIdx} className="text-[10px] text-slate-400 px-0.5">
                                  or
                                </span>
                              );
                            }
                            return (
                              <kbd
                                key={kIdx}
                                className="min-w-[24px] text-center px-2 py-1 font-mono text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs"
                              >
                                {k}
                              </kbd>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Esc</kbd> anytime to dismiss
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
