import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, TaskList, TaskFiltersState, Priority, DailyNote } from '../types';
import {
  subscribeToUserTaskLists,
  subscribeToListTasks,
  addTaskToList,
  toggleTaskStatusInList,
  updateTaskInList,
  deleteTaskFromList,
  deleteMultipleTasksFromList,
  reorderTasksInList,
} from '../services/taskService';
import { subscribeToUserDailyNotes } from '../services/dailyNotesService';
import { checkAndNotifyDueTasks } from '../utils/notifications';
import { TaskListManager } from './TaskListManager';
import { ShareListModal } from './ShareListModal';
import { CreateListModal } from './CreateListModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { DailyNoteModal } from './DailyNoteModal';
import { TaskInput } from './TaskInput';
import { TaskFilters } from './TaskFilters';
import { TaskSummaryChart } from './TaskSummaryChart';
import { DailyProductivityChart } from './DailyProductivityChart';
import { FocusTimer } from './FocusTimer';
import { ReorderableTaskItem } from './ReorderableTaskItem';
import { TaskEditModal } from './TaskEditModal';
import { SecurityBadge } from './SecurityBadge';
import { Reorder, AnimatePresence } from 'motion/react';
import {
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Loader2,
  GripVertical,
  Keyboard,
  Share2,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  HeartHandshake,
  BookOpen,
  Lightbulb,
  Brain,
  Zap,
} from 'lucide-react';

export const TodoDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Lists State
  const [lists, setLists] = useState<TaskList[]>([]);
  const [currentList, setCurrentList] = useState<TaskList | null>(null);
  const [loadingLists, setLoadingLists] = useState(true);

  // Analytics View Tab: 'productivity' | 'overview'
  const [analyticsTab, setAnalyticsTab] = useState<'productivity' | 'overview'>('productivity');

  // Tasks State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Modals State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isDailyNoteModalOpen, setIsDailyNoteModalOpen] = useState(false);

  // Daily Mind & Emotion Notes State
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);

  // Power User Keyboard Selection State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [filters, setFilters] = useState<TaskFiltersState>({
    status: 'all',
    category: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'manual',
  });

  // 1. Subscribe to User's Task Lists
  useEffect(() => {
    if (!user) {
      setLists([]);
      setCurrentList(null);
      setLoadingLists(false);
      return;
    }

    setLoadingLists(true);
    const unsubscribe = subscribeToUserTaskLists(
      user.uid,
      user.email,
      (fetchedLists) => {
        setLists(fetchedLists);
        setLoadingLists(false);

        // Auto-select list if none selected or if previous list no longer exists
        setCurrentList((prev) => {
          if (!prev) {
            return fetchedLists.length > 0 ? fetchedLists[0] : null;
          }
          const stillExists = fetchedLists.find((l) => l.id === prev.id);
          return stillExists || (fetchedLists.length > 0 ? fetchedLists[0] : null);
        });
      },
      (err) => {
        setError('Error synchronizing task lists: ' + err.message);
        setLoadingLists(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 1b. Subscribe to Daily Mind & Emotion Reflection Notes
  useEffect(() => {
    if (!user) {
      setDailyNotes([]);
      return;
    }

    const unsubscribeNotes = subscribeToUserDailyNotes(
      user.uid,
      (fetchedNotes) => {
        setDailyNotes(fetchedNotes);
      },
      (err) => {
        console.error('Error synchronizing daily notes:', err);
      }
    );

    return () => unsubscribeNotes();
  }, [user]);

  // Global listener for navbar / shortcuts trigger
  useEffect(() => {
    const handleToggleDailyNote = () => setIsDailyNoteModalOpen((prev) => !prev);
    window.addEventListener('toggle-daily-note', handleToggleDailyNote);
    return () => window.removeEventListener('toggle-daily-note', handleToggleDailyNote);
  }, []);

  // Today's date and note memo
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const todayNote = useMemo(() => dailyNotes.find((n) => n.date === todayStr), [dailyNotes, todayStr]);

  // 2. Subscribe to Tasks of Currently Selected List
  useEffect(() => {
    if (!currentList) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    setError(null);

    const unsubscribe = subscribeToListTasks(
      currentList.id,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoadingTasks(false);
      },
      (err) => {
        setError('Error loading tasks for list: ' + err.message);
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [currentList?.id]);

  // 3. Automated browser notification trigger on tasks load & change
  useEffect(() => {
    if (tasks.length > 0) {
      checkAndNotifyDueTasks(tasks);
    }
  }, [tasks]);

  // Periodic check every 5 minutes for upcoming/overdue tasks
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        checkAndNotifyDueTasks(tasks);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (filters.status === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filters.status === 'completed') {
      result = result.filter((t) => t.completed);
    }

    // Category / Tag filter
    if (filters.category !== 'all') {
      result = result.filter((t) => {
        if (t.tags && t.tags.length > 0) {
          return t.tags.includes(filters.category) || t.category === filters.category;
        }
        return t.category === filters.category;
      });
    }

    // Priority filter
    if (filters.priority !== 'all') {
      result = result.filter((t) => t.priority === filters.priority);
    }

    // Search filter
    if (filters.searchQuery.trim()) {
      const rawQ = filters.searchQuery.toLowerCase().trim();
      const cleanQ = rawQ.startsWith('#') ? rawQ.slice(1).trim() : rawQ;
      result = result.filter((t) => {
        const matchesTitle = t.title.toLowerCase().includes(cleanQ) || t.title.toLowerCase().includes(rawQ);
        const matchesDescription = !!t.description && (t.description.toLowerCase().includes(cleanQ) || t.description.toLowerCase().includes(rawQ));
        const matchesCategory = !!t.category && (t.category.toLowerCase().includes(cleanQ) || t.category.toLowerCase().includes(rawQ));
        const matchesAuthor = !!t.createdByEmail && t.createdByEmail.toLowerCase().includes(cleanQ);
        const matchesTags =
          !!t.tags &&
          t.tags.some(
            (tag) =>
              tag.toLowerCase().includes(cleanQ) ||
              tag.toLowerCase().includes(rawQ) ||
              `#${tag.toLowerCase()}`.includes(rawQ)
          );
        return matchesTitle || matchesTags || matchesCategory || matchesDescription || matchesAuthor;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'manual': {
          const orderA = typeof a.order === 'number' ? a.order : a.createdAt ? -a.createdAt : 0;
          const orderB = typeof b.order === 'number' ? b.order : b.createdAt ? -b.createdAt : 0;
          return orderA - orderB;
        }
        case 'createdAt-asc':
          return a.createdAt - b.createdAt;
        case 'dueDate-asc': {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case 'priority-desc': {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'createdAt-desc':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [tasks, filters]);

  // Selected task object
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return filteredAndSortedTasks.find((t) => t.id === selectedTaskId) || null;
  }, [filteredAndSortedTasks, selectedTaskId]);

  // Handle adding a task
  const handleAddTask = async (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    category: string;
    tags?: string[];
    dueDate?: string;
  }) => {
    if (!user || !currentList) return;
    try {
      const minOrder =
        tasks.length > 0
          ? Math.min(...tasks.map((t) => (typeof t.order === 'number' ? t.order : 0)))
          : 0;
      await addTaskToList(
        currentList.id,
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
        {
          ...taskData,
          order: minOrder - 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
      throw err;
    }
  };

  // Handle manual drag-and-drop reorder
  const handleReorder = (newOrderedList: Task[]) => {
    if (!currentList) return;
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      const reorderedIds = new Set(newOrderedList.map((t) => t.id));

      const targetIndices: number[] = [];
      prevTasks.forEach((t, idx) => {
        if (reorderedIds.has(t.id)) {
          targetIndices.push(idx);
        }
      });

      newOrderedList.forEach((task, idx) => {
        if (targetIndices[idx] !== undefined) {
          updatedTasks[targetIndices[idx]] = task;
        }
      });

      const tasksWithSequentialOrder = updatedTasks.map((t, idx) => ({
        ...t,
        order: idx,
      }));

      const orderPayload = tasksWithSequentialOrder.map((t, idx) => ({
        id: t.id,
        order: idx,
      }));
      reorderTasksInList(currentList.id, orderPayload).catch((err) => {
        console.error('Failed to sync reordered tasks to Firestore:', err);
      });

      return tasksWithSequentialOrder;
    });

    if (filters.sortBy !== 'manual') {
      setFilters((prev) => ({ ...prev, sortBy: 'manual' }));
    }
  };

  // Handle toggle task completion
  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!currentList) return;
    try {
      await toggleTaskStatusInList(currentList.id, taskId, completed);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  // Handle edit task
  const handleSaveTask = async (taskId: string, updates: Partial<Task>) => {
    if (!currentList) return;
    try {
      await updateTaskInList(currentList.id, taskId, updates);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
      throw err;
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!currentList) return;
    try {
      await deleteTaskFromList(currentList.id, taskId);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  // Clear all completed tasks
  const handleClearCompleted = async () => {
    if (!currentList) return;
    const completedIds = tasks.filter((t) => t.completed).map((t) => t.id);
    if (completedIds.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${completedIds.length} completed task(s)?`)) {
      try {
        await deleteMultipleTasksFromList(currentList.id, completedIds);
        if (selectedTaskId && completedIds.includes(selectedTaskId)) {
          setSelectedTaskId(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to clear completed tasks');
      }
    }
  };

  // -------------------------------------------------------------
  // Power User Keyboard Shortcuts Event Listener
  // -------------------------------------------------------------
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // 1. Escape key: dismiss modals or blur inputs or clear task selection
      if (e.key === 'Escape') {
        if (isShareModalOpen) {
          setIsShareModalOpen(false);
          return;
        }
        if (isCreateListModalOpen) {
          setIsCreateListModalOpen(false);
          return;
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (editingTask) {
          setEditingTask(null);
          return;
        }
        if (isInput) {
          target.blur();
          return;
        }
        if (selectedTaskId) {
          setSelectedTaskId(null);
          return;
        }
      }

      // If user is actively typing in a form or input, do not trigger single-key action shortcuts
      if (isInput) {
        return;
      }

      // 2. '?' or 'Shift + /' -> Toggle Keyboard Shortcuts Guide Modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 3. 'N' or 'n' -> Focus new task input field
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const taskInput = document.getElementById('task-title-input');
        if (taskInput) {
          taskInput.focus();
        }
        return;
      }

      // 4. 'F' or 'f' or '/' -> Focus search input field
      if (e.key === 'f' || e.key === 'F' || e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-tasks-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // 5. 'S' or 's' -> Open Share List Modal
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentList) {
          setIsShareModalOpen(true);
        }
        return;
      }

      // 6. 'L' or 'l' -> Trigger List Switcher button
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const listBtn = document.getElementById('list-switcher-btn');
        if (listBtn) {
          listBtn.click();
        }
        return;
      }

      // 7. 'C' or 'c' -> Open Create New List Modal
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateListModalOpen(true);
        return;
      }

      // 8. Navigation: 'J' / 'ArrowDown' -> Select next task down
      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredAndSortedTasks.length === 0) return;

        const currentIndex = filteredAndSortedTasks.findIndex((t) => t.id === selectedTaskId);
        if (currentIndex === -1) {
          setSelectedTaskId(filteredAndSortedTasks[0].id);
        } else {
          const nextIndex = (currentIndex + 1) % filteredAndSortedTasks.length;
          setSelectedTaskId(filteredAndSortedTasks[nextIndex].id);
        }
        return;
      }

      // 9. Navigation: 'K' / 'ArrowUp' -> Select previous task up
      if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredAndSortedTasks.length === 0) return;

        const currentIndex = filteredAndSortedTasks.findIndex((t) => t.id === selectedTaskId);
        if (currentIndex === -1) {
          setSelectedTaskId(filteredAndSortedTasks[filteredAndSortedTasks.length - 1].id);
        } else {
          const prevIndex = (currentIndex - 1 + filteredAndSortedTasks.length) % filteredAndSortedTasks.length;
          setSelectedTaskId(filteredAndSortedTasks[prevIndex].id);
        }
        return;
      }

      // 10. 'Space' or 'X' or 'x' -> Toggle completion of selected task
      if ((e.key === ' ' || e.key === 'x' || e.key === 'X') && selectedTask) {
        e.preventDefault();
        handleToggleTask(selectedTask.id, !selectedTask.completed);
        return;
      }

      // 11. 'Delete' or 'Backspace' -> Delete selected task
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTask) {
        e.preventDefault();
        handleDeleteTask(selectedTask.id);
        return;
      }

      // 12. 'E' or 'e' or 'Enter' -> Open Edit Modal for selected task
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && selectedTask) {
        e.preventDefault();
        setEditingTask(selectedTask);
        return;
      }
    },
    [
      isShareModalOpen,
      isCreateListModalOpen,
      isShortcutsModalOpen,
      editingTask,
      selectedTaskId,
      selectedTask,
      filteredAndSortedTasks,
      currentList,
    ]
  );

  useEffect(() => {
    const handleToggleGuide = () => {
      setIsShortcutsModalOpen((prev) => !prev);
    };
    window.addEventListener('toggle-shortcuts-guide', handleToggleGuide);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('toggle-shortcuts-guide', handleToggleGuide);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // Collect unique categories & tags across tasks
  const categories = useMemo(() => {
    const defaultTags = ['Work', 'Personal', 'Urgent', 'Shopping', 'Health'];
    const customTags = tasks.flatMap((t) =>
      t.tags && t.tags.length > 0
        ? t.tags
        : t.category
        ? [t.category]
        : []
    );
    return Array.from(new Set([...defaultTags, ...customTags]));
  }, [tasks]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    };
  }, [tasks]);

  const handleFilterUpdate = (updates: Partial<TaskFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Error notification */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-sm text-rose-900 dark:text-rose-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-950 dark:text-white">Action Error</p>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-medium text-rose-700 dark:text-rose-300 hover:text-rose-950 dark:hover:text-white px-2 py-1 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Task List Selector & Collaboration Header */}
      {user && (
        <TaskListManager
          lists={lists}
          currentList={currentList}
          currentUserId={user.uid}
          currentUserEmail={user.email}
          onSelectList={(list) => {
            setCurrentList(list);
            setSelectedTaskId(null);
          }}
          onOpenCreateModal={() => setIsCreateListModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      )}

      {/* Analytics & Progress Chart Section with Interactive Views */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Analytics & Metrics
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              id="view-tab-productivity-btn"
              type="button"
              onClick={() => setAnalyticsTab('productivity')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                analyticsTab === 'productivity'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily Progress</span>
            </button>
            <button
              id="view-tab-overview-btn"
              type="button"
              onClick={() => setAnalyticsTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                analyticsTab === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Ratio Overview</span>
            </button>
          </div>
        </div>

        {analyticsTab === 'productivity' ? (
          <DailyProductivityChart
            tasks={tasks}
            dailyNotes={dailyNotes}
            onOpenDailyNoteModal={() => setIsDailyNoteModalOpen(true)}
          />
        ) : (
          <TaskSummaryChart
            tasks={tasks}
            onClearCompleted={counts.completed > 0 ? handleClearCompleted : undefined}
          />
        )}
      </div>

      {/* Daily Thoughts & Mindset Reflection Card (Single Humble Note Box) */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-100/90 dark:border-indigo-900/50 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Daily Thoughts & Mindset Reflection
                </h3>
                {todayNote ? (
                  <>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3" />
                      {todayNote.detectedEmotion || 'Reflective & Honest'}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Productivity: {todayNote.productivityScore ?? todayNote.positivityScore}%
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Pending Today's Note
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                {todayNote
                  ? todayNote.feedback?.improveThinking
                    ? `Mindset Shift: "${todayNote.feedback.improveThinking}"`
                    : todayNote.feedback?.howToDoBetter
                    ? `Growth Tip: "${todayNote.feedback.howToDoBetter}"`
                    : todayNote.noteText?.slice(0, 110) || 'Your reflection is securely saved for today.'
                  : `Type your raw and humble thoughts in one simple box—no multiple questions. We'll analyze your emotional state, evaluate your daily productivity, and share personalized advice on how to improve your way of thinking.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsDailyNoteModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {todayNote ? (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>View / Edit Note</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Write Thoughts (M)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Focus Timer with Prescribed & Custom Presets & Distraction-Free Fullscreen */}
      <FocusTimer
        tasks={tasks}
        onCompleteTask={handleToggleTask}
      />

      {/* Task Input Section */}
      <TaskInput onAddTask={handleAddTask} />

      {/* Filters and Controls with Real-Time Search */}
      {tasks.length > 0 && (
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterUpdate}
          categories={categories}
          counts={counts}
          matchingCount={filteredAndSortedTasks.length}
        />
      )}

      {/* Tasks List Content */}
      {loadingTasks || loadingLists ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-2.5" />
          <p className="text-xs font-medium">Syncing collaborative list with Firestore...</p>
        </div>
      ) : filteredAndSortedTasks.length > 0 ? (
        <div className="space-y-2.5">
          {/* Subtle drag-and-drop indicator & keyboard navigation tip */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Drag items to reorder or navigate with <kbd className="px-1.5 py-0.2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">J</kbd>/<kbd className="px-1.5 py-0.2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">K</kbd></span>
            </span>
            {filters.sortBy !== 'manual' && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, sortBy: 'manual' }))}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-[11px] underline cursor-pointer"
              >
                Switch to custom order
              </button>
            )}
          </div>

          <Reorder.Group
            axis="y"
            values={filteredAndSortedTasks}
            onReorder={handleReorder}
            className="space-y-2.5 list-none p-0 m-0"
          >
            <AnimatePresence initial={false}>
              {filteredAndSortedTasks.map((task) => (
                <ReorderableTaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={(t) => setSelectedTaskId(t.id)}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={(t) => setEditingTask(t)}
                  isDragEnabled={true}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-12 text-center my-4 shadow-xs transition-colors duration-200">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-3">
            {filters.searchQuery || filters.status !== 'all' || filters.category !== 'all' ? (
              <ClipboardList className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {filters.searchQuery || filters.status !== 'all' || filters.category !== 'all'
              ? 'No matching tasks'
              : 'No tasks in this list yet'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {filters.searchQuery || filters.status !== 'all' || filters.category !== 'all'
              ? 'Try changing your search keywords or clearing active filters.'
              : 'Add your first task above (press N) or invite teammates to collaborate in real-time (press S).'}
          </p>

          {(filters.searchQuery || filters.status !== 'all' || filters.category !== 'all') && (
            <button
              onClick={() =>
                setFilters({
                  status: 'all',
                  category: 'all',
                  priority: 'all',
                  searchQuery: '',
                  sortBy: 'manual',
                })
              }
              className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Floating Keyboard Shortcuts Trigger Badge */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setIsShortcutsModalOpen(true)}
          className="px-3 py-2 bg-white/95 dark:bg-slate-900/95 hover:bg-indigo-50 dark:hover:bg-indigo-950/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2 text-xs font-medium transition cursor-pointer"
        >
          <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Shortcuts</span>
          <kbd className="px-1.5 py-0.2 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">?</kbd>
        </button>
      </div>

      {/* Security & Architecture Verification Badge */}
      <SecurityBadge />

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Share List Modal */}
      {isShareModalOpen && currentList && user && (
        <ShareListModal
          list={currentList}
          currentUserId={user.uid}
          currentUserEmail={user.email}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Create List Modal */}
      {isCreateListModalOpen && user && (
        <CreateListModal
          user={{
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          }}
          onCreated={(newListId) => {
            // New list will be loaded via snapshot and auto-selected
          }}
          onClose={() => setIsCreateListModalOpen(false)}
        />
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Daily Mind & Emotion Journal Modal */}
      {user && (
        <DailyNoteModal
          isOpen={isDailyNoteModalOpen}
          onClose={() => setIsDailyNoteModalOpen(false)}
          userId={user.uid}
          existingNotes={dailyNotes}
          onNoteSaved={() => {}}
        />
      )}
    </div>
  );
};
