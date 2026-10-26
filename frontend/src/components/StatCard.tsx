import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'teal' | 'navy' | 'emerald' | 'amber' | 'rose' | 'indigo';
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'navy',
}) => {
  const colorStyles = {
    teal: {
      accent: 'from-teal-500 to-emerald-400',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/90 shadow-teal-500/10',
      glow: 'hover:shadow-teal-500/10',
    },
    navy: {
      accent: 'from-navy-700 via-teal-600 to-navy-900',
      badgeBg: 'bg-navy-50 text-navy-800 border-navy-200/90 shadow-navy-900/10',
      glow: 'hover:shadow-navy-900/10',
    },
    emerald: {
      accent: 'from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-emerald-500/10',
      glow: 'hover:shadow-emerald-500/10',
    },
    amber: {
      accent: 'from-amber-500 to-orange-400',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/90 shadow-amber-500/10',
      glow: 'hover:shadow-amber-500/10',
    },
    rose: {
      accent: 'from-rose-500 to-pink-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-rose-500/10',
      glow: 'hover:shadow-rose-500/10',
    },
    indigo: {
      accent: 'from-indigo-500 to-purple-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 shadow-indigo-500/10',
      glow: 'hover:shadow-indigo-500/10',
    },
  };

  const style = colorStyles[color] || colorStyles.navy;

  return (
    <div className={`group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${style.glow}`}>
      {/* Top Gradient Accent Glow Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.accent}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl border shadow-2xs group-hover:scale-110 transition-transform duration-300 ${style.badgeBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

