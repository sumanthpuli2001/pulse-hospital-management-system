import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { Search, Bell, ShieldCheck, Database, Server, Sparkles } from 'lucide-react';
import { getAvatarByRoleOrUser } from '../utils/avatars';
import { InterviewGuideModal } from './InterviewGuideModal';

export const Topbar: React.FC = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const notifications = [
    { id: 1, title: 'Low Stock Alert', desc: 'Amoxicillin 500mg has 40 units remaining (Reorder: 100)', time: '10m ago' },
    { id: 2, title: 'Admission Completed', desc: 'Patient Arjun Sharma admitted to ICU-101 (B-101-A)', time: '35m ago' },
    { id: 3, title: 'Invoice Paid', desc: 'Payment ₹65.00 completed for INV-2026-0001', time: '1h ago' },
  ];

  return (
    <>
    <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/90 px-6 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.03)] sticky top-0 z-20 transition-all">
      {/* Global Search Bar */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-teal-600 transition-colors" />
          <input
            type="text"
            placeholder="Search patient MRN, doctor, appointment, or RX..."
            className="w-full bg-slate-100/80 border border-slate-200/80 focus:border-teal-500 focus:bg-white focus:ring-3 focus:ring-teal-500/15 text-xs pl-10 pr-10 py-2 rounded-xl outline-none transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs font-medium"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 shadow-2xs pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Enterprise Live Operations Status */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Telemetry &middot; EMR Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>NABH Accredited &middot; 256-Bit SSL</span>
          </div>
        </div>

        {/* Workflow Guide Button */}
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
          title="Open Clinical Workflow Guide & Staff Roles"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Workflow Guide</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">System Notifications</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">3 New</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <span className="inline-block text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-0.5">
              {user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
            </span>
          </div>
          <div className="relative">
            <img
              src={getAvatarByRoleOrUser(
                user?.roles?.[0] || user?.username,
                user?.gender,
                `${user?.firstName || ''} ${user?.lastName || ''} ${user?.username || ''}`
              )}
              alt="User profile avatar"
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200 ring-2 ring-teal-500/20"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/avatars/admin.jpg';
              }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
        </div>
      </div>
    </header>
    <InterviewGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
};
