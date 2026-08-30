import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserIdentity } from '../services/taskService';
import {
  ListPlus,
  X,
  Mail,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { createTaskList } from '../services/taskService';

interface CreateListModalProps {
  user: UserIdentity;
  onCreated: (newListId: string) => void;
  onClose: () => void;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  user,
  onCreated,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collaboratorsInput, setCollaboratorsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a list name.');
      return;
    }

    // Parse collaborator emails (split by comma or whitespace)
    const rawEmails = collaboratorsInput
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    const invalidEmails = rawEmails.filter((e) => !e.includes('@') || !e.includes('.'));
    if (invalidEmails.length > 0) {
      setError(`Invalid email address format: ${invalidEmails.join(', ')}`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const newListId = await createTaskList(user, name, description, rawEmails);
      onCreated(newListId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task list.');
    } finally {
      setLoading(false);
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
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ListPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">Create New Task List</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Organize tasks and optionally invite teammates
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

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* List Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                List Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="new-list-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Work Sprint, House Renovation, Grocery List"
                autoFocus
                className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 rounded-xl outline-hidden transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief purpose or goals for this list"
                className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 rounded-xl outline-hidden transition"
              />
            </div>

            {/* Initial Collaborator Emails */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Share with Collaborators (Optional)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Separate by comma</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <textarea
                  value={collaboratorsInput}
                  onChange={(e) => setCollaboratorsInput(e.target.value)}
                  rows={2}
                  placeholder="alex@example.com, sam@company.org"
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 rounded-xl outline-hidden resize-none transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="create-list-submit-btn"
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ListPlus className="w-3.5 h-3.5" />
                )}
                <span>Create List</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
