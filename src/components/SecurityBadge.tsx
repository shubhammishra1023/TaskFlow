import React, { useState } from 'react';
import { ShieldCheck, Info, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SecurityBadge: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="mt-8 pt-4">
      <div className="bg-slate-900 dark:bg-slate-900/90 border border-slate-800 dark:border-slate-800 rounded-2xl p-4 sm:p-5 text-xs text-white shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-medium text-sm text-white">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Database Security & Isolation Active</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition font-medium cursor-pointer"
          >
            <span>{isOpen ? 'Hide Details' : 'Security Details'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-2.5 text-xs leading-relaxed animate-in fade-in duration-150">
            <div className="flex items-start gap-2.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-slate-300">
                <strong className="text-white font-medium">User-Isolated Path:</strong> Your tasks are exclusively stored in{' '}
                <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded-md font-mono text-[11px] border border-slate-700">
                  /users/{user.uid}/tasks
                </code>
                .
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-slate-300">
                <strong className="text-white font-medium">Firestore Rule Enforcement:</strong> Server-side security rules strictly forbid other authenticated users or anonymous clients from querying or modifying your task records.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <p className="text-slate-300">
                <strong className="text-white font-medium">Real-Time Sync:</strong> Powered by Firestore snapshot listeners for instantaneous multi-device synchronization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
