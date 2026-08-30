import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    }
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export function getDueDateStatus(dueDate?: string, completed?: boolean): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  colorClass: string;
} {
  if (!dueDate || completed) {
    return { label: '', isOverdue: false, isToday: false, colorClass: 'text-stone-500' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDate.split('-');
  if (parts.length !== 3) {
    return { label: dueDate, isOverdue: false, isToday: false, colorClass: 'text-stone-500' };
  }

  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`,
      isOverdue: true,
      isToday: false,
      colorClass: 'text-rose-600 font-medium',
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due today',
      isOverdue: false,
      isToday: true,
      colorClass: 'text-amber-600 font-medium',
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      isOverdue: false,
      isToday: false,
      colorClass: 'text-emerald-700',
    };
  } else {
    return {
      label: `Due ${formatDate(dueDate)}`,
      isOverdue: false,
      isToday: false,
      colorClass: 'text-stone-600',
    };
  }
}
