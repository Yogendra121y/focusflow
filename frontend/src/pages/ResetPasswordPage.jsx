import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token') || '';
  const email           = searchParams.get('email') || '';

  const [form, setForm]             = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]         = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(!token || !email);

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let s = 0;
    if (pw.length >= 8)          s++;
    if (pw.length >= 12)         s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { level: s, label: 'Weak',   color: 'bg-red-500' };
    if (s <= 3) return { level: s, label: 'Fair',   color: 'bg-amber-500' };
    return              { level: s, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength      = getStrength(form.password);
  const passwordsMatch = form.password && form.confirm && form.password === form.confirm;
  const canSubmit      = form.password.length >= 8 && passwordsMatch && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const data = await authAPI.resetPassword({ token, email, password: form.password });
      if (data?.token) {
        localStorage.setItem('focusflow_token', data.token);
        localStorage.setItem('focusflow_user', JSON.stringify(data.user));
        useAuthStore.setState({ user: data.user, token: data.token, isAuthenticated: true });
        toast.success('Password reset! Welcome back 🎉');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setTokenInvalid(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenInvalid) return (
    <div className="min-h-screen flex bg-surface-950 items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Link expired or invalid</h2>
        <p className="text-slate-400 mb-8">This reset link has expired or is no longer valid. Please request a new one.</p>
        <Link to="/forgot-password" className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all">
          Request new link
        </Link>
        <p className="mt-4">
          <Link to="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back to login</Link>
        </p>
      </motion.div>
    </div>
  );

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
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">New password,<br />fresh start.</h1>
          <p className="text-primary-200 text-lg leading-relaxed">Choose a strong password to keep your account secure.</p>
        </div>
        <p className="relative text-primary-300 text-sm">© 2025 FocusFlow. Built for makers.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Set new password</h2>
            <p className="text-slate-400">Resetting for <span className="text-white font-medium">{decodeURIComponent(email)}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required minLength={8} autoFocus
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-slate-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strength.level <= 1 ? 'text-red-400' : strength.level <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  className={`w-full px-4 py-3 bg-surface-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-10 ${
                    form.confirm
                      ? passwordsMatch ? 'border-emerald-500/50 focus:ring-emerald-500' : 'border-red-500/50 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-primary-500'
                  }`}
                  placeholder="Repeat your password"
                />
                {form.confirm && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passwordsMatch ? '✓' : '✗'}
                  </span>
                )}
              </div>
              {form.confirm && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={!canSubmit}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/25 active:scale-[0.99]">
              {isLoading ? 'Resetting...' : 'Reset password →'}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link to="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back to login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}