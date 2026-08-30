import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Task, TaskList, Priority } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface NewTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  category: string;
  tags?: string[];
  dueDate?: string;
  order?: number;
}

export interface UserIdentity {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}

// -------------------------------------------------------------
// Collaborative Task Lists Management (/taskLists/{listId})
// -------------------------------------------------------------

/**
 * Subscribes to all task lists that the user owns or is invited to via email.
 */
export const subscribeToUserTaskLists = (
  userId: string,
  userEmail: string | null | undefined,
  onUpdate: (lists: TaskList[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const normalizedEmail = (userEmail || '').toLowerCase().trim();
  const listsCollectionRef = collection(db, 'taskLists');

  let ownedDocs = new Map<string, TaskList>();
  let sharedDocs = new Map<string, TaskList>();
  let hasCheckedInitialDefault = false;

  const parseDoc = (docSnap: any): TaskList => {
    const data = docSnap.data();
    const memberEmails: string[] = Array.isArray(data.memberEmails)
      ? data.memberEmails.map((e: string) => String(e).toLowerCase())
      : [];
    return {
      id: docSnap.id,
      name: data.name || 'Untitled List',
      description: data.description || '',
      ownerId: data.ownerId || userId,
      ownerEmail: (data.ownerEmail || '').toLowerCase(),
      ownerName: data.ownerName || undefined,
      memberEmails: memberEmails.length > 0 ? memberEmails : [data.ownerEmail?.toLowerCase() || normalizedEmail],
      isDefault: Boolean(data.isDefault),
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    };
  };

  const emitMergedLists = async () => {
    const allListsMap = new Map<string, TaskList>();
    ownedDocs.forEach((val, key) => allListsMap.set(key, val));
    sharedDocs.forEach((val, key) => allListsMap.set(key, val));

    const merged = Array.from(allListsMap.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    // If user has zero lists, auto-create a default list
    if (merged.length === 0 && !hasCheckedInitialDefault) {
      hasCheckedInitialDefault = true;
      try {
        const defaultListId = `default_${userId}`;
        const defaultDocRef = doc(db, 'taskLists', defaultListId);
        const defaultDoc = await getDoc(defaultDocRef);
        if (!defaultDoc.exists()) {
          const now = Date.now();
          await setDoc(defaultDocRef, {
            name: 'Personal Tasks',
            description: 'Default personal task list',
            ownerId: userId,
            ownerEmail: normalizedEmail || '',
            ownerName: 'You',
            memberEmails: normalizedEmail ? [normalizedEmail] : [],
            isDefault: true,
            createdAt: now,
            updatedAt: now,
          });
          return;
        }
      } catch (createErr) {
        console.warn('Could not auto-create default list:', createErr);
      }
    }

    onUpdate(merged);
  };

  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Query task lists owned by the user
    const ownedQuery = query(listsCollectionRef, where('ownerId', '==', userId));
    const unsubOwned = onSnapshot(
      ownedQuery,
      (snapshot) => {
        ownedDocs = new Map();
        snapshot.docs.forEach((docSnap) => {
          ownedDocs.set(docSnap.id, parseDoc(docSnap));
        });
        emitMergedLists();
      },
      (error) => {
        console.error('Owned task lists subscription error:', error);
        onError(error);
      }
    );
    unsubs.push(unsubOwned);

    // 2. Query task lists where user email is listed as collaborator
    if (normalizedEmail) {
      const sharedQuery = query(
        listsCollectionRef,
        where('memberEmails', 'array-contains', normalizedEmail)
      );
      const unsubShared = onSnapshot(
        sharedQuery,
        (snapshot) => {
          sharedDocs = new Map();
          snapshot.docs.forEach((docSnap) => {
            sharedDocs.set(docSnap.id, parseDoc(docSnap));
          });
          emitMergedLists();
        },
        (error) => {
          console.error('Shared task lists subscription error:', error);
          onError(error);
        }
      );
      unsubs.push(unsubShared);
    }
  } catch (error: any) {
    console.error('Error initiating task lists listener:', error);
    onError(error);
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
};

/**
 * Creates a new collaborative task list
 */
export const createTaskList = async (
  owner: UserIdentity,
  name: string,
  description?: string,
  initialCollaboratorEmails: string[] = []
): Promise<string> => {
  if (!owner.uid) throw new Error('User must be authenticated to create a list.');
  if (!name.trim()) throw new Error('List name cannot be empty.');

  const ownerEmail = (owner.email || '').toLowerCase().trim();
  const validCollaboratorEmails = initialCollaboratorEmails
    .map((e) => e.toLowerCase().trim())
    .filter((e) => e.length > 0 && e.includes('@') && e !== ownerEmail);

  const memberEmails = Array.from(new Set([ownerEmail, ...validCollaboratorEmails])).filter(Boolean);

  const now = Date.now();
  const listsRef = collection(db, 'taskLists');
  const docRef = await addDoc(listsRef, {
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: owner.uid,
    ownerEmail: ownerEmail,
    ownerName: owner.displayName || 'Owner',
    memberEmails: memberEmails,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
};

/**
 * Updates a task list's metadata (e.g. name or description)
 */
export const updateTaskList = async (
  listId: string,
  updates: { name?: string; description?: string }
): Promise<void> => {
  if (!listId) return;
  const listRef = doc(db, 'taskLists', listId);
  await updateDoc(listRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

/**
 * Invites / Adds a collaborator by email to a task list
 */
export const addCollaboratorToList = async (
  listId: string,
  email: string
): Promise<void> => {
  if (!listId || !email.trim()) throw new Error('Invalid list or email address.');
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const listRef = doc(db, 'taskLists', listId);
  await updateDoc(listRef, {
    memberEmails: arrayUnion(normalizedEmail),
    updatedAt: Date.now(),
  });
};

/**
 * Removes a collaborator from a task list
 */
export const removeCollaboratorFromList = async (
  listId: string,
  email: string
): Promise<void> => {
  if (!listId || !email.trim()) return;
  const normalizedEmail = email.toLowerCase().trim();

  const listRef = doc(db, 'taskLists', listId);
  await updateDoc(listRef, {
    memberEmails: arrayRemove(normalizedEmail),
    updatedAt: Date.now(),
  });
};

/**
 * Deletes a task list and all its subcollection tasks
 */
export const deleteTaskList = async (listId: string): Promise<void> => {
  if (!listId) return;

  // Delete all tasks in the list first
  try {
    const tasksRef = collection(db, 'taskLists', listId, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    const batch = writeBatch(db);
    tasksSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.warn('Note: Error batch deleting list tasks:', err);
  }

  // Delete list document
  const listRef = doc(db, 'taskLists', listId);
  await deleteDoc(listRef);
};

// -------------------------------------------------------------
// Real-Time Collaborative List Tasks (/taskLists/{listId}/tasks)
// -------------------------------------------------------------

/**
 * Subscribes to real-time updates for tasks within a collaborative list.
 * Path: /taskLists/{listId}/tasks
 */
export const subscribeToListTasks = (
  listId: string,
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  if (!listId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const tasksCollectionRef = collection(db, 'taskLists', listId, 'tasks');
    const tasksQuery = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawTags = Array.isArray(data.tags) ? data.tags : [];
          const category = data.category || (rawTags.length > 0 ? rawTags[0] : 'General');
          const mergedTags = rawTags.length > 0 ? rawTags : (category ? [category] : []);

          return {
            id: docSnap.id,
            listId: listId,
            userId: data.userId || '',
            createdByEmail: data.createdByEmail || undefined,
            createdByName: data.createdByName || undefined,
            title: data.title || '',
            description: data.description || '',
            completed: Boolean(data.completed),
            priority: (data.priority as Priority) || 'medium',
            category: category,
            tags: mergedTags,
            dueDate: data.dueDate || undefined,
            order: typeof data.order === 'number' ? data.order : undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          };
        });
        onUpdate(tasks);
      },
      (error) => {
        console.error('List tasks subscription error:', error);
        onError(error);
      }
    );
  } catch (error: any) {
    console.error('Error initiating list tasks listener:', error);
    onError(error);
    return () => {};
  }
};

/**
 * Adds a new task to a collaborative task list
 */
export const addTaskToList = async (
  listId: string,
  user: UserIdentity,
  input: NewTaskInput
): Promise<string> => {
  if (!listId) throw new Error('List ID is required.');
  if (!user.uid) throw new Error('User must be authenticated.');
  if (!input.title.trim()) throw new Error('Task title cannot be empty.');

  const tasksCollectionRef = collection(db, 'taskLists', listId, 'tasks');
  const now = Date.now();

  const tags = input.tags && input.tags.length > 0
    ? input.tags
    : (input.category ? [input.category] : ['General']);

  const docRef = await addDoc(tasksCollectionRef, {
    listId,
    userId: user.uid,
    createdByEmail: user.email?.toLowerCase() || null,
    createdByName: user.displayName || user.email?.split('@')[0] || 'Member',
    title: input.title.trim(),
    description: input.description?.trim() || '',
    completed: false,
    priority: input.priority || 'medium',
    category: input.category || tags[0] || 'General',
    tags: tags,
    dueDate: input.dueDate || null,
    order: typeof input.order === 'number' ? input.order : 0,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
};

/**
 * Toggles task status in a list
 */
export const toggleTaskStatusInList = async (
  listId: string,
  taskId: string,
  completed: boolean
): Promise<void> => {
  if (!listId || !taskId) return;
  const taskDocRef = doc(db, 'taskLists', listId, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    completed,
    updatedAt: Date.now(),
  });
};

/**
 * Updates task fields in a list
 */
export const updateTaskInList = async (
  listId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'listId' | 'createdAt'>>
): Promise<void> => {
  if (!listId || !taskId) return;
  const taskDocRef = doc(db, 'taskLists', listId, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

/**
 * Deletes a task from a list
 */
export const deleteTaskFromList = async (
  listId: string,
  taskId: string
): Promise<void> => {
  if (!listId || !taskId) return;
  const taskDocRef = doc(db, 'taskLists', listId, 'tasks', taskId);
  await deleteDoc(taskDocRef);
};

/**
 * Deletes multiple tasks from a list (e.g. clear completed)
 */
export const deleteMultipleTasksFromList = async (
  listId: string,
  taskIds: string[]
): Promise<void> => {
  if (!listId || taskIds.length === 0) return;
  const batch = writeBatch(db);
  taskIds.forEach((taskId) => {
    const taskDocRef = doc(db, 'taskLists', listId, 'tasks', taskId);
    batch.delete(taskDocRef);
  });
  await batch.commit();
};

/**
 * Persists the reordered sequence of tasks in a list
 */
export const reorderTasksInList = async (
  listId: string,
  reorderedTasks: { id: string; order: number }[]
): Promise<void> => {
  if (!listId || reorderedTasks.length === 0) return;
  const batch = writeBatch(db);
  const now = Date.now();

  reorderedTasks.forEach(({ id, order }) => {
    const docRef = doc(db, 'taskLists', listId, 'tasks', id);
    batch.update(docRef, {
      order,
      updatedAt: now,
    });
  });

  await batch.commit();
};

// -------------------------------------------------------------
// Backwards Compatibility: Legacy User Isolated Task Helpers
// -------------------------------------------------------------

export const subscribeToUserTasks = (
  userId: string,
  onUpdate: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
    const tasksQuery = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawTags = Array.isArray(data.tags) ? data.tags : [];
          const category = data.category || (rawTags.length > 0 ? rawTags[0] : 'General');
          const mergedTags = rawTags.length > 0 ? rawTags : (category ? [category] : []);

          return {
            id: docSnap.id,
            userId: data.userId || userId,
            title: data.title || '',
            description: data.description || '',
            completed: Boolean(data.completed),
            priority: (data.priority as Priority) || 'medium',
            category: category,
            tags: mergedTags,
            dueDate: data.dueDate || undefined,
            order: typeof data.order === 'number' ? data.order : undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          };
        });
        onUpdate(tasks);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        onError(error);
      }
    );
  } catch (error: any) {
    console.error('Error initiating task listener:', error);
    onError(error);
    return () => {};
  }
};

export const addTask = async (userId: string, input: NewTaskInput): Promise<string> => {
  if (!userId) throw new Error('User must be authenticated to add a task.');
  if (!input.title.trim()) throw new Error('Task title cannot be empty.');

  const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
  const now = Date.now();
  const tags = input.tags && input.tags.length > 0
    ? input.tags
    : (input.category ? [input.category] : ['General']);

  const docRef = await addDoc(tasksCollectionRef, {
    userId,
    title: input.title.trim(),
    description: input.description?.trim() || '',
    completed: false,
    priority: input.priority || 'medium',
    category: input.category || tags[0] || 'General',
    tags: tags,
    dueDate: input.dueDate || null,
    order: typeof input.order === 'number' ? input.order : 0,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
};

export const reorderTasksInDb = async (
  userId: string,
  reorderedTasks: { id: string; order: number }[]
): Promise<void> => {
  if (!userId || reorderedTasks.length === 0) return;
  const batch = writeBatch(db);
  const now = Date.now();

  reorderedTasks.forEach(({ id, order }) => {
    const docRef = doc(db, 'users', userId, 'tasks', id);
    batch.update(docRef, {
      order,
      updatedAt: now,
    });
  });

  await batch.commit();
};

export const toggleTaskStatus = async (
  userId: string,
  taskId: string,
  completed: boolean
): Promise<void> => {
  if (!userId || !taskId) return;
  const taskDocRef = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    completed,
    updatedAt: Date.now(),
  });
};

export const updateTask = async (
  userId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  if (!userId || !taskId) return;
  const taskDocRef = doc(db, 'users', userId, 'tasks', taskId);
  await updateDoc(taskDocRef, {
    ...updates,
    updatedAt: Date.now(),
  });
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  if (!userId || !taskId) return;
  const taskDocRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskDocRef);
};

export const deleteMultipleTasks = async (userId: string, taskIds: string[]): Promise<void> => {
  if (!userId || taskIds.length === 0) return;
  const promises = taskIds.map((taskId) => deleteTask(userId, taskId));
  await Promise.all(promises);
};

