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

export type MoodType = 'energized' | 'happy' | 'peaceful' | 'neutral' | 'tired' | 'stressed' | 'overwhelmed';

export interface DailyNoteFeedback {
  detectedEmotion: string;
  productivityRating: 'High Momentum' | 'Steady Progress' | 'Maintenance / Recovery' | 'Blocked / Needs Reset';
  howToDoBetter: string; // Specific advice on how to do better
  improveThinking: string; // Guidance to improve the user's way of thinking & cognitive reframing
  suggestedAction: string; // Gentle next step / micro action
  perspective?: string;
  encouragement?: string;
}

export interface DailyNote {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  noteText: string; // Single box containing the user's real, humble thoughts & reflections
  detectedEmotion: string;
  productivityScore: number; // 0-100 measured directly from the note
  positivityScore: number; // 0-100 mindset positivity score
  sentimentType: 'positive' | 'neutral' | 'needs_encouragement';
  feedback?: DailyNoteFeedback;
  // Backward compatibility fields
  feeling?: MoodType;
  emotionSummary?: string;
  achievements?: string;
  reflections?: string;
  createdAt: number;
  updatedAt: number;
}


