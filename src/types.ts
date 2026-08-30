export type Priority = 'low' | 'medium' | 'high';

export type Category = 'Work' | 'Personal' | 'Urgent' | 'Shopping' | 'Health' | 'Finance' | 'General';

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  memberEmails: string[]; // Lowercase emails of all collaborators + owner
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  userId: string;
  listId?: string;
  createdByEmail?: string;
  createdByName?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: string;
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  order?: number;
  createdAt: number;
  updatedAt: number;
}

export type FilterStatus = 'all' | 'active' | 'completed';

export type SortOption = 'manual' | 'createdAt-desc' | 'createdAt-asc' | 'dueDate-asc' | 'priority-desc' | 'title-asc';

export interface TaskFiltersState {
  status: FilterStatus;
  category: string;
  tag: string;
  priority: string;
  searchQuery: string;
  sortBy: SortOption;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface KeyboardShortcutItem {
  key: string;
  label: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'List & Collaboration' | 'General';
}

