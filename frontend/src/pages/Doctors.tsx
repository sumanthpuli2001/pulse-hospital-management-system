import React, { useState, useEffect, useMemo } from 'react';
import { doctorApi } from '../services/api';
import { Doctor, Department, DoctorSchedule } from '../types';
import { useAuth } from '../services/authContext';
import {
  UserCheck,
  Search,
  Calendar,
  Phone,
  Mail,
  Award,
  Clock,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Building,
  Edit2,
  Trash2,
  PlusCircle,
  Stethoscope,
  IndianRupee,
  Check
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';
import { getDoctorPhoto, getUniqueDoctorAvatarList } from '../utils/avatars';

export const Doctors: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageDoctors = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dynamically compute guaranteed collision-free, gender-verified avatars for all doctors
  const doctorPhotosMap = useMemo(() => getUniqueDoctorAvatarList(doctors), [doctors]);

  // Selected Doctor for Schedules Modal
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: '',
    startTime: '09:00',
    endTime: '13:00',
    slotDurationMinutes: 15,
    maxPatientsPerSlot: 10,
  });

  // Add Doctor Modal State (No default pre-filled values; clean placeholders)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [doctorForm, setDoctorForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    specialization: '',
    qualifications: '',
    licenseNumber: '',
    consultationFee: '',
    roomNumber: '',
    bio: '',
    gender: '',
    isAvailable: true,
    isActive: true,
  });

  // Edit Doctor Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    specialization: '',
    qualifications: '',
    licenseNumber: '',
    consultationFee: '',
    roomNumber: '',
    bio: '',
    gender: 'MALE',
    isAvailable: true,
    isActive: true,
  });

  useEffect(() => {
    loadDoctors();
    loadDepartments();
  }, [search]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorApi.getDoctors({ search: search || undefined, size: 50 });
      if (res.data.success) {
        setDoctors(res.data.data.content);
      }
    } catch (e) {
      console.error('Failed to load doctors', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await doctorApi.getDepartments(false);
      if (res.data.success && res.data.data.length > 0) {
        setDepartments(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load departments', e);
    }
  };

  // --- Create Doctor Handler ---
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirstName = doctorForm.firstName.trim();
    const cleanLastName = doctorForm.lastName.trim();
    const cleanLicense = doctorForm.licenseNumber.trim();
    const cleanPhone = doctorForm.phoneNumber.trim().replace(/[^0-9]/g, '');

    if (!cleanFirstName || !cleanLastName) {
      sweetAlert.warning('Missing Name', 'Please enter first name and last name for the doctor.');
      return;
    }

    if (!cleanLicense) {
      sweetAlert.warning('Missing License', 'Medical council registration / license number is required.');
      return;
    }

    if (!doctorForm.departmentId) {
      sweetAlert.warning('Missing Department', 'Please select a clinical specialty department.');
      return;
    }

    if (!doctorForm.gender) {
      sweetAlert.warning('Missing Gender', 'Please select whether the doctor is Male or Female.');
      return;
    }

    if (cleanPhone && cleanPhone.length < 10) {
      sweetAlert.warning('Invalid Phone', 'Doctor contact number must be at least 10 digits.');
      return;
    }

    try {
      setAddLoading(true);
      setAddError('');
      const fee = Math.max(0, Number(doctorForm.consultationFee) || 500);
      const res = await doctorApi.createDoctor({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: doctorForm.email.trim() || undefined,
        phoneNumber: cleanPhone || undefined,
        departmentId: Number(doctorForm.departmentId),
        specialization: doctorForm.specialization.trim() || 'General Medicine',
        qualifications: doctorForm.qualifications.trim() || 'MBBS, MD',
        licenseNumber: cleanLicense,
        consultationFee: fee,
        roomNumber: doctorForm.roomNumber.trim() || 'OPD-101',
        bio: doctorForm.bio.trim() || 'Attending physician specialist.',
        gender: doctorForm.gender,
        isAvailable: doctorForm.isAvailable,
        isActive: doctorForm.isActive,
      });

      if (res.data.success) {
        const created = res.data.data;
        const loginUsername = (created as any)?.username || `dr.${cleanFirstName.toLowerCase()}`;
        setShowAddModal(false);
        sweetAlert.success(
          'Doctor Registered Successfully!',
          `Dr. ${cleanFirstName} ${cleanLastName} registered in registry.\nSpecialty: ${doctorForm.specialization || 'General Medicine'}\nPortal Login Username: ${loginUsername}\nPassword: Password@123`
        );
        setDoctorForm({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '',
          departmentId: '',
          specialization: '',
          qualifications: '',
          licenseNumber: '',
          consultationFee: '',
          roomNumber: '',
          bio: '',
          gender: '',
          isAvailable: true,
          isActive: true,
        });
        loadDoctors();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add doctor';
      setAddError(msg);
      sweetAlert.error('Registration Failed', msg);
    } finally {
      setAddLoading(false);
    }
  };

  // --- Open Edit Doctor Modal ---
  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setEditError('');
    setEditForm({
      firstName: doc.firstName || '',
      lastName: doc.lastName || '',
      email: doc.email || '',
      phoneNumber: doc.phoneNumber || '',
      departmentId: String(doc.departmentId || departments[0]?.id || 1),
      specialization: doc.specialization || '',
      qualifications: doc.qualifications || '',
      licenseNumber: doc.licenseNumber || '',
      consultationFee: String(doc.consultationFee || 500),
      roomNumber: doc.roomNumber || '',
      bio: doc.bio || '',
      gender: doc.gender || 'MALE',
      isAvailable: doc.isAvailable,
      isActive: doc.isActive,
    });
    setShowEditModal(true);
  };

  // --- Save Edited Doctor ---
  const handleSaveEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      setEditLoading(true);
      setEditError('');
      await doctorApi.updateDoctor(editingDoctor.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim() || undefined,
        phoneNumber: editForm.phoneNumber.trim() || undefined,
        departmentId: Number(editForm.departmentId),
        specialization: editForm.specialization.trim(),
        qualifications: editForm.qualifications.trim(),
        licenseNumber: editForm.licenseNumber.trim(),
        consultationFee: Number(editForm.consultationFee) || 500,
        roomNumber: editForm.roomNumber.trim(),
        bio: editForm.bio.trim(),
        gender: editForm.gender,
        isAvailable: editForm.isAvailable,
        isActive: editForm.isActive,
      });

      setShowEditModal(false);
      sweetAlert.success('Doctor Details Updated', `Profile and credentials for Dr. ${editForm.firstName} ${editForm.lastName} saved successfully.`);
      loadDoctors();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update doctor details';
      setEditError(msg);
      sweetAlert.error('Update Failed', msg);
    } finally {
      setEditLoading(false);
    }
  };

  // --- Schedules Management ---
  const viewSchedules = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setScheduleError('');
    setScheduleSuccess('');
    try {
      setLoadingSchedules(true);
      const res = await doctorApi.getDoctorSchedules(doc.id);
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load doctor schedules', e);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleAddScheduleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    if (!newSchedule.dayOfWeek) {
      sweetAlert.warning('Select Day', 'Please select a day of the week for the consultation shift.');
      return;
    }

    if (newSchedule.startTime >= newSchedule.endTime) {
      sweetAlert.warning('Invalid Time Range', 'Start time must be strictly before end time.');
      return;
    }

    // Client-side conflict check: prevent duplicate or overlapping slots on the same day
    const hasOverlap = schedules.some((s) => {
      if (s.dayOfWeek.toUpperCase() !== newSchedule.dayOfWeek.toUpperCase()) return false;
      const sStart = s.startTime.substring(0, 5);
      const sEnd = s.endTime.substring(0, 5);
      return newSchedule.startTime < sEnd && sStart < newSchedule.endTime;
    });

    if (hasOverlap) {
      sweetAlert.warning(
        'Duplicate Shift Conflict',
        `A consultation shift on ${newSchedule.dayOfWeek} already exists or overlaps with ${newSchedule.startTime} - ${newSchedule.endTime}. Duplicate shifts are not allowed.`
      );
      return;
    }

    try {
      setScheduleError('');
      await doctorApi.addDoctorSchedule(selectedDoctor.id, {
        dayOfWeek: newSchedule.dayOfWeek,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        slotDurationMinutes: Number(newSchedule.slotDurationMinutes) || 15,
        maxPatientsPerSlot: Number(newSchedule.maxPatientsPerSlot) || 10,
        isActive: true,
      });
      sweetAlert.success('Schedule Added', `Added ${newSchedule.dayOfWeek} (${newSchedule.startTime} - ${newSchedule.endTime}) shift for Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}.`);
      setNewSchedule({
        dayOfWeek: '',
        startTime: '09:00',
        endTime: '13:00',
        slotDurationMinutes: 15,
        maxPatientsPerSlot: 10,
      });
      // Reload schedules
      const res = await doctorApi.getDoctorSchedules(selectedDoctor.id);
      if (res.data.success) setSchedules(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add schedule slot';
      setScheduleError(msg);
      sweetAlert.error('Schedule Failed', msg);
    }
  };

  const handleDeleteScheduleSlot = async (scheduleId: number) => {
    if (!selectedDoctor) return;
    const confirmed = await sweetAlert.confirm(
      'Remove Shift?',
      'Are you sure you want to remove this shift from the doctor schedule roster?'
    );
    if (!confirmed) return;

    try {
      setScheduleError('');
      await doctorApi.deleteDoctorSchedule(scheduleId);
      sweetAlert.success('Shift Removed', 'OPD roster shift was removed successfully.');
      const res = await doctorApi.getDoctorSchedules(selectedDoctor.id);
      if (res.data.success) setSchedules(res.data.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete schedule slot';
      setScheduleError(msg);
      sweetAlert.error('Delete Failed', msg);
    }
  };



  // Safe fallback avatar if an image link fails
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=320&auto=format&fit=crop&q=80';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Medical Specialists &amp; Physicians</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinical Faculty Roster &middot; Doctor Duty Schedules &middot; Specialist Profiles &amp; Consultation Fees (₹)
          </p>
        </div>

        {canManageDoctors && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Doctor</span>
          </button>
        )}
      </div>

      {addSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{addSuccess}</span>
          </div>
          <button onClick={() => setAddSuccess('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by physician name, medical specialization, or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-teal-500 transition"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">No doctors found matching search criteria</div>
        ) : (
          doctors.map((doc, docIdx) => {
            const photoUrl = doctorPhotosMap.get(doc.id ?? docIdx) || getDoctorPhoto(doc, docIdx);
            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={photoUrl}
                          alt={`Dr. ${doc.firstName}`}
                          onError={handleImageError}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            doc.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={doc.isAvailable ? 'On duty' : 'Off duty'}
                        ></span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Dr. {doc.firstName} {doc.lastName}
                        </h3>
                        <p className="text-[11px] font-semibold text-teal-600">{doc.departmentName}</p>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {doc.gender || 'MALE'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.isAvailable ? 'Available' : 'Off-duty'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.qualifications} ({doc.specialization})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1">
                      <span>License: <code className="font-mono">{doc.licenseNumber}</code></span>
                      <span className="font-bold text-slate-900">Fee: ₹{Number(doc.consultationFee).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Room: {doc.roomNumber || 'OPD-101'}</span>
                  <div className="flex items-center gap-1.5">
                    {canManageDoctors && (
                      <button
                        onClick={() => openEditModal(doc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        title="Edit Doctor Profile"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => viewSchedules(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
                    >
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Schedules</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DOCTOR SCHEDULES & TIME ZONE ROSTER */}
      {/* ========================================================================= */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Consultation Schedules &middot; Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedDoctor.departmentName} &middot; Room: {selectedDoctor.roomNumber || 'OPD-101'} &middot; Fee: ₹{selectedDoctor.consultationFee}
                </p>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            {scheduleSuccess && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{scheduleSuccess}</span>
              </div>
            )}

            {scheduleError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{scheduleError}</span>
              </div>
            )}

            {/* List of Existing Time Slots */}
            <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
              {loadingSchedules ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading doctor schedules...</p>
              ) : schedules.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-100">
                  No custom schedule slots set yet. Standard shift applies (09:00 AM - 05:00 PM).
                </div>
              ) : (
                schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{s.dayOfWeek}</span>
                      <span className="text-teal-700 font-semibold ml-2 font-mono">{s.startTime} - {s.endTime}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({s.maxPatientsPerSlot} pts/slot &middot; {s.slotDurationMinutes}m)</span>
                    </div>
                    {canManageDoctors && (
                      <button
                        onClick={() => handleDeleteScheduleSlot(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Schedule Slot Form (Admin / Doctor) */}
            {canManageDoctors && (
              <form onSubmit={handleAddScheduleSlot} className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">+ Add Consultation Slot</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Day</label>
                    <select
                      value={newSchedule.dayOfWeek}
                      onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs outline-none focus:border-teal-500"
                    >
                      <option value="">-- Select Day --</option>
                      <option value="MONDAY">Monday</option>
                      <option value="TUESDAY">Tuesday</option>
                      <option value="WEDNESDAY">Wednesday</option>
                      <option value="THURSDAY">Thursday</option>
                      <option value="FRIDAY">Friday</option>
                      <option value="SATURDAY">Saturday</option>
                      <option value="SUNDAY">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">End Time</label>
                    <input
                      type="time"
                      required
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Save Schedule Slot</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DOCTOR (NO DEFAULT VALUES, CLEAN PLACEHOLDERS, GENDER COLUMN) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Register New Medical Specialist</h3>
                  <p className="text-[11px] text-slate-400">Adds clinician &middot; Provisions login account (dr.firstname / Password@123)</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDoctor} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh"
                    value={doctorForm.firstName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Varma"
                    value={doctorForm.lastName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={doctorForm.gender}
                    onChange={(e) => setDoctorForm({ ...doctorForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="MALE">Male Doctor</option>
                    <option value="FEMALE">Female Doctor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Department *</label>
                  <select
                    required
                    value={doctorForm.departmentId}
                    onChange={(e) => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh.varma@hospital.com"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={doctorForm.phoneNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCI-CARD-4491"
                    value={doctorForm.licenseNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, licenseNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono uppercase outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Interventional Cardiology"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Qualifications &amp; Degrees *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD (Medicine), DM (Cardiology)"
                    value={doctorForm.qualifications}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500"
                    value={doctorForm.consultationFee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OPD Consultation Room</label>
                <input
                  type="text"
                  placeholder="e.g. Room 204, OPD Block B"
                  value={doctorForm.roomNumber}
                  onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Bio &amp; Experience</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 12+ years of senior clinical consultation and cardiac critical care experience..."
                  value={doctorForm.bio}
                  onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Auto-creates doctor portal user account with password: <strong>Password@123</strong></span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {addLoading ? 'Registering...' : 'Add Doctor to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DOCTOR DETAILS */}
      {/* ========================================================================= */}
      {showEditModal && editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Profile: Dr. {editingDoctor.firstName} {editingDoctor.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-400">Update consultation fee, department, room, and clinical information</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditDoctor} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="MALE">Male Doctor</option>
                    <option value="FEMALE">Female Doctor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.consultationFee}
                    onChange={(e) => setEditForm({ ...editForm, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualifications *</label>
                <input
                  type="text"
                  required
                  value={editForm.qualifications}
                  onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">OPD Room Number</label>
                <input
                  type="text"
                  value={editForm.roomNumber}
                  onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Bio</label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isAvailable}
                    onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-700">Currently Available for Consultations</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-semibold text-slate-700">Active Roster Status</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Update Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
