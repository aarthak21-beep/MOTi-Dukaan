import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Login: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'लॉगिन अयशस्वी झाले.');
    }
  };

  const handleDemoLogin = async () => {
    await loginDemo();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-white relative">
      {/* Language Switcher at Top Right */}
      <div className="absolute top-4 right-4 flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
        <button
          onClick={() => setLanguage('mr')}
          className={`px-3 py-1 rounded-lg font-semibold transition ${
            language === 'mr' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          मराठी
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-lg font-semibold transition ${
            language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          English
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-emerald-900/50">
          M
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          MOTi Dukaan
        </h1>
        <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-1">
          {t.brandTagline}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white text-center">
              {t.loginTitle}
            </h2>
            <p className="text-xs text-slate-300 text-center mt-0.5">
              {t.loginSubtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t.email}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patil.kirana@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-900/40 transition disabled:opacity-50"
            >
              {loading ? t.loading : t.loginButton}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Store Login button */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-300 mb-2">
              {t.demoLoginNote}
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 transition"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t.demoLoginButton}</span>
            </button>
          </div>

          <div className="mt-5 text-center">
            <Link
              to="/signup"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {t.dontHaveAccount}
            </Link>
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">{t.poweredBy}</p>
          <p className="text-[11px] text-slate-400">Software Brand: {t.softwareBrand} • Indian Kirana Retail SaaS</p>
        </div>
      </div>
    </div>
  );
};
