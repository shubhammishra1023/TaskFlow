import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { getDueDateStatus } from '../lib/utils';
import {
  Check,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  GripVertical,
  User,
  CornerDownLeft,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (task: Task) => void;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.PointerEvent) => void;
  isDragEnabled?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelected = false,
  onSelect,
  onToggle,
  onDelete,
  onEdit,
  onDragStart,
  isDragEnabled,
}) => {
  const [isExpandingDetails, setIsExpandingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJustToggled, setIsJustToggled] = useState(false);

  const dueStatus = getDueDateStatus(task.dueDate, task.completed);
  const displayTags = task.tags && task.tags.length > 0
    ? task.tags
    : task.category
    ? [task.category]
    : [];

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompletedState = !task.completed;
    setIsJustToggled(true);
    setTimeout(() => setIsJustToggled(false), 500);

    if (nextCompletedState) {
      try {
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
          disableForReducedMotion: true,
        });
      } catch {
        // Fallback gracefully
      }
    }
    await onToggle(task.id, nextCompletedState);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    // Smooth delay for exit transition before deletion completes
    try {
      await onDelete(task.id);
    } catch {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const renderTagBadge = (tag: string) => {
    switch (tag) {
      case 'Urgent':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            {tag}
          </span>
        );
      case 'Work':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {tag}
          </span>
        );
      case 'Personal':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {tag}
          </span>
        );
      case 'Shopping':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {tag}
          </span>
        );
      case 'Health':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            {tag}
          </span>
        );
      case 'Finance':
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {tag}
          </span>
        );
      default:
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
            {tag}
          </span>
        );
    }
  };

  const priorityBadge = () => {
    switch (task.priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Med
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Low
          </span>
        );
    }
  };

  const getPriorityBorderClass = () => {
    if (task.completed) return 'border-l-slate-300 dark:border-l-slate-700';
    switch (task.priority) {
      case 'high':
        return 'border-l-rose-500';
      case 'medium':
        return 'border-l-amber-400';
      case 'low':
      default:
        return 'border-l-slate-300 dark:border-l-slate-700';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        x: isDeleting ? -20 : 0,
        scale: isDeleting ? 0.95 : 1,
        y: 0,
      }}
      exit={{ opacity: 0, x: -24, scale: 0.94, transition: { duration: 0.22 } }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect?.(task)}
      tabIndex={0}
      role="listitem"
      aria-selected={isSelected}
      className={`group relative bg-white dark:bg-slate-900 border border-l-4 ${getPriorityBorderClass()} rounded-xl p-3.5 sm:p-4 transition-all duration-300 ease-in-out cursor-pointer ${
        isDeleting
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30'
          : isSelected
          ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700'
          : task.completed
          ? 'border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs text-slate-900 dark:text-slate-100'
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Drag Handle */}
        {isDragEnabled && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onDragStart?.(e);
            }}
            title="Drag to reorder"
            className="mt-0.5 p-1 -ml-1 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 select-none touch-none"
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Sleek Checkbox with spring & scale bounce transition */}
        <button
          id={`toggle-task-${task.id}`}
          type="button"
          onClick={handleCheckboxClick}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-250 ease-out transform shrink-0 cursor-pointer border ${
            isJustToggled ? 'scale-115 ring-4 ring-indigo-200/80 dark:ring-indigo-900/60' : 'scale-100'
          } ${
            task.completed
              ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
          aria-label={task.completed ? 'Mark task incomplete' : 'Mark task completed'}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`text-sm sm:text-[15px] font-medium leading-snug break-words transition-all duration-300 ease-in-out ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500 font-normal scale-[0.99] origin-left'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </span>

            {/* Badges & Tags */}
            <div className={`flex flex-wrap items-center gap-1.5 shrink-0 transition-opacity duration-300 ${task.completed ? 'opacity-65' : 'opacity-100'}`}>
              {priorityBadge()}
              {displayTags.map(renderTagBadge)}
            </div>
          </div>

          {/* Due date, author and metadata footer */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] ${dueStatus.colorClass}`}>
                <Calendar className="w-3 h-3" />
                {dueStatus.label}
              </span>
            )}

            {/* Author / Collaborator tag */}
            {task.createdByEmail && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                <User className="w-2.5 h-2.5" />
                {task.createdByName || task.createdByEmail.split('@')[0]}
              </span>
            )}

            {task.description && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpandingDetails(!isExpandingDetails);
                }}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isExpandingDetails ? 'Hide notes' : 'View notes'}</span>
                {isExpandingDetails ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}

            {/* Active keyboard shortcuts tip if selected */}
            {isSelected && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                <span>[Space] Complete</span>
                <span>•</span>
                <span>[E] Edit</span>
                <span>•</span>
                <span>[Del] Delete</span>
              </span>
            )}
          </div>

          {/* Expanded description */}
          {isExpandingDetails && task.description && (
            <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/70 dark:border-slate-700 whitespace-pre-wrap">
              {task.description}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            id={`edit-task-${task.id}`}
            type="button"
            onClick={handleEditClick}
            title="Edit task (E)"
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`delete-task-${task.id}`}
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task (Delete)"
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

