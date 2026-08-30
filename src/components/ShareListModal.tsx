import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskList } from '../types';
import {
  Users,
  UserPlus,
  X,
  Mail,
  Crown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { addCollaboratorToList, removeCollaboratorFromList } from '../services/taskService';

interface ShareListModalProps {
  list: TaskList;
  currentUserId: string;
  currentUserEmail?: string | null;
  onClose: () => void;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  list,
  currentUserId,
  currentUserEmail,
  onClose,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOwner = list.ownerId === currentUserId;
  const normalizedUserEmail = (currentUserEmail || '').toLowerCase();

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAdd = emailInput.trim().toLowerCase();
    
    if (!emailToAdd) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!emailToAdd.includes('@') || !emailToAdd.includes('.')) {
      setError('Please enter a valid email format (e.g. colleague@example.com).');
      return;
    }

    if (list.memberEmails.map((e) => e.toLowerCase()).includes(emailToAdd)) {
      setError(`${emailToAdd} is already a member of this list.`);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await addCollaboratorToList(list.id, emailToAdd);
      setEmailInput('');
      setSuccessMessage(`Successfully shared "${list.name}" with ${emailToAdd}. Changes will sync in real-time.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to add collaborator.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (emailToRemove: string) => {
    if (emailToRemove === list.ownerEmail) {
      setError('The list owner cannot be removed.');
      return;
    }

    if (!window.confirm(`Remove ${emailToRemove} from this list? They will lose access immediately.`)) {
      return;
    }

    setError(null);
    try {
      await removeCollaboratorFromList(list.id, emailToRemove);
      setSuccessMessage(`Removed ${emailToRemove} from the list.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">Share List & Collaborate</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-sm">
                  {list.name}
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

          <div className="p-5 space-y-5">
            {/* Real-time Collaboration Banner */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Real-Time Collaboration Active</p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Invited users who log in with their Google email can view, add, edit, and check off tasks collaboratively in real-time.
                </p>
              </div>
            </div>

            {/* Invite Form */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invite by Email
              </label>
              <form onSubmit={handleAddCollaborator} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="collaborator-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 rounded-xl outline-hidden transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !emailInput.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Invite</span>
                </button>
              </form>
            </div>

            {/* Status alerts */}
            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Members List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Members & Collaborators ({list.memberEmails.length})
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {list.memberEmails.length === 1 ? '1 member' : `${list.memberEmails.length} members`}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {list.memberEmails.map((email) => {
                  const isListOwner = email.toLowerCase() === list.ownerEmail.toLowerCase();
                  const isCurrentUser = email.toLowerCase() === normalizedUserEmail;

                  return (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-semibold shrink-0 uppercase">
                          {email.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {email} {isCurrentUser && <span className="text-slate-400">(You)</span>}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {isListOwner ? 'List Creator & Owner' : 'Collaborative Editor'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isListOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                            <Crown className="w-3 h-3 text-amber-500" />
                            Owner
                          </span>
                        ) : isOwner ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(email)}
                            title="Remove collaborator"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Synced via Firestore ABAC Rules</span>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
