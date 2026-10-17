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

  // Group items for high-end enterprise navigation structure
  const clinicalItems = navItems.filter(i => i.show && ['/dashboard', '/patients', '/doctors', '/appointments', '/emr', '/prescriptions', '/bed-board'].includes(i.path));
  const operationsItems = navItems.filter(i => i.show && ['/laboratory', '/pharmacy'].includes(i.path));
  const managementItems = navItems.filter(i => i.show && ['/master-data', '/billing', '/reports', '/audit'].includes(i.path));
  const otherItems = navItems.filter(i => i.show && ['/manual', '/portal'].includes(i.path));

  const renderNavGroup = (title: string, items: typeof navItems) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 pt-3 first:pt-0">
        <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
          <span>{title}</span>
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent text-teal-300 border-l-[3px] border-teal-400 shadow-[inset_0_0_12px_rgba(20,184,166,0.12)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-teal-400" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#080E1E] via-[#0B152B] to-[#060B18] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 shadow-2xl select-none relative z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-teal-500/25 ring-1 ring-white/20">
          <Hospital className="w-5 h-5 text-navy-950" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base text-white tracking-wider">PULSE</span>
            <span className="text-teal-300 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full bg-teal-950/90 border border-teal-500/40 tracking-wider">
              HMS
            </span>
          </div>
          <p className="text-[9px] text-teal-400/90 font-bold tracking-widest uppercase mt-0.5">Apex Health Systems</p>
        </div>
      </div>

      {/* Categorized Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {renderNavGroup('Clinical & Care', clinicalItems)}
        {renderNavGroup('Diagnostics & Meds', operationsItems)}
        {renderNavGroup('Admin & Governance', managementItems)}
        {renderNavGroup('System & Patient', otherItems)}
      </nav>

      {/* User Status Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={getAvatarByRoleOrUser(
                  user?.roles?.[0] || user?.username,
                  user?.gender,
                  `${user?.firstName || ''} ${user?.lastName || ''} ${user?.username || ''}`
                )}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-slate-700 ring-2 ring-teal-500/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/avatars/admin.jpg';
                }}
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 animate-pulse" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[9px] font-extrabold tracking-wider px-1.5 py-0.2 rounded bg-teal-950/80 text-teal-300 border border-teal-600/50 mt-0.5 uppercase">
                {primaryRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
