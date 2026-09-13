import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DailyNote, MoodType, DailyNoteFeedback } from '../types';

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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
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

export interface NoteAnalysisResult {
  detectedEmotion: string;
  productivityScore: number; // 0-100
  positivityScore: number; // 0-100
  sentimentType: 'positive' | 'neutral' | 'needs_encouragement';
  feedback: DailyNoteFeedback;
}

/**
 * Intelligent Emotion, Productivity & Mindset Analysis Engine
 * Evaluates the user's raw, authentic, and humble thoughts from a single note box.
 * 1. Analyzes emotional tone & vulnerabilities
 * 2. Measures true productivity & execution momentum from the text
 * 3. Delivers feedback on how to improve thinking (cognitive reframing)
 * 4. Delivers actionable feedback on how to do better (practical growth)
 */
export function analyzeNoteThoughts(noteText: string): NoteAnalysisResult {
  const text = (noteText || '').trim();
  const lower = text.toLowerCase();

  // If empty or minimal input
  if (text.length < 10) {
    return {
      detectedEmotion: 'Reflective & Quiet',
      productivityScore: 50,
      positivityScore: 65,
      sentimentType: 'neutral',
      feedback: {
        detectedEmotion: 'Reflective & Quiet',
        productivityRating: 'Maintenance / Recovery',
        howToDoBetter: 'Take 2 minutes to jot down whatever is on your mind—even an honest sentence about how your energy felt today.',
        improveThinking: 'Writing down your real thoughts creates healthy mental distance from daily stress and declutters your mind.',
        suggestedAction: 'Type one real thing you noticed about your day or yourself today.',
        perspective: 'Even a single honest sentence is an act of grounding self-awareness.',
        encouragement: 'Every moment of quiet reflection builds emotional clarity.',
      },
    };
  }

  // --- 1. Emotion & Mindset Detection ---
  const emotionKeywords = {
    selfCritical: [
      'lazy', 'failed', 'failure', 'useless', 'disappointed in myself', 'hate myself',
      'terrible', 'awful', 'guilty', 'stupid', 'ruined', 'wasted the day', 'behind on everything',
      'cant do anything right', "can't do anything right", 'bad person', 'worthless', 'ashamed'
    ],
    overwhelmed: [
      'overwhelmed', 'too much', 'drowning', 'stressed', 'anxious', 'panic', 'freaking out',
      'hectic', 'swamped', 'pressure', 'chaos', 'cant breathe', "can't keep up", 'burnout', 'burnt out'
    ],
    fatigued: [
      'tired', 'exhausted', 'drained', 'no energy', 'sleepy', 'lethargic', 'heavy', 'foggy',
      'headache', 'low battery', 'need rest', 'wiped out', 'sluggish'
    ],
    procrastinating: [
      'procrastinated', 'scrolling', 'wasted time', 'put off', 'avoiding', 'distracted',
      'lost focus', 'did nothing', 'got sidetracked', 'delayed'
    ],
    humbleReal: [
      'trying my best', 'humble', 'learning', 'not perfect', 'slow progress', 'honest',
      'one step at a time', 'room to grow', 'making mistakes', 'accepting', 'imperfect', 'grateful for'
    ],
    calmSteady: [
      'calm', 'peaceful', 'steady', 'balanced', 'quiet', 'grounded', 'content', 'patient',
      'clear headed', 'smooth', 'centered', 'at ease'
    ],
    energizedProductive: [
      'crushed it', 'productive', 'energized', 'flow state', 'focused', 'accomplished',
      'proud', 'excited', 'on fire', 'momentum', 'got a lot done', 'finished', 'conquered', 'thriving'
    ],
    determined: [
      'pushing through', 'wont give up', "won't quit", 'determined', 'tomorrow will be better',
      'rebuilding', 'staying strong', 'committed', 'bouncing back', 'disciplined'
    ],
  };

  const countMatches = (list: string[]) =>
    list.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);

  const selfCriticalScore = countMatches(emotionKeywords.selfCritical);
  const overwhelmedScore = countMatches(emotionKeywords.overwhelmed);
  const fatiguedScore = countMatches(emotionKeywords.fatigued);
  const procrastinatingScore = countMatches(emotionKeywords.procrastinating);
  const humbleScore = countMatches(emotionKeywords.humbleReal);
  const calmScore = countMatches(emotionKeywords.calmSteady);
  const energizedScore = countMatches(emotionKeywords.energizedProductive);
  const determinedScore = countMatches(emotionKeywords.determined);

  // Determine Primary Detected Emotion
  let detectedEmotion = 'Calm & Grounded';
  if (selfCriticalScore > 0 && selfCriticalScore >= overwhelmedScore) {
    detectedEmotion = 'Self-Critical / Harsh Self-Talk';
  } else if (overwhelmedScore > 0 && overwhelmedScore >= fatiguedScore) {
    detectedEmotion = 'Overwhelmed & High Stress';
  } else if (procrastinatingScore > 0 && procrastinatingScore >= fatiguedScore) {
    detectedEmotion = 'Distracted & Struggling with Focus';
  } else if (fatiguedScore > 0) {
    detectedEmotion = 'Fatigued & Energy Depleted';
  } else if (energizedScore > 0 && energizedScore >= calmScore) {
    detectedEmotion = 'Energized & High Flow';
  } else if (determinedScore > 0) {
    detectedEmotion = 'Determined & Resilient';
  } else if (humbleScore > 0) {
    detectedEmotion = 'Humble, Honest & Reflective';
  } else if (calmScore > 0) {
    detectedEmotion = 'Peaceful & Steady';
  } else {
    detectedEmotion = 'Thoughtful & Observant';
  }

  // --- 2. Measure Productivity Directly from the Note ---
  // Indicators of actions, completed items, outputs, efforts, and deep work
  const actionTerms = [
    'completed', 'finished', 'done', 'did', 'shipped', 'worked on', 'coded', 'wrote',
    'studied', 'solved', 'fixed', 'submitted', 'attended', 'cleaned', 'organized',
    'exercised', 'workout', 'read', 'built', 'delivered', 'planned', 'handled',
    'made progress', 'pushed through', 'focused on', 'accomplished'
  ];

  // Quantifiers of productive effort
  const quantifierRegex = /\b(\d+|several|multiple|few|two|three|four|five)\s*(tasks|hours|items|pages|projects|features|tickets|calls|emails|problems)/i;
  const hasQuantifiedEffort = quantifierRegex.test(text);

  let actionHits = 0;
  actionTerms.forEach((term) => {
    if (lower.includes(term)) actionHits += 1;
  });

  // Base calculation for productivity from notes
  let calculatedProductivity = 60; // neutral baseline

  // Add for positive actions and quantifiers
  calculatedProductivity += actionHits * 7;
  if (hasQuantifiedEffort) calculatedProductivity += 12;
  if (energizedScore > 0) calculatedProductivity += 10;
  if (determinedScore > 0) calculatedProductivity += 6;
  if (humbleScore > 0) calculatedProductivity += 5; // honest reflection is productive self-governance

  // Penalize for pure friction/stagnation markers (unless framed constructively)
  if (procrastinatingScore > 0) calculatedProductivity -= procrastinatingScore * 8;
  if (fatiguedScore > 0 && actionHits === 0) calculatedProductivity -= 10;
  if (selfCriticalScore > 0 && actionHits === 0) calculatedProductivity -= 12;

  // Length and thoughtfulness bonus (articulating your day takes productive cognitive work)
  if (text.length > 120) calculatedProductivity += 6;
  if (text.length > 250) calculatedProductivity += 4;

  // Clamp productivity score between 15 and 98
  calculatedProductivity = Math.max(15, Math.min(98, Math.round(calculatedProductivity)));

  let productivityRating: 'High Momentum' | 'Steady Progress' | 'Maintenance / Recovery' | 'Blocked / Needs Reset';
  if (calculatedProductivity >= 80) {
    productivityRating = 'High Momentum';
  } else if (calculatedProductivity >= 60) {
    productivityRating = 'Steady Progress';
  } else if (calculatedProductivity >= 40) {
    productivityRating = 'Maintenance / Recovery';
  } else {
    productivityRating = 'Blocked / Needs Reset';
  }

  // --- 3. Positivity & Sentiment Score ---
  let calculatedPositivity = 65;
  calculatedPositivity += (energizedScore * 10) + (calmScore * 8) + (determinedScore * 7) + (humbleScore * 5);
  calculatedPositivity -= (selfCriticalScore * 14) + (overwhelmedScore * 10) + (procrastinatingScore * 6) + (fatiguedScore * 5);
  calculatedPositivity = Math.max(12, Math.min(98, Math.round(calculatedPositivity)));

  let sentimentType: 'positive' | 'neutral' | 'needs_encouragement' = 'neutral';
  if (selfCriticalScore > 0 || overwhelmedScore > 0 || calculatedPositivity <= 50) {
    sentimentType = 'needs_encouragement';
  } else if (calculatedPositivity >= 75) {
    sentimentType = 'positive';
  }

  // --- 4. Tailored Feedback: Improve Thinking & How To Do Better ---
  let improveThinking = '';
  let howToDoBetter = '';
  let suggestedAction = '';

  if (selfCriticalScore > 0) {
    // Self-criticism pattern detected
    improveThinking =
      'Shift away from all-or-nothing self-judgment. Experiencing low energy or an incomplete task list is biological data, not a character flaw. Treating yourself with quiet patience activates the prefrontal cortex; beating yourself up only triggers fight-or-flight freeze.';
    howToDoBetter =
      'Break tomorrow down into just 1 single "anchor task" that matters most. When you lower the barrier to entry, your natural momentum returns without the heavy friction of self-pressure.';
    suggestedAction =
      'Mentally forgive yourself for today’s shortcomings right now. Unplug with peace and a clean slate.';
  } else if (overwhelmedScore > 0) {
    // Overwhelm pattern detected
    improveThinking =
      'Recognize that overwhelm occurs when you try to solve an entire week in one moment. You only ever have to live and execute the next 20 minutes. Everything else can wait in line.';
    howToDoBetter =
      'Conduct a 5-minute brain-dump on paper, then circle only 2 things. Ruthlessly defer or delete the other items. High productivity comes from subtraction, not addition.';
    suggestedAction =
      'Take 3 slow, deep diaphragmatic breaths and close all unused browser tabs or open work.';
  } else if (procrastinatingScore > 0) {
    // Procrastination pattern detected
    improveThinking =
      'Procrastination is rarely about laziness—it is usually an emotional response to an intimidating or ambiguous task. Instead of waiting to "feel motivated," let action precede the feeling.';
    howToDoBetter =
      'Use the 3-minute micro-rule tomorrow: commit to opening the document or workspace for just 180 seconds. Once the physical inertia is broken, resistance vanishes.';
    suggestedAction =
      'Put your phone in a separate room for 30 minutes tonight to let your dopamine baselines reset.';
  } else if (fatiguedScore > 0) {
    // Fatigue / drained pattern detected
    improveThinking =
      'Realize that rest is an active part of the productivity cycle, not the opposite of work. A dull axe takes three times as long to chop wood. Honoring your tiredness is wise and mature.';
    howToDoBetter =
      'Protect your sleep tonight with zero screen time before bed. Tomorrow morning, postpone high-cognitive demands until after you are hydrated and stepped into natural sunlight.';
    suggestedAction =
      'Put work away for the evening. Give your mind permission to fully power down without guilt.';
  } else if (energizedScore > 0 && calculatedProductivity >= 75) {
    // High performance / flow pattern
    improveThinking =
      'Notice how clarity and positive expectation made execution feel lighter. Anchor this feeling in memory so you can recall it during tougher days.';
    howToDoBetter =
      'Do not rush to fill this great momentum with an endless pile of extra chores tonight. Guard your recovery so you arrive at tomorrow with the same vibrant energy.';
    suggestedAction =
      'Write down the 1 primary highlight that made today feel so effective, and repeat that routine tomorrow.';
  } else if (humbleScore > 0 || calculatedProductivity >= 60) {
    // Humble, steady, realistic reflection
    improveThinking =
      'Humble consistency is the most formidable superpower in life. Grand leaps are fragile, but steady, truthful steps compound into insurmountable progress.';
    howToDoBetter =
      'Maintain this steady cadence. Identify the one recurring friction point in your daily routine and smooth it out with a small system tweak.';
    suggestedAction =
      'Take 60 seconds to appreciate how you showed up with honesty and authenticity today.';
  } else {
    // General reflective
    improveThinking =
      'Observe your thoughts like clouds passing through the sky. When you step back from urgency, you gain the clarity to choose high-impact actions over busywork.';
    howToDoBetter =
      'Start tomorrow by timeboxing your first 90 minutes for deep, uninterrupted focus before opening chats or emails.';
    suggestedAction =
      'Clarify your top 2 priorities for tomorrow morning so you wake up with purpose.';
  }

  const feedback: DailyNoteFeedback = {
    detectedEmotion,
    productivityRating,
    howToDoBetter,
    improveThinking,
    suggestedAction,
    perspective: improveThinking,
    encouragement: `${detectedEmotion} · ${productivityRating} (${calculatedProductivity}%). ${howToDoBetter}`,
  };

  return {
    detectedEmotion,
    productivityScore: calculatedProductivity,
    positivityScore: calculatedPositivity,
    sentimentType,
    feedback,
  };
}

/**
 * Backward compatibility wrapper for analyzeDailyMindset
 */
export function analyzeDailyMindset(
  feeling?: MoodType,
  emotionSummary?: string,
  achievements?: string,
  reflections?: string
): NoteAnalysisResult {
  const combined = [emotionSummary, achievements, reflections].filter(Boolean).join('. ');
  return analyzeNoteThoughts(combined);
}

/**
 * Subscribe to the authenticated user's daily notes
 */
export function subscribeToUserDailyNotes(
  userId: string,
  onUpdate: (notes: DailyNote[]) => void,
  onError: (error: any) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const notesPath = `users/${userId}/dailyNotes`;
  try {
    const notesColRef = collection(db, 'users', userId, 'dailyNotes');
    const notesQuery = query(notesColRef, orderBy('date', 'desc'));

    return onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes: DailyNote[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawText =
            data.noteText ||
            [data.emotionSummary, data.achievements, data.reflections].filter(Boolean).join('\n\n') ||
            '';

          // Ensure analysis is present or dynamically computed if missing
          const analysis = data.feedback && data.detectedEmotion
            ? null
            : analyzeNoteThoughts(rawText);

          return {
            id: docSnap.id,
            userId,
            date: data.date || docSnap.id,
            noteText: rawText,
            detectedEmotion: data.detectedEmotion || analysis?.detectedEmotion || 'Thoughtful & Observant',
            productivityScore:
              typeof data.productivityScore === 'number'
                ? data.productivityScore
                : analysis?.productivityScore ?? 65,
            positivityScore:
              typeof data.positivityScore === 'number'
                ? data.positivityScore
                : analysis?.positivityScore ?? 70,
            sentimentType: data.sentimentType || analysis?.sentimentType || 'neutral',
            feedback: data.feedback || analysis?.feedback || undefined,
            feeling: data.feeling || 'neutral',
            emotionSummary: data.emotionSummary || '',
            achievements: data.achievements || '',
            reflections: data.reflections || '',
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          };
        });
        onUpdate(notes);
      },
      (error) => {
        console.error('Daily notes listener error:', error);
        onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, notesPath);
  }
}

/**
 * Save or update a daily note for the user from their single humble note box
 */
export async function saveUserDailyNote(
  userId: string,
  noteData: {
    date: string;
    noteText: string;
    // Optional legacy fields
    feeling?: MoodType;
    emotionSummary?: string;
    achievements?: string;
    reflections?: string;
  }
): Promise<DailyNote> {
  const rawText = (noteData.noteText || '').trim();
  const analysis = analyzeNoteThoughts(rawText);

  const noteId = noteData.date; // e.g. "2026-09-13"
  const notesPath = `users/${userId}/dailyNotes/${noteId}`;
  const now = Date.now();

  const fullNote: DailyNote = {
    id: noteId,
    userId,
    date: noteData.date,
    noteText: rawText,
    detectedEmotion: analysis.detectedEmotion,
    productivityScore: analysis.productivityScore,
    positivityScore: analysis.positivityScore,
    sentimentType: analysis.sentimentType,
    feedback: analysis.feedback,
    // Keep legacy fields populated so older views or exports don't break
    feeling: noteData.feeling || (analysis.sentimentType === 'positive' ? 'happy' : analysis.sentimentType === 'needs_encouragement' ? 'stressed' : 'neutral'),
    emotionSummary: rawText.slice(0, 160),
    achievements: rawText,
    reflections: rawText,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, 'users', userId, 'dailyNotes', noteId);
    await setDoc(docRef, fullNote, { merge: true });
    return fullNote;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, notesPath);
  }
}

/**
 * Delete a user's daily note
 */
export async function deleteUserDailyNote(userId: string, noteId: string): Promise<void> {
  const notesPath = `users/${userId}/dailyNotes/${noteId}`;
  try {
    const docRef = doc(db, 'users', userId, 'dailyNotes', noteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, notesPath);
  }
}
