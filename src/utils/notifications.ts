// Browser Notification API utility for Task Due Dates and Reminders
import { Task } from '../types';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const notifiedTasksCache = new Set<string>();

export const getNotificationPermission = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return getNotificationPermission();
  }
};

export const sendBrowserNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (getNotificationPermission() !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/icon.png',
      badge: '/icon.png',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Failed to display browser notification:', err);
    return null;
  }
};

/**
 * Evaluates active tasks and triggers browser notifications for tasks whose
 * due date is reached (today), overdue, or approaching (tomorrow).
 */
export const checkAndNotifyDueTasks = (tasks: Task[]): {
  overdueCount: number;
  dueTodayCount: number;
  dueSoonCount: number;
} => {
  if (getNotificationPermission() !== 'granted') {
    return { overdueCount: 0, dueTodayCount: 0, dueSoonCount: 0 };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
    tomorrow.getDate()
  ).padStart(2, '0')}`;

  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueSoonCount = 0;

  tasks.forEach((task) => {
    if (task.completed || !task.dueDate) return;

    const taskDate = task.dueDate;

    if (taskDate < todayStr) {
      // Overdue
      overdueCount++;
      const cacheKey = `overdue-${task.id}-${todayStr}`;
      if (!notifiedTasksCache.has(cacheKey)) {
        notifiedTasksCache.add(cacheKey);
        sendBrowserNotification(`⚠️ Task Overdue: ${task.title}`, {
          body: `This task was due on ${task.dueDate}. Priority: ${task.priority.toUpperCase()}`,
          tag: cacheKey,
        });
      }
    } else if (taskDate === todayStr) {
      // Due Today
      dueTodayCount++;
      const cacheKey = `today-${task.id}-${todayStr}`;
      if (!notifiedTasksCache.has(cacheKey)) {
        notifiedTasksCache.add(cacheKey);
        sendBrowserNotification(`⏰ Task Due Today: ${task.title}`, {
          body: `Due today! Don't forget to complete it. Priority: ${task.priority.toUpperCase()}`,
          tag: cacheKey,
        });
      }
    } else if (taskDate === tomorrowStr) {
      // Approaching tomorrow
      dueSoonCount++;
      const cacheKey = `tomorrow-${task.id}-${todayStr}`;
      if (!notifiedTasksCache.has(cacheKey)) {
        notifiedTasksCache.add(cacheKey);
        sendBrowserNotification(`📅 Task Due Tomorrow: ${task.title}`, {
          body: `Approaching deadline: scheduled for tomorrow (${task.dueDate}).`,
          tag: cacheKey,
        });
      }
    }
  });

  return { overdueCount, dueTodayCount, dueSoonCount };
};
