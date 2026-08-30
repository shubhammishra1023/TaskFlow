import React from 'react';
import { TaskFiltersState, FilterStatus, SortOption } from '../types';
import { Search, X, SlidersHorizontal, Tag } from 'lucide-react';

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFilterChange: (updates: Partial<TaskFiltersState>) => void;
  categories: string[];
  counts: {
    all: number;
    active: number;
    completed: number;
  };
  matchingCount?: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
  categories,
  counts,
  matchingCount,
}) => {
  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.searchQuery.trim() !== '' ||
    filters.status !== 'all';

  const isSearching = filters.searchQuery.trim().length > 0;

  const resetFilters = () => {
    onFilterChange({
      status: 'all',
      category: 'all',
      tag: 'all',
      priority: 'all',
      searchQuery: '',
      sortBy: 'createdAt-desc',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-4.5 mb-6 space-y-3.5 transition-colors duration-200">
      {/* Top row: Status Tabs + Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status segmented controls */}
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 gap-1 shrink-0">
          {(
            [
              { key: 'all', label: 'All', count: counts.all },
              { key: 'active', label: 'Active', count: counts.active },
              { key: 'completed', label: 'Done', count: counts.completed },
            ] as { key: FilterStatus; label: string; count: number }[]
          ).map((tab) => {
            const isActive = filters.status === tab.key;
            return (
              <button
                key={tab.key}
                id={`filter-tab-${tab.key}`}
                type="button"
                onClick={() => onFilterChange({ status: tab.key })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-tasks-input"
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by title or tag (e.g. #Work)..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 rounded-xl outline-hidden transition"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Search & Filter Status banner if query is present */}
      {isSearching && typeof matchingCount === 'number' && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
          <span className="flex items-center gap-1.5">
            <Search className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>
              Searching for <strong className="font-semibold text-indigo-950 dark:text-white">"{filters.searchQuery}"</strong> — found{' '}
              <strong className="font-semibold text-indigo-950 dark:text-white">{matchingCount}</strong> {matchingCount === 1 ? 'task' : 'tasks'}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-950 dark:hover:text-white underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Bottom row: Category & Tags Pills + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Category / Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium mr-0.5 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Filter:
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'all' })}
            className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
              filters.category === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            All Tags
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onFilterChange({ category: cat })}
              className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                filters.category === cat
                  ? cat === 'Urgent'
                    ? 'bg-rose-600 dark:bg-rose-500 text-white font-medium shadow-xs'
                    : cat === 'Work'
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white font-medium shadow-xs'
                    : cat === 'Personal'
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-xs'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Priority and Sort Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="px-2 py-1 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Sort selector */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="px-2 py-1 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="manual">Custom (Drag & Drop)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueDate-asc">Due Date</option>
              <option value="priority-desc">Priority</option>
              <option value="title-asc">Alphabetical</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
