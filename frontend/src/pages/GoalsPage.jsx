import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { goalsAPI } from '../services/api';
import toast from 'react-hot-toast';

const GOAL_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#0ea5e9', '#f59e0b', '#14b8a6'];

function ProgressRing({ progress, size = 56, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#6366f1" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function GoalCard({ goal, onEdit, onDelete, onMilestoneToggle }) {
  const [expanded, setExpanded] = useState(false);
  const completedMilestones = goal.milestones?.filter(m => m.status === 'completed').length || 0;
  const totalMilestones = goal.milestones?.length || 0;
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;

  return (
    <motion.div layout className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-200 dark:hover:border-primary-800 transition-all">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <ProgressRing progress={goal.progress || 0} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white">
              {Math.round(goal.progress || 0)}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onEdit(goal)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary-500 text-sm">✎</button>
                <button onClick={() => onDelete(goal.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 text-sm">✕</button>
              </div>
            </div>
            {goal.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{goal.description}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: goal.color + '20', color: goal.color }}>
                {goal.category}
              </span>
              {daysLeft !== null && (
                <span className={`text-xs font-medium ${daysLeft < 7 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'}
                </span>
              )}
              {totalMilestones > 0 && (
                <span className="text-xs text-slate-400">{completedMilestones}/{totalMilestones} milestones</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress || 0}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color || '#6366f1' }}
          />
        </div>

        {/* Milestones toggle */}
        {totalMilestones > 0 && (
          <button onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            {expanded ? '▲' : '▼'} {expanded ? 'Hide' : 'Show'} milestones
          </button>
        )}
      </div>

      {/* Milestones list */}
      <AnimatePresence>
        {expanded && totalMilestones > 0 && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="px-5 py-3 space-y-2">
              {goal.milestones.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <button onClick={() => onMilestoneToggle(goal.id, m)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${m.status === 'completed' ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {m.status === 'completed' && <span className="text-xs leading-none">✓</span>}
                  </button>
                  <span className={`text-sm ${m.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m.title}
                  </span>
                  {m.dueDate && <span className="text-xs text-slate-400 ml-auto">{new Date(m.dueDate).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal || { title: '', description: '', category: 'personal', deadline: '', color: '#6366f1' });
  const [milestones, setMilestones] = useState(goal?.milestones || []);
  const [newMilestone, setNewMilestone] = useState('');
  const [loading, setLoading] = useState(false);

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { title: newMilestone, status: 'pending' }]);
    setNewMilestone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, milestones: milestones.filter(m => !m.id) };
      if (goal?.id) {
        await goalsAPI.update(goal.id, payload);
        toast.success('Goal updated!');
      } else {
        await goalsAPI.create(payload);
        toast.success('Goal created! 🎯');
      }
      onSave();
      onClose();
    } catch (err) {}
    setLoading(false);
  };

  const CATEGORIES = ['career', 'health', 'finance', 'education', 'personal', 'relationships', 'other'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-surface-900">
          <h3 className="font-semibold text-slate-900 dark:text-white">{goal?.id ? 'Edit Goal' : 'New Goal'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What do you want to achieve?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describe your goal..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
              <input type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Milestones</label>
            <div className="space-y-2 mb-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{m.title}</span>
                  <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                placeholder="Add a milestone..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <button type="button" onClick={addMilestone}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm">
              {loading ? 'Saving...' : goal?.id ? 'Update' : 'Create Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const data = await goalsAPI.getAll(params);
      setGoals(data.goals || []);
    } catch (err) {}
    setLoading(false);
  };

  const deleteGoal = async (id) => {
    if (!window.confirm('Delete this goal and all its milestones?')) return;
    try {
      await goalsAPI.delete(id);
      toast.success('Goal deleted');
      fetchGoals();
    } catch (err) {}
  };

  const toggleMilestone = async (goalId, milestone) => {
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await goalsAPI.updateMilestone(goalId, milestone.id, { status: newStatus });
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          progress: res.goalProgress,
          milestones: g.milestones.map(m => m.id === milestone.id ? { ...m, status: newStatus } : m),
        };
      }));
    } catch (err) {}
  };

  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {goals.length} goals · avg {totalProgress}% complete
          </p>
        </div>
        <button onClick={() => { setEditGoal(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-primary-500/20">
          + New Goal
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['active', 'completed', 'paused', ''].map((s) => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === s
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
              : 'bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary-300'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-5xl mb-4">◎</p>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">No goals yet</h3>
          <p className="text-slate-500 text-sm">Set your first long-term goal to get started</p>
          <button onClick={() => setModalOpen(true)} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
            + New Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              onEdit={g => { setEditGoal(g); setModalOpen(true); }}
              onDelete={deleteGoal}
              onMilestoneToggle={toggleMilestone}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <GoalModal
            goal={editGoal}
            onClose={() => { setModalOpen(false); setEditGoal(null); }}
            onSave={fetchGoals}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
