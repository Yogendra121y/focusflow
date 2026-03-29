import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { analyticsAPI, tasksAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, color = 'primary', icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
        Today
      </span>
    </div>
    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
  </motion.div>
);

const PriorityBadge = ({ priority }) => {
  const map = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[priority] || map.medium}`}>
      {priority}
    </span>
  );
};

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        tasksAPI.getToday(),
      ]);
      setStats(statsRes.stats);
      setTodayTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await tasksAPI.create({ title: newTask, priority: 'medium', dueDate: new Date().toISOString() });
      setNewTask('');
      toast.success('Task added!');
      fetchData();
    } catch (err) {}
  };

  const toggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task.id, { status: newStatus });
      setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      if (newStatus === 'completed') toast.success('Task completed! 🎉');
    } catch (err) {}
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const completedCount = todayTasks.filter(t => t.status === 'completed').length;
  const totalCount = todayTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {greetingTime()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{user.streak} day streak</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-200 dark:border-violet-500/20">
            <span className="text-lg">⚡</span>
            <p className="text-xs text-violet-600 dark:text-violet-400 font-bold">{user?.totalXp || 0} XP</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✅" label="Completed today" value={stats?.today?.completed || 0}
          sub={`of ${stats?.today?.total || 0} tasks`} color="green" />
        <StatCard icon="📊" label="Productivity score" value={`${stats?.productivityScore || 0}%`}
          sub="today's performance" color="primary" />
        <StatCard icon="🎯" label="Active goals" value={stats?.activeGoals || 0}
          sub="in progress" color="violet" />
        <StatCard icon="📝" label="Journal entries" value={stats?.totalJournals || 0}
          sub="total written" color="amber" />
      </div>

      {/* Today's Progress Bar */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Today's Progress</h2>
          <span className="text-sm font-bold text-primary-500">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Today's Tasks</h2>
            <Link to="/tasks" className="text-xs text-primary-500 hover:text-primary-600 font-medium">View all →</Link>
          </div>

          {/* Quick Add */}
          <form onSubmit={handleQuickAdd} className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Add a task for today..."
                className="flex-1 text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button type="submit"
                className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                +
              </button>
            </div>
          </form>

          {/* Task List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {todayTasks.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">No tasks for today. Add one above!</p>
              </div>
            ) : (
              todayTasks.map(task => (
                <motion.div
                  key={task.id}
                  layout
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${task.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}
                  >
                    {task.status === 'completed' && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-slate-400">
                        {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <PriorityBadge priority={task.priority} />
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white px-1">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/tasks', icon: '✓', label: 'Tasks', desc: 'Manage your todo list', color: 'from-blue-500 to-cyan-500' },
              { to: '/goals', icon: '◎', label: 'Goals', desc: 'Track long-term goals', color: 'from-violet-500 to-purple-600' },
              { to: '/journal', icon: '▤', label: 'Journal', desc: 'Write today\'s entry', color: 'from-amber-500 to-orange-500' },
              { to: '/planner', icon: '⊞', label: 'Planner', desc: 'Plan your day', color: 'from-green-500 to-teal-500' },
            ].map(({ to, icon, label, desc, color }) => (
              <Link key={to} to={to}
                className="bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-lg mb-3 group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
