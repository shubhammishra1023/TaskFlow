import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  LogOut,
  CheckSquare,
  User as UserIcon,
  Sun,
  Moon,
  Bell,
  BellOff,
  BellRing,
  Keyboard,
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  NotificationPermissionState,
} from '../utils/notifications';

interface NavbarProps {
  onOpenShortcutsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenShortcutsModal }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationState, setNotificationState] = useState<NotificationPermissionState>('default');

  useEffect(() => {
    setNotificationState(getNotificationPermission());
  }, []);

  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationState(perm);
  };

  const handleOpenShortcuts = () => {
    if (onOpenShortcutsModal) {
      onOpenShortcutsModal();
    } else {
      window.dispatchEvent(new CustomEvent('toggle-shortcuts-guide'));
    }
  };

  return (
    <header className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Todo
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Collaborative Firestore
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Keyboard Shortcuts Trigger */}
          {user && (
            <button
              id="keyboard-shortcuts-nav-btn"
              type="button"
              onClick={handleOpenShortcuts}
              title="Keyboard Shortcuts Guide (Press ?)"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-2xs"
            >
              <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline font-medium">Shortcuts</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 font-mono text-[10px] bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">?</kbd>
            </button>
          )}
          {/* Notification Permission Quick Trigger */}
          {user && (
            <button
              id="notification-toggle-btn"
              type="button"
              onClick={handleRequestNotifications}
              title={
                notificationState === 'granted'
                  ? 'Browser notifications enabled for task deadlines'
                  : notificationState === 'denied'
                  ? 'Browser notifications blocked in browser settings'
                  : 'Enable browser notifications for approaching deadlines'
              }
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                notificationState === 'granted'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : notificationState === 'denied'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 opacity-70'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600'
              }`}
            >
              {notificationState === 'granted' ? (
                <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : notificationState === 'denied' ? (
                <BellOff className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {notificationState === 'granted' ? 'Alerts Active' : 'Alerts'}
              </span>
            </button>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center shadow-xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* User Profile Info & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl pl-1.5 pr-2.5 sm:pr-3 py-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <div className="text-left max-w-[100px] sm:max-w-[160px] truncate hidden xs:block">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-tight">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                id="sign-out-button"
                onClick={() => signOut()}
                title="Sign Out"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
