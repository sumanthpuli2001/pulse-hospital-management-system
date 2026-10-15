import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { getAvatarByRoleOrUser } from '../utils/avatars';
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Package,
  Bed,
  CreditCard,
  BarChart3,
  ShieldAlert,
  HeartHandshake,
  LogOut,
  Hospital,
  Database,
  BookOpen
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, hasRole, logout } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Activity,
      show: !hasRole(['ROLE_PATIENT']),
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: Users,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']),
    },
    {
      name: 'Doctors & Schedules',
      path: '/doctors',
      icon: UserCheck,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST']),
    },
    {
      name: 'Master Data Hub',
      path: '/master-data',
      icon: Database,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']),
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_RECEPTIONIST', 'ROLE_NURSE']),
    },
    {
      name: 'Clinical EMR',
      path: '/emr',
      icon: FileText,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']),
    },
    {
      name: 'Prescriptions',
      path: '/prescriptions',
      icon: Pill,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_PHARMACIST', 'ROLE_NURSE']),
    },
    {
      name: 'Laboratory',
      path: '/laboratory',
      icon: FlaskConical,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_LAB_TECHNICIAN', 'ROLE_NURSE']),
    },
    {
      name: 'Pharmacy Inventory',
      path: '/pharmacy',
      icon: Package,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_PHARMACIST', 'ROLE_ACCOUNTANT']),
    },
    {
      name: 'Inpatient Bed Board',
      path: '/bed-board',
      icon: Bed,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']),
    },
    {
      name: 'Billing & Payments',
      path: '/billing',
      icon: CreditCard,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_ACCOUNTANT']),
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_DOCTOR']),
    },
    {
      name: 'Audit Logs',
      path: '/audit',
      icon: ShieldAlert,
      show: hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']),
    },
    {
      name: 'User Manual',
      path: '/manual',
      icon: BookOpen,
      show: true,
    },
    {
      name: 'My Health Portal',
      path: '/portal',
      icon: HeartHandshake,
      show: hasRole(['ROLE_PATIENT']),
    },
  ];

  const primaryRole = user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF';

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-950 via-navy-950 to-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/70">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-teal-500/20">
          <Hospital className="w-5 h-5 text-navy-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base text-white tracking-wide">PULSE</span>
            <span className="text-teal-300 font-bold text-[10px] px-1.5 py-0.5 rounded bg-teal-950 border border-teal-700/60">HMS</span>
          </div>
          <p className="text-[10px] text-teal-400/80 font-medium tracking-wide">Enterprise Healthcare Hub</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Hospital Modules
        </div>
        {navItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 font-semibold border-l-3 border-teal-400 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Status Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={getAvatarByRoleOrUser(
                user?.roles?.[0] || user?.username,
                user?.gender,
                `${user?.firstName || ''} ${user?.lastName || ''} ${user?.username || ''}`
              )}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-slate-700 ring-1 ring-teal-500/30 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/avatars/admin.jpg';
              }}
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-navy-800 text-teal-400 border border-navy-700">
                {primaryRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
