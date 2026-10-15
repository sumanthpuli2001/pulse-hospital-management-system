import React, { useState, useEffect } from 'react';
import { prescriptionApi, patientApi } from '../services/api';
import { Prescription, Patient } from '../types';
import { useAuth } from '../services/authContext';
import {
  Pill,
  Search,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  Check,
  Calendar,
  FileText
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';
import { TablePagination } from '../components/TablePagination';

export const Prescriptions: React.FC = () => {
  const { hasRole } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [dispenseItemIds, setDispenseItemIds] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Prescription Form
  const [newRxPatientId, setNewRxPatientId] = useState<number | ''>('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [rxItems, setRxItems] = useState([
    {
      medicineName: 'Atorvastatin 20mg',
      dosage: '20mg',
      frequency: '1-0-0 (Night)',
      route: 'ORAL',
      durationDays: 30,
      quantity: 30,
      instructions: 'Take once daily after dinner',
    }
  ]);

  useEffect(() => {
    loadPrescriptions();
    loadPatients();
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.ceil(prescriptions.length / pageSize) || 1;
  const paginatedPrescriptions = prescriptions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await prescriptionApi.getPrescriptions({
        status: statusFilter || undefined,
        size: 50,
      });
      if (res.data.success) {
        setPrescriptions(res.data.data.content);
      }
    } catch (e) {
      console.error('Failed to load prescriptions', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await patientApi.getPatients({ size: 50 });
      if (res.data.success) {
        setPatients(res.data.data.content);
      }
    } catch (e) {
      console.error('Failed to load patients', e);
    }
  };

  const openFulfillModal = (rx: Prescription) => {
    setSelectedRx(rx);
    // Pre-select unfulfilled items
    const unfulfilled = rx.items.filter((i) => !i.dispensed).map((i) => i.id);
    setDispenseItemIds(unfulfilled);
    setShowFulfillModal(true);
  };

  const handleFulfill = async () => {
    if (!selectedRx) return;
    setError('');

    if (dispenseItemIds.length === 0) {
      sweetAlert.warning('No Items Selected', 'Please check at least one medicine item to dispense.');
      return;
    }

    try {
      const res = await prescriptionApi.fulfillPrescription(selectedRx.id, dispenseItemIds);
      if (res.data.success) {
        setShowFulfillModal(false);
        sweetAlert.success('Medications Dispensed', `Prescription ${res.data.data.prescriptionNumber} successfully dispensed. Pharmacy stock deducted.`);
        loadPrescriptions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to dispense medication';
      setError(msg);
      sweetAlert.error('Dispensing Failed', msg);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newRxPatientId) {
      sweetAlert.warning('Missing Patient', 'Please select a patient to create the prescription.');
      return;
    }

    if (rxItems.length === 0 || rxItems.some(it => !it.medicineName.trim())) {
      sweetAlert.warning('Incomplete Medication', 'Please enter medicine name and dosage for all prescribed items.');
      return;
    }

    try {
      const res = await prescriptionApi.createPrescription({
        patientId: Number(newRxPatientId),
        doctorId: 1, // Dr. Rajesh Varma (Attending Physician)
        clinicalNotes: clinicalNotes.trim() || 'Prescribed during standard OPD consultation.',
        items: rxItems.map(it => ({
          ...it,
          medicineName: it.medicineName.trim(),
          instructions: it.instructions?.trim() || 'As directed by physician'
        })),
      });

      if (res.data.success) {
        setShowCreateModal(false);
        sweetAlert.success(
          'Prescription Issued',
          `e-Prescription ${res.data.data.prescriptionNumber} registered. Ready for pharmacy fulfillment.`
        );
        loadPrescriptions();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create prescription';
      setError(msg);
      sweetAlert.error('Prescription Failed', msg);
    }
  };

  const toggleItemDispense = (id: number) => {
    setDispenseItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PARTIALLY_DISPENSED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DISPENSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Electronic Prescriptions (e-Rx)</h1>
          <p className="text-xs text-slate-500 mt-0.5">Doctor Authoring &middot; Pharmacist Medication Dispensing Fulfillment</p>
        </div>

        {hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_DOCTOR']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Prescription</span>
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['', 'ACTIVE', 'PARTIALLY_DISPENSED', 'DISPENSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === st
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Prescriptions'}
          </button>
        ))}
      </div>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs">No prescriptions found</div>
        ) : (
          paginatedPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-teal-700 text-xs">{rx.prescriptionNumber}</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{rx.patientName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{rx.patientCode}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge(rx.status)}`}>
                    {rx.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Prescriber: <strong className="text-slate-800">{rx.doctorName}</strong></span>
                  <span>Date: {rx.issueDate}</span>
                </div>

                {rx.clinicalNotes && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg mt-3 italic">
                    "{rx.clinicalNotes}"
                  </p>
                )}

                {/* Medication Items */}
                <div className="mt-4 space-y-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Prescribed Medications</span>
                  {rx.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.medicineName}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.dosage} &middot; {item.frequency} &middot; {item.durationDays} days (Qty: {item.quantity})
                        </p>
                        {item.instructions && (
                          <p className="text-[10px] text-teal-700 mt-0.5">{item.instructions}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.dispensed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.dispensed ? 'Dispensed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_PHARMACIST']) && rx.status !== 'DISPENSED' && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => openFulfillModal(rx)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Fulfill & Dispense</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 10-entries-per-page Pagination */}
      {prescriptions.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={prescriptions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Fulfill Dispense Modal */}
      {showFulfillModal && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dispense Medications</h3>
                <p className="text-[11px] text-slate-400">{selectedRx.prescriptionNumber} &middot; {selectedRx.patientName}</p>
              </div>
              <button onClick={() => setShowFulfillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">Select items ready to dispense from inventory:</p>
              {selectedRx.items.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    dispenseItemIds.includes(item.id)
                      ? 'bg-teal-50 border-teal-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={dispenseItemIds.includes(item.id)}
                    onChange={() => toggleItemDispense(item.id)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{item.medicineName}</p>
                    <p className="text-[11px] text-slate-500">Qty to dispense: {item.quantity}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFulfillModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfill}
                disabled={dispenseItemIds.length === 0}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Dispensing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Create Prescription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Author Electronic Prescription</h3>
                <p className="text-[11px] text-slate-400">Dr. Rajesh Varma &middot; Cardiology</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreatePrescription} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={newRxPatientId}
                  onChange={(e) => setNewRxPatientId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none focus:border-teal-500 shadow-2xs"
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
                <label className="block font-semibold text-slate-700 mb-1">Clinical Instructions & Notes</label>
                <input
                  type="text"
                  placeholder="Low-salt diet. Monitor BP every morning."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-teal-500 shadow-2xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block font-bold text-slate-800">Medication Item</span>
                <input
                  type="text"
                  required
                  value={rxItems[0].medicineName}
                  onChange={(e) => {
                    const copy = [...rxItems];
                    copy[0].medicineName = e.target.value;
                    setRxItems(copy);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium shadow-2xs"
                  placeholder="Medicine name"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={rxItems[0].dosage}
                    onChange={(e) => {
                      const copy = [...rxItems];
                      copy[0].dosage = e.target.value;
                      setRxItems(copy);
                    }}
                    placeholder="Dosage (e.g. 20mg)"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={rxItems[0].frequency}
                    onChange={(e) => {
                      const copy = [...rxItems];
                      copy[0].frequency = e.target.value;
                      setRxItems(copy);
                    }}
                    placeholder="Freq (1-0-1)"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    value={rxItems[0].quantity}
                    onChange={(e) => {
                      const copy = [...rxItems];
                      copy[0].quantity = Number(e.target.value);
                      setRxItems(copy);
                    }}
                    placeholder="Total Qty"
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Issue e-Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
