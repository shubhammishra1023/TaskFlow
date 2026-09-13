import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Heart,
  CheckCircle2,
  Calendar,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  History,
  Trash2,
  Loader2,
  BookOpen,
  Brain,
  Compass,
  Smile,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { DailyNote } from '../types';
import {
  analyzeNoteThoughts,
  saveUserDailyNote,
  deleteUserDailyNote,
} from '../services/dailyNotesService';

interface DailyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  existingNotes: DailyNote[];
  onNoteSaved?: (note: DailyNote) => void;
}

export const DailyNoteModal: React.FC<DailyNoteModalProps> = ({
  isOpen,
  onClose,
  userId,
  existingNotes,
  onNoteSaved,
}) => {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [noteText, setNoteText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load existing note if already written for selected date
  useEffect(() => {
    const existing = existingNotes.find((n) => n.date === selectedDate);
    if (existing) {
      setNoteText(
        existing.noteText ||
          [existing.emotionSummary, existing.achievements, existing.reflections]
            .filter(Boolean)
            .join('\n\n') ||
          ''
      );
    } else {
      setNoteText('');
    }
    setSaveSuccess(false);
  }, [selectedDate, existingNotes]);

  // Live Sentiment, Emotion, Productivity & Feedback Analysis
  const liveAnalysis = useMemo(() => {
    return analyzeNoteThoughts(noteText);
  }, [noteText]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || isSaving) return;

    setIsSaving(true);
    try {
      const saved = await saveUserDailyNote(userId, {
        date: selectedDate,
        noteText,
      });
      setSaveSuccess(true);
      if (onNoteSaved) onNoteSaved(saved);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save daily note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!userId || deletingId) return;
    setDeletingId(noteId);
    try {
      await deleteUserDailyNote(userId, noteId);
      if (selectedDate === noteId) {
        setNoteText('');
      }
    } catch (err) {
      console.error('Failed to delete daily note:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const isNeedsEncouragement = liveAnalysis.sentimentType === 'needs_encouragement';
  const isPositive = liveAnalysis.sentimentType === 'positive';
  const wordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;

  // Visual helper for productivity bar color
  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Daily Thoughts & Mindset Reflection
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Real & Humble
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Write freely in one box. We analyze your emotions, measure productivity, and share ways to improve your thinking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'write' ? 'history' : 'write')}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title={activeTab === 'write' ? 'View Reflection History' : 'Back to Writing'}
            >
              {activeTab === 'write' ? (
                <>
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History ({existingNotes.length})</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Write Note</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'write' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Date selection & status banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Journal Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                  {selectedDate === todayStr && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </div>

                {/* Analysis Indicators */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Detected Emotion Chip */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                      isNeedsEncouragement
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        : isPositive
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {isNeedsEncouragement ? (
                      <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    ) : isPositive ? (
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>{liveAnalysis.detectedEmotion}</span>
                  </span>

                  {/* Note Productivity Score Badge */}
                  <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Productivity: {liveAnalysis.productivityScore}%</span>
                  </div>
                </div>
              </div>

              {/* SINGLE HUMBLE NOTE BOX */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>What's on your mind today?</span>
                    <span className="text-slate-400 font-normal">(Be real, honest & humble)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {wordCount > 0 ? `${wordCount} words` : 'Single note box'}
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type your thoughts freely and honestly... How did your mind and heart feel today? What tasks did you finish, struggle with, or postpone? Did you feel overwhelmed, tired, proud, or hard on yourself? Write real and humble—no questionnaires, just your true thoughts."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition resize-y min-h-[140px] leading-relaxed"
                />
              </div>

              {/* LIVE ANALYSIS & COGNITIVE FEEDBACK SECTION */}
              <div className="space-y-3 pt-1">
                {/* 1. Productivity Measurement Meter based on note */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Measured Productivity from Your Notes:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {liveAnalysis.productivityScore}% · {liveAnalysis.feedback.productivityRating}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${getProductivityColor(
                        liveAnalysis.productivityScore
                      )}`}
                      style={{ width: `${liveAnalysis.productivityScore}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Evaluated from actions taken, focus depth, execution mentions, and self-awareness in your reflection.
                  </p>
                </div>

                {/* 2. Dual Feedback: How to Improve Your Thinking + How You Can Do Better */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isNeedsEncouragement
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
                      : isPositive
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                      : 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3 font-bold text-xs">
                    <Lightbulb
                      className={`w-4 h-4 ${
                        isNeedsEncouragement
                          ? 'text-amber-600 dark:text-amber-400'
                          : isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    />
                    <span>Mindset Analysis & Growth Feedback</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    {/* A: Improve Thinking / Cognitive Reframing */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Improving Your Way of Thinking (Cognitive Reframing):</span>
                      </div>
                      <p className="font-medium opacity-90 pl-4 border-l-2 border-indigo-400/60 dark:border-indigo-500/60">
                        {liveAnalysis.feedback.improveThinking}
                      </p>
                    </div>

                    {/* B: How You Can Do Better */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-0.5 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>How You Can Do Better (Actionable Growth):</span>
                      </div>
                      <p className="font-medium opacity-90 pl-4 border-l-2 border-amber-400/60 dark:border-amber-500/60">
                        {liveAnalysis.feedback.howToDoBetter}
                      </p>
                    </div>

                    {/* C: Gentle Next Step */}
                    <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-start gap-1.5 text-[11px] font-semibold">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        <strong className="opacity-80">Immediate Micro-Step:</strong> {liveAnalysis.feedback.suggestedAction}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {saveSuccess && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Daily note and reflection saved securely!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Note...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Save Daily Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your archive of honest thoughts, emotional states, and measured productivity over time:
              </p>

              {existingNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No notes recorded yet. Write your first honest reflection today!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingNotes.map((note) => {
                    const textContent =
                      note.noteText ||
                      [note.emotionSummary, note.achievements, note.reflections]
                        .filter(Boolean)
                        .join('\n\n');

                    return (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{note.date}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {note.detectedEmotion || 'Reflective'}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Productivity: {note.productivityScore ?? note.positivityScore}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(note.date);
                                setActiveTab('write');
                              }}
                              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 font-semibold cursor-pointer"
                            >
                              Edit Note
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === note.id}
                              onClick={() => handleDelete(note.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Delete note"
                            >
                              {deletingId === note.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Note text body */}
                        {textContent && (
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                            {textContent}
                          </p>
                        )}

                        {/* Feedback preview */}
                        {note.feedback && (
                          <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                            {note.feedback.improveThinking && (
                              <p>
                                <strong className="text-indigo-700 dark:text-indigo-400 font-semibold">
                                  Thinking Shift:
                                </strong>{' '}
                                {note.feedback.improveThinking}
                              </p>
                            )}
                            {note.feedback.howToDoBetter && (
                              <p>
                                <strong className="text-amber-700 dark:text-amber-400 font-semibold">
                                  How to do better:
                                </strong>{' '}
                                {note.feedback.howToDoBetter}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
