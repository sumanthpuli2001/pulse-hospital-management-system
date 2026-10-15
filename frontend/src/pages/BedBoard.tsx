import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { inpatientApi } from '../services/api';
import { BedBoardItem, Ward, Patient, Doctor } from '../types';
import { useAuth } from '../services/authContext';
import { 
  Bed, 
  PlusCircle, 
  ArrowRightLeft, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  AlertCircle,
  Building,
  User,
  Activity,
  Layers,
  Eye
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { sweetAlert } from '../components/SweetAlert';

export const BedBoard: React.FC = () => {
  const { hasRole } = useAuth();
  const [beds, setBeds] = useState<BedBoardItem[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedBoardItem | null>(null);

  // Form states
  const [addBedForm, setAddBedForm] = useState({
    wardId: '',
    roomNumber: '',
    roomType: 'GENERAL_WARD',
    dailyRate: '100',
    bedNumber: '',
  });
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    doctorId: '',
    bedId: '',
    admissionReason: ''
  });
  const [transferForm, setTransferForm] = useState({
    newBedId: '',
    reason: ''
  });
  const [dischargeForm, setDischargeForm] = useState({
    dischargeSummary: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canManageBeds = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_NURSE', 'ROLE_DOCTOR']);
  const canAdmit = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE', 'ROLE_RECEPTIONIST']);
  const canTransfer = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']);
  const canDischarge = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR', 'ROLE_NURSE']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bedsRes, wardsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/inpatient/bed-board'),
        api.get('/inpatient/wards'),
        api.get('/patients?size=100'),
        api.get('/doctors?size=100')
      ]);

      setBeds(bedsRes.data.data || []);
      setWards(wardsRes.data.data || []);
      setPatients(patientsRes.data.data?.content || []);
      setDoctors(doctorsRes.data.data?.content || []);
    } catch (err: any) {
      console.error('Failed to load bed board data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddBed = () => {
    setAddBedForm({
      wardId: '',
      roomNumber: '',
      roomType: '',
      dailyRate: '100',
      bedNumber: '',
    });
    setActionError('');
    setShowAddBedModal(true);
  };

  const handleAddBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBedForm.wardId) {
      sweetAlert.warning('Missing Ward', 'Please select a target inpatient ward from the dropdown.');
      return;
    }
    if (!addBedForm.roomType) {
      sweetAlert.warning('Missing Room Type', 'Please select a room classification from the dropdown.');
      return;
    }
    if (!addBedForm.roomNumber.trim() || !addBedForm.bedNumber.trim()) {
      sweetAlert.warning('Missing Fields', 'Please specify both Room Number and Bed Number.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');

      // Find if room already exists on this ward
      const existingBedInRoom = beds.find(
        (b) => b.wardId === Number(addBedForm.wardId) && b.roomNumber.trim().toUpperCase() === addBedForm.roomNumber.trim().toUpperCase()
      );

      let targetRoomId = existingBedInRoom?.roomId;

      if (!targetRoomId) {
        // Create room first
        const roomRes = await inpatientApi.createRoom({
          wardId: Number(addBedForm.wardId),
          roomNumber: addBedForm.roomNumber.trim(),
          roomType: addBedForm.roomType || 'GENERAL_WARD',
          dailyRate: Number(addBedForm.dailyRate) || 100,
        });
        targetRoomId = roomRes.data.data.id;
      }

      // Create bed
      const bedRes = await inpatientApi.createBed({
        roomId: targetRoomId,
        bedNumber: addBedForm.bedNumber.trim(),
      });

      if (bedRes.data.success) {
        setShowAddBedModal(false);
        sweetAlert.success('Bed Created', `Bed ${addBedForm.bedNumber} has been added successfully.`);
        fetchData();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create bed. Ensure bed number is unique.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAdmit = (bed?: BedBoardItem) => {
    setAdmitForm({
      patientId: '',
      doctorId: '',
      bedId: bed ? bed.bedId.toString() : '',
      admissionReason: ''
    });
    setActionError('');
    setShowAdmitModal(true);
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId) {
      sweetAlert.warning('Missing Patient', 'Please select a patient to admit.');
      return;
    }
    if (!admitForm.doctorId) {
      sweetAlert.warning('Missing Attending Doctor', 'Please select the admitting doctor.');
      return;
    }
    if (!admitForm.bedId) {
      sweetAlert.warning('Missing Bed', 'Please choose an available bed.');
      return;
    }
    if (!admitForm.admissionReason.trim()) {
      sweetAlert.warning('Missing Diagnosis', 'Please enter admission diagnosis / clinical reason.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await api.post('/inpatient/admissions', {
        patientId: Number(admitForm.patientId),
        admittingDoctorId: Number(admitForm.doctorId),
        doctorId: Number(admitForm.doctorId),
        bedId: Number(admitForm.bedId),
        admissionReason: admitForm.admissionReason.trim()
      });
      setShowAdmitModal(false);
      sweetAlert.success('Patient Admitted', 'Patient admitted and bed allocated. Telemetry and IV Saline monitoring activated.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to admit patient';
      setActionError(msg);
      sweetAlert.error('Admission Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenTransfer = (bed: BedBoardItem) => {
    setSelectedBed(bed);
    setTransferForm({
      newBedId: '',
      reason: ''
    });
    setActionError('');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedBed.currentAdmissionId) return;

    if (!transferForm.newBedId) {
      sweetAlert.warning('Missing Target Bed', 'Please select an available target bed for transfer.');
      return;
    }
    if (!transferForm.reason.trim()) {
      sweetAlert.warning('Missing Clinical Reason', 'Please enter clinical reason for the bed transfer.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      await api.post(`/inpatient/admissions/${selectedBed.currentAdmissionId}/transfer-bed`, {
        targetBedId: Number(transferForm.newBedId),
        newBedId: Number(transferForm.newBedId),
        transferReason: transferForm.reason.trim(),
        reason: transferForm.reason.trim()
      });
      setShowTransferModal(false);
      sweetAlert.success('Bed Transferred', 'Patient moved to target bed. Ward census updated.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to transfer bed';
      setActionError(msg);
      sweetAlert.error('Transfer Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDischarge = (bed: BedBoardItem) => {
    setSelectedBed(bed);
    setDischargeForm({
      dischargeSummary: ''
    });
    setActionError('');
    setShowDischargeModal(true);
  };

  const handleDischargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedBed.currentAdmissionId) return;

    if (!dischargeForm.dischargeSummary.trim()) {
      sweetAlert.warning('Missing Discharge Notes', 'Please provide clinical discharge summary notes before releasing bed.');
      return;
    }

    const confirmed = await sweetAlert.confirm(
      'Confirm Discharge',
      `Discharge patient ${selectedBed.currentPatientName || ''} from bed ${selectedBed.bedNumber}? Bed will be freed.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setActionError('');
      await api.post(`/inpatient/admissions/${selectedBed.currentAdmissionId}/discharge`, {
        dischargeSummary: dischargeForm.dischargeSummary.trim()
      });
      setShowDischargeModal(false);
      sweetAlert.success('Patient Discharged', `Patient discharged from Bed ${selectedBed.bedNumber}. Bed is now sanitized and available.`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to discharge patient';
      setActionError(msg);
      sweetAlert.error('Discharge Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations
  const totalBedsCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const maintenanceCount = beds.filter(b => b.status === 'MAINTENANCE').length;
  const occupancyRate = totalBedsCount > 0 ? ((occupiedCount / totalBedsCount) * 100).toFixed(1) : '0';

  // Available beds for dropdowns
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');

  // Filtered beds
  const filteredBeds = beds.filter(b => {
    const matchesWard = selectedWard === 'ALL' || b.wardName === selectedWard;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesSearch = 
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.currentPatientName && b.currentPatientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.currentPatientCode && b.currentPatientCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesWard && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <Bed className="w-6 h-6 text-teal-600" />
            Inpatient Bed Management & Live Census
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time visual matrix of wards, rooms, inpatient occupancy, and bed allocation workflows
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {canManageBeds && (
            <button
              onClick={handleOpenAddBed}
              className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Bed className="w-3.5 h-3.5 text-teal-400" />
              + Add Bed
            </button>
          )}
          {canAdmit && (
            <button
              onClick={() => handleOpenAdmit()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Admit Patient
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Capacity</p>
            <p className="text-2xl font-bold text-navy-950 mt-1">{totalBedsCount}</p>
          </div>
          <Building className="w-8 h-8 text-slate-400" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">Available Beds</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{availableCount}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/20">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Occupied Beds</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{occupiedCount}</p>
          </div>
          <User className="w-8 h-8 text-amber-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between bg-rose-50/20">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase">Maintenance</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{maintenanceCount}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-navy-200 shadow-sm flex items-center justify-between bg-navy-50/30">
          <div>
            <p className="text-xs font-semibold text-navy-700 uppercase">Occupancy Rate</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">{occupancyRate}%</p>
          </div>
          <Activity className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bed number, room, ward, or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bed Grid Matrix */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Loading live inpatient census and bed assignments...</p>
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">No beds found</p>
          <p className="text-sm text-slate-400 mt-1">Adjust your search query or filters above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBeds.map((bed) => {
            const isOccupied = bed.status === 'OCCUPIED';
            const isAvailable = bed.status === 'AVAILABLE';

            return (
              <div
                key={bed.bedId}
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  isOccupied
                    ? 'border-amber-200 bg-amber-50/20 shadow-sm'
                    : isAvailable
                    ? 'border-emerald-200 bg-emerald-50/20 shadow-sm hover:border-emerald-400'
                    : 'border-slate-200 bg-slate-50 shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-navy-900">{bed.bedNumber}</span>
                    <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-white border border-slate-200">
                      {bed.roomNumber}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isOccupied
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {bed.status}
                  </span>
                </div>

                {/* Details */}
                <div className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Ward:</span>
                    <span className="font-medium text-navy-900">{bed.wardName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Type:</span>
                    <span className="font-medium text-slate-800">{bed.roomType}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Rate:</span>
                    <span className="font-medium text-slate-800">₹{Number(bed.dailyRate).toFixed(2)}/day</span>
                  </div>

                  {isOccupied ? (
                    <div className="mt-3 pt-3 border-t border-amber-200 bg-white/70 p-2.5 rounded-lg border border-amber-100">
                      <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Patient</p>
                      <p className="font-bold text-navy-950 text-sm mt-0.5">{bed.currentPatientName}</p>
                      <p className="text-slate-500 text-[11px]">Code: {bed.currentPatientCode}</p>
                      <p className="text-slate-500 text-[11px]">Adm #: {bed.currentAdmissionNumber}</p>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-emerald-200 text-center py-2">
                      <p className="text-emerald-700 text-xs font-medium">Ready for Intake</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-200 flex gap-2">
                  {isAvailable && canAdmit && (
                    <button
                      onClick={() => handleOpenAdmit(bed)}
                      className="w-full py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Admit Here
                    </button>
                  )}

                  {isOccupied && (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => navigate(`/patient-room/${bed.bedId}`)}
                        className="w-full py-1.5 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        View Patient Room
                      </button>
                      <div className="flex gap-2 w-full">
                        {canTransfer && (
                          <button
                            onClick={() => handleOpenTransfer(bed)}
                            className="flex-1 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                            Transfer
                          </button>
                        )}
                        {canDischarge && (
                          <button
                            onClick={() => handleOpenDischarge(bed)}
                            className="flex-1 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-600" />
                            Discharge
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Admit Patient */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-400" />
                Admit Inpatient & Allocate Bed
              </h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admitting Physician *</label>
                <select
                  value={admitForm.doctorId}
                  onChange={(e) => setAdmitForm({ ...admitForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">-- Select Admitting Physician --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName || `Dr. ${d.firstName || ''} ${d.lastName || ''}`} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Bed *</label>
                <select
                  value={admitForm.bedId}
                  onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">-- Select Available Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.bedId} value={b.bedId}>
                      Bed {b.bedNumber} - Room {b.roomNumber} ({b.wardName} - ₹{b.dailyRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Admission *</label>
                <textarea
                  rows={3}
                  value={admitForm.admissionReason}
                  onChange={(e) => setAdmitForm({ ...admitForm, admissionReason: e.target.value })}
                  placeholder="Clinical reason, provisional diagnosis, or symptoms requiring hospitalization..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Allocating Bed...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Bed */}
      {showAddBedModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Bed className="w-5 h-5 text-teal-400" />
                Add Inpatient Bed
              </h3>
              <button onClick={() => setShowAddBedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddBedSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Inpatient Ward *</label>
                <select
                  value={addBedForm.wardId}
                  onChange={(e) => setAddBedForm({ ...addBedForm, wardId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  required
                >
                  <option value="">-- Select Target Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Floor {w.floorNumber} &middot; {w.wardType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={addBedForm.roomNumber}
                    onChange={(e) => setAddBedForm({ ...addBedForm, roomNumber: e.target.value })}
                    placeholder="e.g. GEN-201 or ICU-101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Classification *</label>
                  <select
                    value={addBedForm.roomType}
                    onChange={(e) => setAddBedForm({ ...addBedForm, roomType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    required
                  >
                    <option value="">-- Select Room Classification --</option>
                    <option value="GENERAL_WARD">General Ward</option>
                    <option value="PRIVATE">Private Room</option>
                    <option value="SEMI_PRIVATE">Semi-Private</option>
                    <option value="ICU_ISOLATION">ICU Isolation</option>
                    <option value="DELUXE">Deluxe Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Bed Number *</label>
                  <input
                    type="text"
                    value={addBedForm.bedNumber}
                    onChange={(e) => setAddBedForm({ ...addBedForm, bedNumber: e.target.value })}
                    placeholder="e.g. B-201-C"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Bed Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={addBedForm.dailyRate}
                    onChange={(e) => setAddBedForm({ ...addBedForm, dailyRate: e.target.value })}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <p className="font-semibold text-navy-950">Capacity Expansion Notice</p>
                <p className="mt-0.5">Creating this bed will immediately register it in the hospital census matrix as AVAILABLE for clinical admissions.</p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBedModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Bed...' : 'Create & Register Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Transfer Bed */}
      {showTransferModal && selectedBed && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-teal-400" />
                Bed Transfer: {selectedBed.currentPatientName}
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p className="text-slate-600">Current Bed: <span className="font-semibold text-navy-900">{selectedBed.bedNumber} (Room {selectedBed.roomNumber}, {selectedBed.wardName})</span></p>
                <p className="text-slate-600">Patient: <span className="font-semibold text-navy-900">{selectedBed.currentPatientName} ({selectedBed.currentPatientCode})</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Available Bed *</label>
                <select
                  value={transferForm.newBedId}
                  onChange={(e) => setTransferForm({ ...transferForm, newBedId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  required
                >
                  <option value="">-- Select Target Available Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.bedId} value={b.bedId}>
                      Bed {b.bedNumber} - Room {b.roomNumber} ({b.wardName} - ₹{b.dailyRate}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Transfer *</label>
                <textarea
                  rows={3}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="e.g., Patient upgraded to private room, ICU transition, step-down ward transfer..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Discharge Patient */}
      {showDischargeModal && selectedBed && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-400" />
                Clinical Discharge: {selectedBed.currentPatientName}
              </h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleDischargeSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-rose-900">Patient Discharge & Room Release</p>
                <p className="text-slate-600">Discharging will release Bed <span className="font-bold text-navy-900">{selectedBed.bedNumber}</span> back to AVAILABLE and automatically compute consolidated inpatient charges.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Summary & Instructions *</label>
                <textarea
                  rows={4}
                  value={dischargeForm.dischargeSummary}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                  placeholder="Condition at discharge, follow-up instructions, discharge medications, and precautions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Discharging...' : 'Confirm Discharge & Free Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
