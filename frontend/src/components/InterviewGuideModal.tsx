import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Calendar, 
  Pill, 
  FlaskConical, 
  Bed, 
  CreditCard, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface InterviewGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewGuideModal: React.FC<InterviewGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'credentials' | 'architecture'>('workflow');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadWorkflowPdf = () => {
    const originalTitle = document.title;
    document.title = 'Hospital_Management_System_Clinical_Workflow_Guide';
    window.print();
    document.title = originalTitle;
  };

  const workflowSteps = [
    {
      step: 1,
      title: 'Patient Intake & Registration (Front Desk)',
      route: '/patients',
      icon: Users,
      badge: 'Step 1: Patient MPI Registry',
      color: 'teal',
      whatToSay: 'The system uses an enterprise Master Patient Index (MPI). When registering, it auto-generates a unique PAT-2026-XXXX record and provisions credentials for the Patient Portal with Password@123.',
      quickAction: 'Click "+ Register Patient", enter details, and observe instant validation.'
    },
    {
      step: 2,
      title: 'Doctor Rostering & Appointment Scheduling (OPD)',
      route: '/appointments',
      icon: Calendar,
      badge: 'Step 2: Collision Detection',
      color: 'blue',
      whatToSay: 'Doctor schedules enforce dynamic slot intervals (15/30 min). The backend features double-booking collision prevention that blocks overlapping reservations across doctors.',
      quickAction: 'Book an appointment for the newly registered patient with Dr. Rajesh Varma.'
    },
    {
      step: 3,
      title: 'Doctor Consultation & e-Prescriptions',
      route: '/prescriptions',
      icon: Pill,
      badge: 'Step 3: Electronic Health Record',
      color: 'indigo',
      whatToSay: 'Doctors author digital prescriptions with dosage, frequency, and instructions. These route instantly to the Central Pharmacy for fulfillment and inventory tracking.',
      quickAction: 'Open Prescriptions -> "+ Issue Prescription" -> Fill dosage -> Submit.'
    },
    {
      step: 4,
      title: 'Pathology Diagnostics & Lab Orders',
      route: '/laboratory',
      icon: FlaskConical,
      badge: 'Step 4: Laboratory Telemetry',
      color: 'violet',
      whatToSay: 'The diagnostic lab manages orders for CBC, Lipid Profile, and electrolytes. Technicians enter quantitative test values with reference range interpretations (NORMAL / HIGH / CRITICAL).',
      quickAction: 'Open Laboratory -> Select Order -> Click "Enter Results" -> Save verified values.'
    },
    {
      step: 5,
      title: 'Central Pharmacy & Batch Expiry Tracking',
      route: '/pharmacy',
      icon: Pill,
      badge: 'Step 5: Formulary & Stock Lot Control',
      color: 'emerald',
      whatToSay: 'Central pharmacy tracks FEFO (First-Expired, First-Out) inventory with barcode tracking, lot expiry alerts, and stock adjustments upon medication dispensation.',
      quickAction: 'Check low stock alerts or receive a new batch lot.'
    },
    {
      step: 6,
      title: 'Inpatient Bed Board & Live Patient Room',
      route: '/bed-board',
      icon: Bed,
      badge: 'Step 6: Ward Telemetry & IV Saline',
      color: 'amber',
      whatToSay: 'Real-time bed board tracks ICU, General, and Private wards. Clicking "Room View" opens live vitals telemetry with interactive IV Saline drip rate control and doctor check-ins.',
      quickAction: 'Click "Room View" on Bed 101 to see the interactive patient room, doctor check-in photo, and drip rate.'
    },
    {
      step: 7,
      title: 'Financial Billing & Revenue Settlement in ₹',
      route: '/billing',
      icon: CreditCard,
      badge: 'Step 7: Rupee-Safe Ledger',
      color: 'teal',
      whatToSay: 'All accounting adheres strictly to Indian Rupees (₹). Supports itemized invoicing, split-tenders, taxes, discounts, and real-time receipt generation with 0 round-off error.',
      quickAction: 'Click "+ Generate Invoice" or "Record Payment" to settle outstanding balance in ₹.'
    }
  ];

  const credentials = [
    { role: 'Super Admin', username: 'superadmin', pwd: 'Password@123', scope: 'Complete enterprise oversight, master data configuration, user management' },
    { role: 'Hospital Admin', username: 'admin', pwd: 'Password@123', scope: 'Department administration, doctor schedules, staff allocations' },
    { role: 'Specialist Doctor', username: 'dr.rajesh', pwd: 'Password@123', scope: 'OPD appointments, clinical charts, E-prescriptions, lab order authoring' },
    { role: 'Ward Nurse', username: 'nurse', pwd: 'Password@123', scope: 'Inpatient bed admissions, vitals recording, IV drip adjustments, shift handovers' },
    { role: 'Pharmacist', username: 'pharmacist', pwd: 'Password@123', scope: 'Medication dispensation, batch expiry auditing, stock inward receiving' },
    { role: 'Lab Technician', username: 'labtech', pwd: 'Password@123', scope: 'Specimen processing, pathology result entry, diagnostic reports' },
    { role: 'Accountant', username: 'accountant', pwd: 'Password@123', scope: 'Financial ledger, itemized invoices, payment clearance in ₹, revenue metrics' },
    { role: 'Receptionist', username: 'receptionist', pwd: 'Password@123', scope: 'Front-desk patient intake, registration, appointment slot booking' },
    { role: 'Patient Portal', username: 'patient1', pwd: 'Password@123', scope: 'Self-service patient dashboard, appointment history, prescriptions, billing' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-950 text-white px-6 py-4 flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Enterprise Hospital Operational Workflow Guide</h2>
              <p className="text-xs text-slate-300">Clinical Core Workflows &middot; Enterprise Architecture &middot; Role Credentials</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'workflow'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>7-Step Workflow Walkthrough</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'credentials'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>8 RBAC Logins & Passwords</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'architecture'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Architecture & Security Highlights</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Enterprise Clinical Data Flow: </span>
                  Standard end-to-end clinical workflow path. Patient data flows seamlessly from front-desk intake and doctor consultation all the way to lab orders, inpatient telemetry, pharmacy dispensing, and financial billing clearance.
                </div>
              </div>

              <div className="grid gap-3">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-400 transition shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {step.step}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                            {step.badge}
                          </span>
                        </div>
                        <Link
                          to={step.route}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg border border-teal-200 transition shrink-0"
                        >
                          <span>Open Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-900">Clinical Workflow: </span>
                        {step.whatToSay}
                      </div>

                      <div className="text-[11px] text-teal-800 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Standard Action:</strong> {step.quickAction}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                <span>All accounts share the standard password: <strong className="font-mono text-teal-800">Password@123</strong></span>
                <button
                  onClick={() => copyToClipboard('Password@123')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1"
                >
                  {copiedText === 'Password@123' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>Copy Password</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Scope & Capabilities</th>
                      <th className="py-2.5 px-3 text-right">Quick Copy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {credentials.map((c) => (
                      <tr key={c.username} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.role}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-teal-700">{c.username}</td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-600">{c.scope}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => copyToClipboard(c.username)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            {copiedText === c.username ? 'Copied!' : 'Copy User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Backend Architecture (Spring Boot 3.4)</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Spring Security 6 with stateless JWT Bearer token authentication</li>
                    <li>Global Exception Handler intercepting 400, 404, 405, and 409 into standard ApiResponse envelopes</li>
                    <li>Double-booking collision detection across doctors and time-slots</li>
                    <li>Optimistic locking and atomic inventory transactions for pharmacy stock</li>
                    <li>HIPAA compliant tamper-evident audit logging for patient records</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Frontend Engineering (React 18 + TypeScript)</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Vite-powered ultra-fast compilation with strict TypeScript validation</li>
                    <li>Custom SweetAlert2 dialog system replacing raw browser alerts</li>
                    <li>Decimal-safe monetary formatting in Indian Rupees (₹)</li>
                    <li>Interactive Patient Room telemetry with live IV saline drip animation</li>
                    <li>Role-Based Access Control (RBAC) route guarding with clean redirection</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
                <span className="font-bold text-xs">Clinical Enterprise Standard:</span>
                <p>
                  "Designed to high-availability enterprise EHR specifications (comparable to Epic and Cerner). Every clinical event—whether prescribing medication, running diagnostic lab orders, admitting to an ICU bed, or settling a hospital invoice in ₹—is strictly validated, auditable, and tied to authenticated RBAC credentials."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Hospital Management System &middot; Enterprise v2.0
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadWorkflowPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-slate-700"
              title="Download Complete 7-Step Clinical Workflow as PDF"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Download Workflow PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Close Workflow Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
