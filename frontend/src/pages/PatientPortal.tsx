import React, { useState, useEffect } from 'react';
import api, { doctorApi } from '../services/api';
import { Patient, Appointment, Prescription, LabOrder, Invoice, Doctor } from '../types';
import { useAuth } from '../services/authContext';
import { Link } from 'react-router-dom';
import { 
  HeartHandshake, 
  Calendar, 
  Pill, 
  FlaskConical, 
  Receipt, 
  User, 
  Clock, 
  PlusCircle, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  X,
  IndianRupee,
  BookOpen
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'labs' | 'billing'>('appointments');

  // View Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Book appointment modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    doctorId: '',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '',
    reasonForVisit: ''
  });
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // 1. Fetch own profile
      const profRes = await api.get('/patients/me');
      const pat = profRes.data.data;
      setProfile(pat);

      if (pat?.id) {
        // 2. Fetch associated clinical records
        const [appRes, rxRes, labRes, invRes, docRes] = await Promise.all([
          api.get(`/appointments?patientId=${pat.id}&size=20`),
          api.get(`/prescriptions?patientId=${pat.id}&size=20`),
          api.get(`/laboratory/orders?patientId=${pat.id}&size=20`),
          api.get(`/billing/invoices?patientId=${pat.id}&size=20`),
          api.get('/doctors?size=50')
        ]);

        setAppointments(appRes.data.data?.content || []);
        setPrescriptions(rxRes.data.data?.content || []);
        setLabOrders(labRes.data.data?.content || []);
        setInvoices(invRes.data.data?.content || []);
        setDoctors(docRes.data.data?.content || []);
      }
    } catch (err: any) {
      console.error('Failed to load patient portal records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (!bookForm.doctorId) {
      setDoctorSchedules([]);
      return;
    }
    const loadSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const res = await doctorApi.getDoctorSchedules(Number(bookForm.doctorId));
        setDoctorSchedules(res.data.data || []);
      } catch (err) {
        console.error('Failed to load doctor schedules', err);
        setDoctorSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };
    loadSchedules();
  }, [bookForm.doctorId]);

  const getAvailableSlots = () => {
    if (!bookForm.appointmentDate) return [];
    const dateObj = new Date(bookForm.appointmentDate + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    const matchingSchedules = doctorSchedules.filter((s: any) => s.active && s.dayOfWeek === dayName);

    if (matchingSchedules.length > 0) {
      const generatedSlots: { time: string; label: string }[] = [];
      matchingSchedules.forEach((sch: any) => {
        const [startH, startM] = (sch.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (sch.endTime || '17:00').split(':').map(Number);
        const step = sch.slotDurationMinutes || 30;

        let current = startH * 60 + startM;
        const end = endH * 60 + endM;

        while (current + step <= end) {
          const h = Math.floor(current / 60);
          const m = current % 60;
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
          const period = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const displayStr = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
          generatedSlots.push({ time: timeStr, label: displayStr });
          current += step;
        }
      });
      if (generatedSlots.length > 0) return generatedSlots;
    }

    return [
      { time: '09:00:00', label: '09:00 AM' },
      { time: '09:30:00', label: '09:30 AM' },
      { time: '10:00:00', label: '10:00 AM' },
      { time: '10:30:00', label: '10:30 AM' },
      { time: '11:00:00', label: '11:00 AM' },
      { time: '11:30:00', label: '11:30 AM' },
      { time: '14:00:00', label: '02:00 PM' },
      { time: '14:30:00', label: '02:30 PM' },
      { time: '15:00:00', label: '03:00 PM' },
      { time: '15:30:00', label: '03:30 PM' },
      { time: '16:00:00', label: '04:00 PM' },
    ];
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!bookForm.doctorId) {
      setBookError('Please select a physician from the doctor dropdown.');
      return;
    }
    if (!bookForm.appointmentDate) {
      setBookError('Please choose an appointment date.');
      return;
    }
    if (!bookForm.startTime) {
      setBookError('Please select a consultation time slot from the dropdown.');
      return;
    }
    try {
      setBookLoading(true);
      setBookError('');
      await api.post('/appointments', {
        patientId: profile.id,
        doctorId: Number(bookForm.doctorId),
        appointmentDate: bookForm.appointmentDate,
        startTime: bookForm.startTime,
        reasonForVisit: bookForm.reasonForVisit
      });
      setBookSuccess('Appointment scheduled successfully.');
      setShowBookModal(false);
      fetchPatientData();
      setTimeout(() => setBookSuccess(''), 4000);
    } catch (err: any) {
      setBookError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading your personal health portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-teal-600" />
            Patient Health & Self-Service Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-navy-950">{profile ? `${profile.firstName} ${profile.lastName}` : user?.firstName}</span>. Access your verified medical charts, prescriptions, and billing.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/manual"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-colors"
            title="Read Patient Portal Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>User Manual</span>
          </Link>
          <button
            onClick={() => { setBookError(''); setShowBookModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Request Appointment
          </button>
        </div>
      </div>

      {bookSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{bookSuccess}</span>
        </div>
      )}

      {/* Patient Demographic Profile Summary Card */}
      {profile && (
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white p-6 rounded-2xl shadow-md border border-navy-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{profile.firstName} {profile.lastName}</h2>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono text-xs">
                    {profile.patientCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Age: {profile.age} yrs • Gender: {profile.gender} • Blood Group: <span className="font-bold text-rose-300">{profile.bloodGroup || 'O+'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-teal-400" />
                <span>{profile.phoneNumber}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-400" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span className="truncate max-w-xs">{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          My Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          My Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'labs'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Diagnostic Lab Orders ({labOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices & Statements ({invoices.length})
        </button>
      </div>

      {/* TAB 1: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No scheduled visits</p>
              <p className="text-xs text-slate-400 mt-1">Click "Request Appointment" to book your doctor consultation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app) => (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-slate-400 block">{app.appointmentNumber}</span>
                      <h3 className="font-bold text-navy-950 text-base mt-0.5">Dr. {app.doctorName}</h3>
                      <p className="text-xs text-teal-600 font-medium">{app.departmentName}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      app.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.appointmentDate} at {app.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{app.reasonForVisit || 'General Follow-up'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active prescriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-navy-950 text-sm">{rx.prescriptionNumber}</span>
                      <span className="text-xs text-slate-400 ml-3">Prescribed by Dr. {rx.doctorName}</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      rx.status === 'DISPENSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rx.status}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2">Medication</th>
                          <th className="p-2">Dosage</th>
                          <th className="p-2">Frequency</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-navy-900">{item.medicineName}</td>
                            <td className="p-2 font-medium">{item.dosage}</td>
                            <td className="p-2">{item.frequency}</td>
                            <td className="p-2">{item.durationDays} days</td>
                            <td className="p-2 text-slate-500 italic">{item.instructions || 'As advised'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Diagnostic Labs */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          {labOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No laboratory investigations ordered</p>
            </div>
          ) : (
            <div className="space-y-4">
              {labOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-navy-950 text-sm">{order.orderNumber}</span>
                      <span className="text-xs text-slate-400 ml-3">Ordered by Dr. {order.doctorName} • {order.orderDate}</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between font-semibold text-navy-900">
                          <span>{item.testName} ({item.testCode})</span>
                          <span className="text-slate-500 font-mono">Barcode: {item.sampleBarcode || 'N/A'}</span>
                        </div>
                        {item.results && item.results.length > 0 && (
                          <div className="mt-2 border-t border-slate-200 pt-2 space-y-1">
                            {item.results.map((r, rIdx) => (
                              <div key={rIdx} className="flex justify-between text-xs">
                                <span className="text-slate-600">{r.parameterName}:</span>
                                <div>
                                  <span className={`font-bold ${r.abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                                    {r.resultValue} {r.unit}
                                  </span>
                                  <span className="text-slate-400 ml-2">Ref: {r.referenceRange}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No invoices or billing statements</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Billed Date</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Paid</th>
                    <th className="px-5 py-3.5">Balance Due</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-mono font-bold text-navy-950">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {inv.invoiceDate}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-navy-900">
                        ₹{Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-emerald-700">
                        ₹{Number(inv.paidAmount).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        {inv.balanceAmount > 0 ? (
                          <span className="text-rose-600">₹{Number(inv.balanceAmount).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowInvoiceModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-white rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-400" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Request Appointment */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                Schedule Doctor Visit
              </h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {bookError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Physician *</label>
                <select
                  required
                  value={bookForm.doctorId}
                  onChange={(e) => {
                    const docId = e.target.value;
                    setBookForm({ ...bookForm, doctorId: docId });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                >
                  <option value="">-- Select Doctor Specialist --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization}) - ₹{d.consultationFee}
                    </option>
                  ))}
                </select>
                {bookForm.doctorId && (
                  <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {loadingSchedules 
                        ? 'Checking doctor roster availability...' 
                        : doctorSchedules.length > 0 
                          ? `Working days: ${Array.from(new Set(doctorSchedules.map((s: any) => s.dayOfWeek))).join(', ')}`
                          : 'Available for daily clinic consultations'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={bookForm.appointmentDate}
                    onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Time Slot *</label>
                  <select
                    required
                    value={bookForm.startTime}
                    onChange={(e) => setBookForm({ ...bookForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Consultation Slot --</option>
                    {getAvailableSlots().map((slot) => (
                      <option key={slot.time} value={slot.time}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit</label>
                <textarea
                  rows={3}
                  value={bookForm.reasonForVisit}
                  onChange={(e) => setBookForm({ ...bookForm, reasonForVisit: e.target.value })}
                  placeholder="e.g. Regular health checkup, recurring fever, chest discomfort, follow-up..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {bookLoading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Invoice Details (Matching Billing & Image 1) */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400 border border-teal-500/30">
                  <Receipt className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span>Invoice #{selectedInvoice.invoiceNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedInvoice.status === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: {selectedInvoice.patientName || profile?.firstName + ' ' + profile?.lastName} ({selectedInvoice.patientCode || profile?.patientCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
              {/* Creator Account Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Billed / Uploaded By Account:</span>
                  <p className="font-semibold text-navy-900 text-sm mt-0.5">
                    {selectedInvoice.createdByUserName || 'Hospital Accounts & Billing Department'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Billing Date:</span>
                  <p className="font-mono font-medium text-slate-800 mt-0.5">{selectedInvoice.invoiceDate}</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider mb-2.5">Itemized Charges</h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-700">{item.itemType}</td>
                          <td className="p-3 text-slate-800">{item.description}</td>
                          <td className="p-3 text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-navy-900">₹{Number(item.totalPrice).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">Standard clinical and consultation charges</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600 border border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{Number(selectedInvoice.subtotal || selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-mono text-emerald-600">-₹{Number(selectedInvoice.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-navy-950">
                  <span>Total Due:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-emerald-700">
                  <span>Paid:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600">
                  <span>Balance Outstanding:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Receipts History */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider mb-2">Payment Transaction History</h4>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-emerald-900">{p.paymentNumber}</span>
                          <span className="text-slate-500 ml-2">Method: {p.paymentMethod}</span>
                          {p.transactionReference && (
                            <span className="text-slate-400 ml-2 font-mono text-[11px]">{p.transactionReference}</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-sm">₹{Number(p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Close Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
