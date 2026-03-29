import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = ['work', 'study', 'personal', 'health', 'finance', 'other'];
const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];

const priorityConfig = {
  urgent: { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/10', label: '🔴 Urgent' },
  high:   { color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10', label: '🟠 High' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/10', label: '🟡 Medium' },
  low:    { color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/10', label: '🟢 Low' },
};

const statusConfig = {
  todo:        { label: 'To Do', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  completed:   { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' },
  cancelled:   { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task || {
    title: '', description: '', priority: 'medium', category: 'personal',
    status: 'todo', dueDate: '', estimatedMinutes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
      };
      if (task?.id) {
        await tasksAPI.update(task.id, payload);
        toast.success('Task updated!');
      } else {
        await tasksAPI.create(payload);
        toast.success('Task created!');
      }
      onSave();
      onClose();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">{task?.id ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="What needs to be done?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
              <input type="datetime-local" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Est. Minutes</label>
              <input type="number" min={1} max={1440} value={form.estimatedMinutes || ''} onChange={e => setForm({ ...form, estimatedMinutes: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="e.g. 30" />
            </div>
          </div>
          {task?.id && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
              {loading ? 'Saving...' : task?.id ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', sortBy: 'createdAt', sortOrder: 'DESC' });
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await tasksAPI.getAll(params);
      setTasks(data.tasks || []);
      setTotal(data.count || 0);
    } catch (err) {}
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {}
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task.id, { status: newStatus });
      if (newStatus === 'completed') toast.success('Task completed! 🎉');
      fetchTasks();
    } catch (err) {}
  };

  const openEdit = (task) => { setEditTask(task); setModalOpen(true); };
  const openNew = () => { setEditTask(null); setModalOpen(true); };

  const FilterBar = () => (
    <div className="flex flex-wrap gap-3">
      <input
        value={filters.search} placeholder="Search tasks..."
        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        className="px-3 py-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
      />
      {[
        { key: 'status', opts: ['', ...STATUSES], labels: ['All Status', ...STATUSES.map(s => statusConfig[s].label)] },
        { key: 'priority', opts: ['', ...PRIORITIES], labels: ['All Priority', ...PRIORITIES.map(p => p.charAt(0).toUpperCase() + p.slice(1))] },
        { key: 'category', opts: ['', ...CATEGORIES], labels: ['All Categories', ...CATEGORIES.map(c => c.charAt(0).toUpperCase() + c.slice(1))] },
      ].map(({ key, opts, labels }) => (
        <select key={key} value={filters[key]}
          onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
          className="px-3 py-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          {opts.map((o, i) => <option key={o} value={o}>{labels[i]}</option>)}
        </select>
      ))}
      <select value={`${filters.sortBy}_${filters.sortOrder}`}
        onChange={e => { const [sb, so] = e.target.value.split('_'); setFilters(f => ({ ...f, sortBy: sb, sortOrder: so })); }}
        className="px-3 py-2 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
        <option value="createdAt_DESC">Newest First</option>
        <option value="createdAt_ASC">Oldest First</option>
        <option value="dueDate_ASC">Due Soon</option>
        <option value="priority_DESC">Priority High→Low</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{total} tasks total</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary-500/20">
          + New Task
        </button>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-5xl mb-4">✓</p>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">No tasks found</h3>
          <p className="text-slate-500 text-sm">Create a new task or adjust your filters</p>
          <button onClick={openNew} className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
            + New Task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div key={task.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
              >
                {/* Checkbox */}
                <button onClick={() => toggleStatus(task)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                  {task.status === 'completed' && <span className="text-xs">✓</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    {task.goal && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                        style={{ backgroundColor: task.goal.color || '#6366f1' }}>
                        {task.goal.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityConfig[task.priority]?.bg} ${priorityConfig[task.priority]?.color}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-400">{task.category}</span>
                    {task.dueDate && (
                      <span className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-500' : 'text-slate-400'}`}>
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.estimatedMinutes && (
                      <span className="text-xs text-slate-400">⏱ {task.estimatedMinutes}m</span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span className={`hidden sm:block text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[task.status]?.color}`}>
                  {statusConfig[task.status]?.label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(task)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary-500 transition-colors text-sm">
                    ✎
                  </button>
                  <button onClick={() => deleteTask(task.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors text-sm">
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <TaskModal
            task={editTask}
            onClose={() => { setModalOpen(false); setEditTask(null); }}
            onSave={fetchTasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
