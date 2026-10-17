import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { authApi } from '../services/api';
import { Hospital, ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.login({
        usernameOrEmail: username,
        password: password,
      });

      if (res.data.success && res.data.data) {
        const authData = res.data.data;
        login(authData);
        const roles = authData.roles || authData.user?.roles || [];
        if (roles.includes('ROLE_PATIENT')) {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(res.data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication error. Please check your credentials or server.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-950">
      {/* Background VIP Luxury Modern Hospital Architecture Visual */}
      <img
        src="/images/vip_hospital_bg.jpg"
        alt="VIP Luxury Apex Medical Center Campus"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
      />
      {/* Elegant Dark Glass Backdrop Overlay */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] z-0"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10">
        {/* Left Branding Panel with Modern Hospital Visual */}
        <div className="md:col-span-5 relative text-white flex flex-col justify-between overflow-hidden p-8 border-r border-navy-800 min-h-[460px]">
          {/* Background AI Medical Team Visual */}
          <img
            src="/images/doctors_team_hero.jpg"
            alt="PULSE HMS Executive Medical Team"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/vip_hospital_bg.jpg";
            }}
          />
          {/* Executive Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-navy-950/80 to-navy-900/75 z-10 backdrop-blur-[1px]"></div>

          {/* Content Layer */}
          <div className="relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-lg shadow-teal-950/40 backdrop-blur-md">
                <Hospital className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-wide text-white drop-shadow-sm">PULSE HMS</h1>
                <p className="text-[11px] text-teal-300 font-bold tracking-widest uppercase">Apex Health Systems</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase">
                JCI &middot; NABH Certified Medical Center
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                Apex Clinical Directorate &amp; Care
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Multi-specialty clinical governance, real-time telemetry, inpatient beds matrix, and precision electronic health records.
              </p>
            </div>
          </div>

          <div className="relative z-20 mt-8 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 text-[11px] text-teal-200/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
              <span>HIPAA Compliant &middot; 256-Bit SSL &middot; Encrypted Vault</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign in to Hospital Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your staff or patient credentials to access your session</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Hospital Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr.rajesh or admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-navy-950/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Clinical Portal</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
