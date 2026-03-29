import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timePlannerAPI, tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const BLOCK_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#0ea5e9', '#f59e0b', '#14b8a6', '#ef4444'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function BlockModal({ block, onClose, onSave }) {
  const [form, setForm] = useState(block || {
    title: '', description: '', date: new Date().toISOString().split('T')[0],
    startTime: '09:00', endTime: '10:00', color: '#6366f1', category: 'work',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (block?.id) {
        await timePlannerAPI.update(block.id, form);
        toast.success('Block updated!');
      } else {
        await timePlannerAPI.create(form);
        toast.success('Time block added!');
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
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">{block?.id ? 'Edit Block' : 'New Time Block'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What are you working on?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
              <input type="time" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
              <input type="time" required value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex gap-2">
              {BLOCK_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm">
              {loading ? 'Saving...' : block?.id ? 'Update' : 'Add Block'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TimePlannerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBlock, setEditBlock] = useState(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await timePlannerAPI.getByDate(selectedDate);
      setBlocks(data.blocks || []);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchBlocks(); }, [selectedDate]);

  const deleteBlock = async (id) => {
    try {
      await timePlannerAPI.delete(id);
      toast.success('Block removed');
      fetchBlocks();
    } catch (err) {}
  };

  const toggleComplete = async (block) => {
    try {
      await timePlannerAPI.update(block.id, { isCompleted: !block.isCompleted });
      fetchBlocks();
    } catch (err) {}
  };

  const getBlockPosition = (startTime, endTime) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const top = (startMin / 60) * 64;
    const height = Math.max(((endMin - startMin) / 60) * 64, 32);
    return { top, height };
  };

  const currentTimePos = () => {
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    return (min / 60) * 64;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const completedCount = blocks.filter(b => b.isCompleted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Time Planner</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {blocks.length} blocks · {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <button onClick={() => { setEditBlock(null); setModalOpen(true); }}
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-primary-500/20">
            + Add Block
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex">
            {/* Hour labels */}
            <div className="w-16 flex-shrink-0 border-r border-slate-100 dark:border-slate-800">
              {HOURS.map(h => (
                <div key={h} className="h-16 flex items-start justify-end pr-3 pt-1">
                  <span className="text-xs text-slate-400">{h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="flex-1 relative overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {/* Hour lines */}
              {HOURS.map(h => (
                <div key={h} className="h-16 border-b border-slate-100 dark:border-slate-800" />
              ))}

              {/* Current time indicator */}
              {isToday && (
                <div className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                  style={{ top: currentTimePos() }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-px bg-red-500 opacity-70" />
                </div>
              )}

              {/* Time blocks */}
              {blocks.map(block => {
                const { top, height } = getBlockPosition(block.startTime, block.endTime);
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-2 right-2 rounded-xl px-3 py-2 cursor-pointer group"
                    style={{ top, height, backgroundColor: block.color + '20', borderLeft: `3px solid ${block.color}`, minHeight: 32 }}
                    onClick={() => { setEditBlock(block); setModalOpen(true); }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-semibold truncate ${block.isCompleted ? 'line-through opacity-50' : ''}`}
                          style={{ color: block.color }}>
                          {block.title}
                        </p>
                        {height > 40 && (
                          <p className="text-xs text-slate-500 mt-0.5">{block.startTime} – {block.endTime}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); toggleComplete(block); }}
                          className="text-xs hover:scale-110 transition-transform">
                          {block.isCompleted ? '✓' : '○'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }}
                          className="text-xs text-red-400 hover:text-red-600">✕</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {blocks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl mb-3">⊞</p>
                    <p className="text-slate-500 text-sm font-medium">No time blocks for this day</p>
                    <p className="text-slate-400 text-xs mt-1">Click + Add Block to plan your day</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <BlockModal
            block={editBlock ? { ...editBlock, date: selectedDate } : { date: selectedDate }}
            onClose={() => { setModalOpen(false); setEditBlock(null); }}
            onSave={fetchBlocks}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
