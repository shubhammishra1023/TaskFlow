import React, { useState } from 'react';
import { Priority } from '../types';
import { Plus, Calendar, Tag, AlertCircle, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';

interface TaskInputProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: Priority;
    category: string;
    tags?: string[];
    dueDate?: string;
  }) => Promise<void>;
}

const PRESET_TAGS = ['Work', 'Personal', 'Urgent', 'Shopping', 'Health', 'Finance', 'Ideas'];

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Personal']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  const setPresetDate = (daysFromToday: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromToday);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const primaryCategory = selectedTags.length > 0 ? selectedTags[0] : 'General';
      await onAddTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: primaryCategory,
        tags: selectedTags.length > 0 ? selectedTags : ['General'],
        dueDate: dueDate || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setSelectedTags(['Personal']);
      setCustomTagInput('');
      setIsExpanded(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 mb-6 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <form onSubmit={handleSubmit}>
        {/* Main Input Row */}
        <div className="flex items-center gap-2.5">
          <input
            id="task-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Add a new task... (press Enter to create)"
            className="flex-1 px-4 py-2.5 text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/70 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/10 rounded-xl outline-hidden transition"
            disabled={isSubmitting}
          />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Fewer options' : 'More options (tags, priority, due date)'}
            className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isExpanded
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Options</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            id="add-task-btn"
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>

        {/* Quick Config Bar (Priority & Due Date) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Selector directly accessible */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Priority:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md capitalize transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-semibold shadow-xs'
                            : p === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-semibold shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p === 'high'
                            ? 'bg-rose-500'
                            : p === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Due Date picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Deadline:
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-md outline-hidden cursor-pointer transition"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  title="Clear deadline"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Tags count & toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Tags ({selectedTags.length}):
            </span>
            <div className="flex items-center gap-1">
              {selectedTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {tag}
                </span>
              ))}
              {selectedTags.length > 2 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  +{selectedTags.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-medium text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Expandable Options */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Tags & Categories selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Add Categories & Tags (e.g. Work, Personal, Urgent)
              </label>
              
              {/* Preset Tag Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                {PRESET_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? tag === 'Urgent'
                            ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                            : tag === 'Work'
                            ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300'
                            : tag === 'Personal'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleCustomTagKeyDown}
                  placeholder="Or type a custom tag and press Enter..."
                  className="flex-1 px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 rounded-lg outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTagInput.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-200 rounded-lg transition cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Priority Selector (Expanded) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Priority Level
                </label>
                <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-1">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        priority === p
                          ? p === 'high'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 shadow-xs font-semibold'
                            : p === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 shadow-xs font-semibold'
                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p === 'high'
                            ? 'bg-rose-500 animate-pulse'
                            : p === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date Picker & Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Deadline Date
                </label>
                <div className="space-y-1.5">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl outline-hidden transition"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPresetDate(0)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(1)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDate(7)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition cursor-pointer"
                    >
                      +1 Week
                    </button>
                    {dueDate && (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer ml-auto"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Description / Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes / Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add additional context, links, or sub-details..."
                  className="w-full px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl outline-hidden resize-none transition"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
