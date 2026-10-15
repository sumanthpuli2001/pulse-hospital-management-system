import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { HospitalCensusReport, RevenueReport, BedOccupancyReport, DoctorWorkloadReport } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  IndianRupee, 
  Bed, 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  Activity,
  Download,
  Building,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export const Reports: React.FC = () => {
  const [census, setCensus] = useState<HospitalCensusReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [occupancy, setOccupancy] = useState<BedOccupancyReport | null>(null);
  const [workload, setWorkload] = useState<DoctorWorkloadReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'census' | 'revenue' | 'beds' | 'doctors'>('census');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [cRes, rRes, bRes, wRes] = await Promise.all([
          api.get('/reports/census'),
          api.get('/reports/revenue').catch(() => ({ data: { data: null } })),
          api.get('/reports/bed-occupancy'),
          api.get('/reports/doctor-workload')
        ]);

        setCensus(cRes.data.data);
        setRevenue(rRes.data.data);
        setOccupancy(bRes.data.data);
        setWorkload(wRes.data.data || []);
      } catch (err: any) {
        console.error('Failed to load analytical reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const exportCSV = () => {
    if (!workload || workload.length === 0) return;
    const headers = ['Doctor Name', 'Department', 'Total Appointments', 'Completed Appointments', 'Active Inpatients'];
    const rows = workload.map(d => [
      `"${d.doctorName}"`,
      `"${d.departmentName}"`,
      d.totalAppointments,
      d.completedAppointments,
      d.activeInpatients
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hms_doctor_workload_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const revenuePieData = revenue ? [
    { name: 'Collected', value: Number(revenue.totalCollected), color: '#0d9488' },
    { name: 'Outstanding', value: Number(revenue.outstandingBalance), color: '#e11d48' }
  ] : [];

  const wardBarData = occupancy?.bedsByWard ? Object.keys(occupancy.bedsByWard).map(ward => ({
    name: ward,
    Total: occupancy.bedsByWard[ward],
    Occupied: occupancy.occupiedBedsByWard[ward] || 0
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Institutional census, clinical throughput, department productivity, and receivables intelligence
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm transition-colors self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-400" />
          Export Clinical Data (CSV)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('census')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'census'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hospital Census & KPIs
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'revenue'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Revenue & Billing Collections
        </button>
        <button
          onClick={() => setActiveTab('beds')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'beds'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bed Occupancy Matrix
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'doctors'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Doctor Clinical Workload
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Aggregating hospital database statistics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Hospital Census */}
          {activeTab === 'census' && census && (
            <div className="space-y-6">
              {/* 7 KPI Executive Cards in a Unified Single-Row Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
                {/* 1. Registered Patients */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 border border-blue-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Patients</span>
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-blue-950 tracking-tight">{census.totalPatients}</p>
                  <p className="text-[10px] text-blue-600 font-medium mt-1 truncate">Master Registry</p>
                </div>

                {/* 2. Appointments Today */}
                <div className="relative overflow-hidden bg-gradient-to-br from-teal-50/90 via-white to-teal-50/30 border border-teal-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Appts Today</span>
                    <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-teal-950 tracking-tight">{census.todayAppointments}</p>
                  <p className="text-[10px] text-teal-600 font-medium mt-1 truncate">Scheduled Visits</p>
                </div>

                {/* 3. Active Inpatients */}
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/90 via-white to-purple-50/30 border border-purple-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Inpatients</span>
                    <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <Bed className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-purple-950 tracking-tight">{census.activeInpatients}</p>
                  <p className="text-[10px] text-purple-600 font-medium mt-1 truncate">Admitted Wards</p>
                </div>

                {/* 4. Bed Occupancy */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border border-amber-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Bed Occupancy</span>
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-amber-950 tracking-tight">{census.bedOccupancyPercentage}%</p>
                  <p className="text-[10px] text-amber-700 font-medium mt-1 truncate">{census.occupiedBeds}/{census.totalBeds} Beds Filled</p>
                </div>

                {/* 5. Available Doctors */}
                <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50/90 via-white to-cyan-50/30 border border-cyan-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800">Doctors</span>
                    <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-cyan-950 tracking-tight">
                    {census.availableDoctors} <span className="text-xs font-semibold text-cyan-600">/ {census.totalDoctors}</span>
                  </p>
                  <p className="text-[10px] text-cyan-700 font-medium mt-1 truncate">Active On Duty</p>
                </div>

                {/* 6. Pending Lab Orders */}
                <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/90 via-white to-orange-50/30 border border-orange-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Pending Labs</span>
                    <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-orange-950 tracking-tight">{census.pendingLabOrders}</p>
                  <p className="text-[10px] text-orange-600 font-medium mt-1 truncate">Awaiting Results</p>
                </div>

                {/* 7. Low Stock Formulary Drugs */}
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30 border border-rose-200 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Low Stock</span>
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-rose-950 tracking-tight">{census.lowStockMedicines}</p>
                  <p className="text-[10px] text-rose-600 font-medium mt-1 truncate">Reorder Drugs</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Revenue */}
          {activeTab === 'revenue' && revenue && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Gross Revenue Billed</p>
                  <p className="text-3xl font-bold text-navy-950 mt-2">₹{Number(revenue.totalBilled).toFixed(2)}</p>
                  <p className="text-xs text-slate-400 mt-1">{revenue.totalInvoices} Invoices Generated</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Realized Collections</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">₹{Number(revenue.totalCollected).toFixed(2)}</p>
                  <p className="text-xs text-emerald-600 mt-1">{revenue.paidInvoices} Fully Paid</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
                  <p className="text-xs font-semibold text-rose-700 uppercase">Outstanding Receivables</p>
                  <p className="text-3xl font-bold text-rose-700 mt-2">₹{Number(revenue.outstandingBalance).toFixed(2)}</p>
                  <p className="text-xs text-rose-600 mt-1">{revenue.issuedInvoices + revenue.partiallyPaidInvoices} Open Invoices</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-navy-900 text-sm mb-4">Cash Collection vs Outstanding Receivables Breakdown</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenuePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenuePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Bed Occupancy */}
          {activeTab === 'beds' && occupancy && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total Beds</p>
                  <p className="text-3xl font-bold text-navy-950 mt-1">{occupancy.totalBeds}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Available</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{occupancy.availableBeds}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
                  <p className="text-xs font-semibold text-amber-700 uppercase">Occupied</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{occupancy.occupiedBeds}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-sm bg-teal-50/20">
                  <p className="text-xs font-semibold text-teal-700 uppercase">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-teal-800 mt-1">{occupancy.occupancyRatePercentage}%</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-navy-900 text-sm mb-4">Ward Capacity vs Current Inpatient Load</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wardBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Capacity" />
                      <Bar dataKey="Occupied" fill="#0d9488" radius={[4, 4, 0, 0]} name="Inpatients Occupied" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Doctor Workload */}
          {activeTab === 'doctors' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-navy-900 text-sm">Physician Clinical Throughput & Caseload</h3>
                <span className="text-xs text-slate-500">{workload.length} Active Physicians</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Doctor Name</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5 text-center">Total Appointments</th>
                      <th className="px-5 py-3.5 text-center">Completed Visits</th>
                      <th className="px-5 py-3.5 text-center">Completion Rate</th>
                      <th className="px-5 py-3.5 text-center">Active Inpatients</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workload.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400">No physician workload data found.</td>
                      </tr>
                    ) : (
                      workload.map((doc) => {
                        const rate = doc.totalAppointments > 0 
                          ? ((doc.completedAppointments / doc.totalAppointments) * 100).toFixed(0)
                          : '100';
                        return (
                          <tr key={doc.doctorId} className="hover:bg-slate-50/80">
                            <td className="px-5 py-3.5 font-bold text-navy-950">
                              Dr. {doc.doctorName}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                {doc.departmentName}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                              {doc.totalAppointments}
                            </td>
                            <td className="px-5 py-3.5 text-center font-bold text-teal-600">
                              {doc.completedAppointments}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="font-semibold text-navy-900">{rate}%</span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-bold text-amber-600">
                              {doc.activeInpatients}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
