import React, { useState, useRef, useEffect } from 'react';
import { TaskList } from '../types';
import {
  ListFilter,
  Users,
  Plus,
  Share2,
  ChevronDown,
  Crown,
  Trash2,
  Check,
  Edit3,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { updateTaskList, deleteTaskList } from '../services/taskService';

interface TaskListManagerProps {
  lists: TaskList[];
  currentList: TaskList | null;
  currentUserId: string;
  currentUserEmail?: string | null;
  onSelectList: (list: TaskList) => void;
  onOpenCreateModal: () => void;
  onOpenShareModal: () => void;
}

export const TaskListManager: React.FC<TaskListManagerProps> = ({
  lists,
  currentList,
  currentUserId,
  currentUserEmail,
  onSelectList,
  onOpenCreateModal,
  onOpenShareModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedUserEmail = (currentUserEmail || '').toLowerCase();
  const isOwner = currentList?.ownerId === currentUserId;
  const isShared = (currentList?.memberEmails?.length || 0) > 1;

  // Separate owned lists vs shared-with-me lists
  const myLists = lists.filter((l) => l.ownerId === currentUserId);
  const sharedWithMeLists = lists.filter(
    (l) => l.ownerId !== currentUserId && l.memberEmails?.includes(normalizedUserEmail)
  );

  const handleStartEditing = () => {
    if (!isOwner || !currentList) return;
    setEditedTitle(currentList.name);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!currentList || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      await updateTaskList(currentList.id, { name: editedTitle.trim() });
    } catch (err) {
      console.error('Failed to update list name:', err);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleDeleteCurrentList = async () => {
    if (!currentList || !isOwner) return;
    if (lists.length <= 1) {
      alert('You must have at least one active task list.');
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete the list "${currentList.name}" and all its tasks? This action cannot be undone.`
      )
    ) {
      try {
        await deleteTaskList(currentList.id);
        const remaining = lists.filter((l) => l.id !== currentList.id);
        if (remaining.length > 0) {
          onSelectList(remaining[0]);
        }
      } catch (err) {
        console.error('Failed to delete list:', err);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-3.5 sm:p-4 mb-6 transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Active List Selector & Inline Editor */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Custom Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="list-switcher-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer text-xs font-semibold shadow-2xs"
            >
              <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {currentList ? currentList.name : 'Select List'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-2 text-xs overflow-hidden">
                {/* My Lists Section */}
                <div className="mb-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    My Lists ({myLists.length})
                  </div>
                  <div className="space-y-0.5">
                    {myLists.map((list) => {
                      const isSelected = currentList?.id === list.id;
                      const memberCount = list.memberEmails?.length || 1;
                      return (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => {
                            onSelectList(list);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-semibold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{list.name}</span>
                            {memberCount > 1 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded-full shrink-0">
                                <Users className="w-2.5 h-2.5" />
                                {memberCount}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shared with Me Section */}
                {sharedWithMeLists.length > 0 && (
                  <div className="mb-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>Shared with Me ({sharedWithMeLists.length})</span>
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      {sharedWithMeLists.map((list) => {
                        const isSelected = currentList?.id === list.id;
                        return (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() => {
                              onSelectList(list);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-semibold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="truncate">{list.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                (by {list.ownerName || list.ownerEmail.split('@')[0]})
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Create List button in dropdown */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id="new-list-dropdown-btn"
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenCreateModal();
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-xl flex items-center gap-2 font-medium transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Create New Task List</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List Status & Metadata info */}
          {currentList && (
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Personal vs Shared Badge */}
              {isShared ? (
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  title="Collaborative list with real-time editing"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-emerald-100/70 transition"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Shared ({currentList.memberEmails.length} members)</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl">
                  <span>Personal List</span>
                </span>
              )}

              {/* Ownership indicator */}
              {isOwner ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 px-2 py-0.5 rounded-lg">
                  <Crown className="w-2.5 h-2.5" /> Owner
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Owner: <strong className="font-medium text-slate-700 dark:text-slate-200">{currentList.ownerEmail}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls: Share, Rename, Delete, Create */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          {/* Share Button */}
          {currentList && (
            <button
              id="share-list-btn"
              type="button"
              onClick={onOpenShareModal}
              title="Share this list with other users via email for real-time collaboration"
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share List</span>
            </button>
          )}

          {/* Create New List Button */}
          <button
            id="create-new-list-btn"
            type="button"
            onClick={onOpenCreateModal}
            title="Create a new task list"
            className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New List</span>
          </button>

          {/* Delete List (Owner only) */}
          {isOwner && lists.length > 1 && (
            <button
              id="delete-list-btn"
              type="button"
              onClick={handleDeleteCurrentList}
              title="Delete this task list"
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
