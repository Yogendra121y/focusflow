import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { journalAPI } from '../services/api';
import toast from 'react-hot-toast';

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great', color: 'text-green-500' },
  { value: 'good', emoji: '🙂', label: 'Good', color: 'text-blue-500' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: 'text-slate-500' },
  { value: 'bad', emoji: '😕', label: 'Bad', color: 'text-orange-500' },
  { value: 'terrible', emoji: '😞', label: 'Terrible', color: 'text-red-500' },
];

function JournalEditor({ entry, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState(entry || { title: '', content: '', mood: 'good', date: today });
  const [loading, setLoading] = useState(false);
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (entry?.id) {
        await journalAPI.update(entry.id, form);
        toast.success('Journal updated!');
      } else {
        await journalAPI.create(form);
        toast.success('Journal entry saved! ✍️');
      }
      onSave();
      onClose();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {entry?.id ? 'Edit Entry' : `Journal — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 space-y-4 flex-1 overflow-y-auto">
            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">How are you feeling?</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setForm({ ...form, mood: m.value })}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 transition-all ${
                      form.mood === m.value ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Entry title (optional)"
                className="w-full px-0 py-2 bg-transparent border-0 border-b border-slate-200 dark:border-slate-700 text-lg font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-400 transition-colors" />
            </div>

            {/* Content */}
            <div>
              <textarea
                value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                required placeholder="What's on your mind today? Write freely..."
                rows={12}
                className="w-full px-0 py-2 bg-transparent border-0 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none resize-none leading-relaxed text-base"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">{wordCount} words</span>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm">
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function JournalPage() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState('');

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterMood) params.mood = filterMood;
      const data = await journalAPI.getAll(params);
      setJournals(data.journals || []);

      // Check if today's entry exists
      const today = new Date().toISOString().split('T')[0];
      const todayRes = await journalAPI.getByDate(today);
      setTodayEntry(todayRes.journal || null);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchJournals(); }, [search, filterMood]);

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await journalAPI.delete(id);
      toast.success('Entry deleted');
      fetchJournals();
    } catch (err) {}
  };

  const openNew = () => { setEditEntry(null); setEditorOpen(true); };
  const openEdit = (entry) => { setEditEntry(entry); setEditorOpen(true); };

  const getMoodEmoji = (mood) => MOODS.find(m => m.value === mood)?.emoji || '😐';
  const getMoodColor = (mood) => MOODS.find(m => m.value === mood)?.color || 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Journal</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{journals.length} entries written</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-primary-500/20">
          ✍ Write Today
        </button>
      </div>

      {/* Today's status banner */}
      {todayEntry ? (
        <div className="flex items-center gap-4 px-5 py-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl">
          <span className="text-2xl">{getMoodEmoji(todayEntry.mood)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Today's entry written ✓</p>
            <p className="text-xs text-green-600 dark:text-green-500">{todayEntry.wordCount} words · {todayEntry.mood || 'no mood set'}</p>
          </div>
          <button onClick={() => openEdit(todayEntry)}
            className="text-sm text-green-700 dark:text-green-400 font-medium hover:underline">
            Edit →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl cursor-pointer"
          onClick={openNew}>
          <span className="text-2xl">📝</span>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">You haven't journaled today yet</p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Take 5 minutes to reflect on your day</p>
          </div>
          <button className="ml-auto text-sm text-amber-700 dark:text-amber-400 font-medium hover:underline">Write now →</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..."
          className="px-3 py-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-48" />
        <div className="flex gap-2">
          <button onClick={() => setFilterMood('')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filterMood === '' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
            All
          </button>
          {MOODS.map(m => (
            <button key={m.value} onClick={() => setFilterMood(filterMood === m.value ? '' : m.value)}
              className={`px-2.5 py-2 rounded-xl text-sm transition-all ${filterMood === m.value ? 'bg-primary-500 text-white' : 'bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800'}`}>
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-5xl mb-4">📓</p>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">No journal entries yet</h3>
          <p className="text-slate-500 text-sm">Start writing to capture your thoughts and progress</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
            Write first entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map(entry => (
            <motion.div key={entry.id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{entry.title || 'Untitled Entry'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}{entry.wordCount || 0} words
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(entry)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary-500 text-sm">✎</button>
                  <button onClick={() => deleteEntry(entry.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 text-sm">✕</button>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {entry.content}
              </p>
              {entry.tags?.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {entry.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <JournalEditor entry={editEntry}
            onClose={() => { setEditorOpen(false); setEditEntry(null); }}
            onSave={fetchJournals}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
