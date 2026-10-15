import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuditLog } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Globe, 
  Eye, 
  FileText,
  Lock,
  Terminal
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (usernameFilter) params.append('username', usernameFilter);
      if (actionFilter) params.append('action', actionFilter);
      params.append('size', '50');

      const res = await api.get(`/audit/logs?${params.toString()}`);
      setLogs(res.data.data?.content || []);
    } catch (err: any) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-teal-600" />
          Security Audit Logs & Compliance Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable forensic audit trail of user access, clinical modifications, billing events, and authentication attempts
        </p>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by username (e.g. superadmin, dr.rajesh)..."
            value={usernameFilter}
            onChange={(e) => setUsernameFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Action Types</option>
          <option value="LOGIN_SUCCESS">Login Success</option>
          <option value="LOGIN_FAILED">Login Failed</option>
          <option value="PATIENT_REGISTERED">Patient Registered</option>
          <option value="APPOINTMENT_CREATED">Appointment Created</option>
          <option value="PRESCRIPTION_DISPENSED">Prescription Dispensed</option>
          <option value="INVOICE_CREATED">Invoice Created</option>
          <option value="PAYMENT_RECORDED">Payment Recorded</option>
          <option value="BED_ALLOCATED">Bed Allocated</option>
          <option value="BED_RELEASED">Bed Released</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Resource</th>
                <th className="px-5 py-3.5">Resource ID</th>
                <th className="px-5 py-3.5">Client IP</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No audit log records found.</td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isAuthFail = log.action.includes('FAIL');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-navy-950">
                        {log.username || 'ANONYMOUS'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                          isAuthFail
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                        {log.resourceName}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                        {log.resourceId || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Inspect Log Details */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base">Audit Trace #{selectedLog.id}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">User:</span>
                <span className="font-bold text-navy-950">{selectedLog.username}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Action:</span>
                <span className="font-mono text-teal-700 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Resource / Entity:</span>
                <span className="text-slate-800">{selectedLog.resourceName} (ID: {selectedLog.resourceId || 'N/A'})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Recorded At:</span>
                <span className="font-mono text-slate-700">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Client IP & User Agent:</span>
                <span className="font-mono text-slate-700 truncate max-w-xs">{selectedLog.ipAddress}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Payload / Details:</span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-lg text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-48">
                  {selectedLog.details || 'No additional payload metadata logged.'}
                </pre>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
