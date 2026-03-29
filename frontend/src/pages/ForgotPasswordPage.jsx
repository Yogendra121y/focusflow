import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
    } catch (_) {}
    setSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-surface-950">
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/20"
              style={{ width: `${120 + i * 80}px`, height: `${120 + i * 80}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">F</div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Locked out?<br />We've got you.</h1>
          <p className="text-primary-200 text-lg leading-relaxed">Enter your email and we'll send you a link to reset your password in seconds.</p>
        </div>
        <p className="relative text-primary-300 text-sm">© 2025 FocusFlow. Built for makers.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Forgot password?</h2>
                  <p className="text-slate-400">Enter your email and we'll send a reset link.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                    <input
                      type="email" required autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button type="submit" disabled={isLoading || !email.trim()}
                    className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-[0.99]">
                    {isLoading ? 'Sending...' : 'Send reset link →'}
                  </button>
                </form>
                <p className="mt-6 text-center text-slate-400 text-sm">
                  Remembered it?{' '}
                  <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Back to login</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Check your inbox</h2>
                <p className="text-slate-400 mb-2 leading-relaxed">
                  If <span className="text-white font-medium">{email}</span> is linked to a FocusFlow account, you'll receive a reset link shortly.
                </p>
                <p className="text-slate-500 text-sm mb-8">Didn't get it? Check your spam folder or try again.</p>
                <div className="space-y-3">
                  <button onClick={() => { setSubmitted(false); setEmail(''); }}
                    className="w-full py-3 bg-surface-800 hover:bg-surface-700 border border-slate-700 text-slate-300 font-medium rounded-xl transition-all">
                    Try a different email
                  </button>
                  <Link to="/login" className="block w-full py-3 text-center text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors">
                    ← Back to login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}