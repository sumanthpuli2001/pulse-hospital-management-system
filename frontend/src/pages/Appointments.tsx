import React, { useState, useEffect } from 'react';
import { appointmentApi, doctorApi, patientApi } from '../services/api';
import { Appointment, Doctor, Patient } from '../types';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';
import { Link, useNavigate } from 'react-router-dom';
import { TablePagination } from '../components/TablePagination';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form State
  const [patientId, setPatientId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadPrerequisites();
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (!doctorId) {
      setDoctorSchedules([]);
      return;
    }
    const fetchSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const res = await doctorApi.getDoctorSchedules(Number(doctorId));
        setDoctorSchedules(res.data.data || []);
      } catch (err) {
        console.error('Failed to load schedules for doctor', err);
        setDoctorSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, [doctorId]);

  const getAvailableSlots = () => {
    if (!appointmentDate) return [];
    const dateObj = new Date(appointmentDate + 'T00:00:00');
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

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointments({
        status: statusFilter || undefined,
        size: 50,
      });
      if (res.data.success) {
        setAppointments(res.data.data.content);
      }
    } catch (e) {
      console.error('Failed to load appointments', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPrerequisites = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        doctorApi.getDoctors({ size: 50 }),
        patientApi.getPatients({ size: 100 }),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.data.content);
      if (patRes.data.success) setPatients(patRes.data.data.content);
    } catch (e) {
      console.error('Failed to load prerequisites', e);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!patientId || !doctorId) {
      sweetAlert.warning('Incomplete Details', 'Please select both a patient and an attending doctor.');
      return;
    }

    if (!startTime) {
      sweetAlert.warning('Missing Time Slot', 'Please select a consultation time slot for this appointment.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (appointmentDate < today) {
      sweetAlert.warning('Invalid Date', 'Appointment date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const res = await appointmentApi.createAppointment({
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        appointmentDate,
        startTime,
        reasonForVisit: reason.trim() || 'General Medical Consultation',
      });

      if (res.data.success) {
        setShowModal(false);
        sweetAlert.success(
          'Appointment Confirmed!',
          `Appointment Number: ${res.data.data.appointmentNumber}\nDate: ${appointmentDate}\nTime Slot: ${startTime}\nStatus: SCHEDULED`
        );
        loadAppointments();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Doctor has an overlapping appointment in this time slot. Please pick an alternative time.';
      setError(msg);
      sweetAlert.error('Scheduling Conflict', msg);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await appointmentApi.updateStatus(id, newStatus);
      if (res.data.success) {
        sweetAlert.success('Status Updated', `Appointment marked as ${newStatus.replace('_', ' ')}.`);
        loadAppointments();
      }
    } catch (err: any) {
      sweetAlert.error('Status Update Failed', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCheckIn = async (apt: Appointment) => {
    const confirmed = await sweetAlert.confirm(
      'Confirm Patient Check-In',
      `Mark ${apt.patientName} (${apt.patientCode}) as physically arrived at reception?\n\nWhere it goes: Moves the appointment status from SCHEDULED to CHECKED_IN and places the patient directly into Dr. ${apt.doctorName}'s live OPD consultation queue.`,
      'Confirm Check-In',
      'Cancel'
    );
    if (confirmed) {
      updateStatus(apt.id, 'CHECKED_IN');
    }
  };

  const handleStartConsult = async (apt: Appointment) => {
    const confirmed = await sweetAlert.confirm(
      'Start Doctor Consultation',
      `Initiate outpatient clinical encounter for ${apt.patientName} with Dr. ${apt.doctorName}?\n\nWhere it goes: Advances visit status to IN_CONSULTATION. This enables the physician to author digital prescriptions, place clinical laboratory orders, and document SOAP clinical notes.`,
      'Start Consultation',
      'Cancel'
    );
    if (confirmed) {
      updateStatus(apt.id, 'IN_CONSULTATION');
    }
  };

  const handleFinishConsult = async (apt: Appointment) => {
    const confirmed = await sweetAlert.confirm(
      'Finalize Consultation Session',
      `Complete consultation for ${apt.patientName}?\n\nWhere it goes: Marks the visit as COMPLETED. Prescriptions are automatically routed to the Central Pharmacy dispensing queue and billable consultation charges are transferred to Billing.`,
      'Finalize Session',
      'Cancel'
    );
    if (confirmed) {
      updateStatus(apt.id, 'COMPLETED');
    }
  };

  const handleOpenEmr = async (apt: Appointment) => {
    const confirmed = await sweetAlert.confirm(
      'Open Patient EMR Chart',
      `Access comprehensive Electronic Medical Record for ${apt.patientName} (${apt.patientCode})?\n\nWhere it goes: Opens the clinical Electronic Medical Record (EMR) workspace to view longitudinal visit history, vitals telemetry, allergy alerts, diagnostic labs, and medications.`,
      'Open EMR Chart',
      'Cancel'
    );
    if (confirmed) {
      navigate(`/emr?patientId=${apt.patientId}`);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CHECKED_IN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_CONSULTATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const totalPages = Math.ceil(appointments.length / pageSize) || 1;
  const paginatedAppointments = appointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appointment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Transactional Conflict-Free Outpatient Scheduling</p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            if (patients.length > 0 && !patientId) setPatientId(patients[0].id);
            if (doctors.length > 0 && !doctorId) setDoctorId(doctors[0].id);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['', 'SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === st
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Appointments'}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">APT Number</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor & Department</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading appointments...</td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No appointments found</td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {apt.appointmentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{apt.patientName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{apt.patientCode}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{apt.doctorName}</p>
                      <p className="text-[11px] text-teal-600">{apt.departmentName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-medium">{apt.appointmentDate}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{apt.startTime} - {apt.endTime}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(apt.status)}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {apt.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleCheckIn(apt)}
                          className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition shadow-2xs"
                          title="Verify patient presence & queue for consultation"
                        >
                          Check In
                        </button>
                      )}
                      {apt.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleStartConsult(apt)}
                          className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition shadow-2xs"
                          title="Commence clinical outpatient consultation"
                        >
                          Start Consult
                        </button>
                      )}
                      {apt.status === 'IN_CONSULTATION' && (
                        <button
                          onClick={() => handleFinishConsult(apt)}
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition shadow-2xs"
                          title="Complete consultation and forward prescriptions/charges"
                        >
                          Finish
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEmr(apt)}
                        title="Open EMR Chart (confirms before navigation)"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition shadow-2xs"
                      >
                        <FileText className="w-3 h-3 text-slate-600" />
                        <span>EMR Chart</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10-entries-per-page Pagination */}
        {appointments.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={appointments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Book Outpatient Consultation</h3>
                  <p className="text-[11px] text-slate-400">Real-time double booking check enforced</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.patientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Physician *</label>
                <select
                  required
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                >
                  <option value="">-- Select Doctor Specialist --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} - {d.departmentName} (₹{d.consultationFee})
                    </option>
                  ))}
                </select>
                {doctorId && (
                  <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {loadingSchedules 
                        ? 'Checking doctor roster availability...' 
                        : doctorSchedules.length > 0 
                          ? `Working days: ${Array.from(new Set(doctorSchedules.map((s: any) => s.dayOfWeek))).join(', ')}`
                          : 'Available for general OPD consultations'}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Time Slot *</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
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
                <label className="block font-semibold text-slate-700 mb-1">Chief Reason for Consultation</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Regular health checkup, recurring fever, routine follow-up..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
