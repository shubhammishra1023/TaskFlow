import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RefreshCw, AlertCircle, Loader2, Lock, Sparkles, HeartHandshake } from 'lucide-react';
import { APP_LOGO_SRC, APP_NAME } from '../assets/logo';

export const AuthScreen: React.FC = () => {
  const { signIn, authError, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-lg p-6 sm:p-8 text-center">
        {/* App Logo */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md mx-auto mb-4 border border-indigo-200/60 dark:border-indigo-900/60 bg-slate-900 flex items-center justify-center">
          <img
            src={APP_LOGO_SRC}
            alt="Taskflow Done Logo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 flex items-center justify-center gap-1.5">
          <span>Taskflow</span>
          <span className="text-indigo-600 dark:text-indigo-400">Done</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Transform your productivity with daily mindful reflections, collaborative task tracking, and inspiring constructive feedback.
        </p>

        {authError && (
          <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-rose-800 dark:text-rose-300 font-medium">
              <p className="font-semibold mb-0.5">Authentication Notice</p>
              <p>{authError}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-white text-xs font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          id="google-sign-in-btn"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-6"
        >
          {isSigningIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-700 dark:text-slate-200" />
              <span>Connecting with Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Security & Architecture Highlights */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 gap-2.5 text-left text-xs">
          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Isolated Firestore Security</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Firestore rules strictly enforce user separation at the database path level.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
            <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Real-Time Sync</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Changes reflect instantly across all active browser sessions and tabs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-xl">
            <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Google OAuth 2.0</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Protected by Google's industry-standard authentication protocol.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
