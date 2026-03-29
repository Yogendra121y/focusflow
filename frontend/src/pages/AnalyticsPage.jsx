import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsAPI } from '../services/api';

const CATEGORY_COLORS = {
  work: '#6366f1', study: '#8b5cf6', personal: '#ec4899',
  health: '#22c55e', finance: '#f59e0b', other: '#64748b',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-medium text-slate-900 dark:text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}{p.name?.includes('Score') ? '%' : ''}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('week');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dashRes, weekRes, monthRes, catRes, trendRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getWeekly(),
          analyticsAPI.getMonthly(),
          analyticsAPI.getCategories({ period: '30' }),
          analyticsAPI.getTrends({ days: 30 }),
        ]);
        setDashboard(dashRes.stats);
        setWeekly(weekRes.report || []);
        setMonthly(monthRes.report);
        setCategories(catRes.data || []);
        setTrends(trendRes.trends || []);
      } catch (err) {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Process category data for pie chart
  const categoryPieData = (() => {
    const map = {};
    categories.forEach(({ category, status, count }) => {
      if (!map[category]) map[category] = 0;
      map[category] += parseInt(count);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const SummaryCard = ({ label, value, unit = '', color, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}<span className="text-lg text-slate-400">{unit}</span></p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your productivity over time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="📊" label="Weekly score" value={dashboard?.week?.score || 0} unit="%" />
        <SummaryCard icon="✅" label="This week completed" value={dashboard?.week?.completed || 0} />
        <SummaryCard icon="🔥" label="Current streak" value={dashboard?.streak || 0} unit=" days" />
        <SummaryCard icon="⚡" label="Total XP earned" value={dashboard?.totalXp || 0} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {['week', 'month', 'trends'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Weekly View */}
      {activeTab === 'week' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Tasks Completed — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="dayName" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="completedTasks" name="Completed" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalTasks" name="Total" fill="#6366f120" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Daily Productivity Score</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="dayName" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="score" name="Score %" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly summary table */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white">Daily Breakdown</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weekly.map(day => (
                <div key={day.date} className="flex items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className="w-20 text-sm font-medium text-slate-700 dark:text-slate-300">{day.dayName}</span>
                  <span className="text-xs text-slate-400 w-24">{day.date}</span>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${day.score}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-10 text-right">{day.score}%</span>
                  </div>
                  <span className="ml-4 text-xs text-slate-400">{day.completedTasks}/{day.totalTasks} tasks</span>
                  {day.journalWritten && <span className="ml-2 text-xs text-green-500">📝</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {activeTab === 'month' && monthly && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tasks completed', value: monthly.totalCompleted },
              { label: 'Avg daily score', value: `${monthly.avgScore}%` },
              { label: 'Journal days', value: monthly.journalDays },
              { label: 'Active days', value: monthly.activeDays },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {categoryPieData.length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Tasks by Category (30 days)</h3>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {categoryPieData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {categoryPieData.map(({ name, value }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[name] || '#6366f1' }} />
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{name}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white ml-auto">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends View */}
      {activeTab === 'trends' && (
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-5">30-Day Productivity Trend</h3>
          {trends.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">Not enough data yet. Keep using FocusFlow!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends.map(t => ({ ...t, date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line dataKey="score" name="Score %" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line dataKey="completedTasks" name="Completed" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
