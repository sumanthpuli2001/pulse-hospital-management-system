import React, { useState, useEffect } from 'react';
import api, { patientApi } from '../services/api';
import { Patient } from '../types';
import {
  Users,
  Search,
  Plus,
  X,
  FileText,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  Receipt,
  IndianRupee,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { sweetAlert } from '../components/SweetAlert';
import { TablePagination } from '../components/TablePagination';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form State (Clean placeholders with +91 country code default for India)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '+91 ',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Standard Hospital Service Presets
  const SERVICE_PRESETS: Record<string, { desc: string; rate: number }> = {
    CONSULTATION: { desc: 'Physician Specialist Clinical Consultation', rate: 500.0 },
    LABORATORY: { desc: 'Clinical Pathology & Diagnostic Panel', rate: 800.0 },
    PHARMACY: { desc: 'Prescription Pharmaceuticals & Medication Dispensing', rate: 450.0 },
    ROOM_CHARGE: { desc: 'Inpatient General Ward Bed (Daily Rate)', rate: 1200.0 },
    PROCEDURE: { desc: 'Minor Medical Procedure & Clinical Dressing', rate: 750.0 },
    OTHER: { desc: 'Hospital Administrative & Facility Service Fee', rate: 250.0 },
  };

  // Invoice Generation State for Patient
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPatientForInvoice, setSelectedPatientForInvoice] = useState<Patient | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    taxAmount: 0,
    discountAmount: 0,
    notes: '',
    items: [
      { itemType: 'CONSULTATION', description: 'Physician Specialist Clinical Consultation', quantity: 1, unitPrice: 500.0 }
    ]
  });

  const openInvoiceModalForPatient = (p: Patient) => {
    setSelectedPatientForInvoice(p);
    setInvoiceError('');
    setInvoiceForm({
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      taxAmount: 0,
      discountAmount: 0,
      notes: `Clinical bill for ${p.firstName} ${p.lastName} (${p.patientCode})`,
      items: [
        { itemType: 'CONSULTATION', description: 'Physician Specialist Clinical Consultation', quantity: 1, unitPrice: 500.0 }
      ]
    });
    setShowInvoiceModal(true);
  };

  const handleAddItemRow = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { itemType: 'LABORATORY', description: 'Clinical Pathology & Diagnostic Panel', quantity: 1, unitPrice: 800.0 }]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...invoiceForm.items];
    if (field === 'itemType' && SERVICE_PRESETS[value]) {
      updated[index] = {
        ...updated[index],
        itemType: value,
        description: SERVICE_PRESETS[value].desc,
        unitPrice: SERVICE_PRESETS[value].rate
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setInvoiceForm(prev => ({ ...prev, items: updated }));
  };

  const handleLoadStandardCharges = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [
        { itemType: 'CONSULTATION', description: 'Senior Specialist Consultation', quantity: 1, unitPrice: 500.0 },
        { itemType: 'ROOM_CHARGE', description: 'Ward Bed & Nursing Care (Daily)', quantity: 1, unitPrice: 1200.0 },
        { itemType: 'PHARMACY', description: 'Prescription Pharmaceuticals & Supplies', quantity: 1, unitPrice: 450.0 }
      ]
    }));
  };

  const calculatedDraftTotal = invoiceForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0)
    + (Number(invoiceForm.taxAmount) || 0)
    - (Number(invoiceForm.discountAmount) || 0);

  const handleCreatePatientInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForInvoice) return;

    if (invoiceForm.items.length === 0 || invoiceForm.items.some(it => !it.description.trim())) {
      sweetAlert.warning('Incomplete Itemization', 'Please provide a description for every billed service.');
      return;
    }

    if (invoiceForm.items.some(it => Number(it.quantity) <= 0 || Number(it.unitPrice) < 0)) {
      sweetAlert.warning('Invalid Rates', 'Quantity must be > 0 and unit price cannot be negative.');
      return;
    }

    if (calculatedDraftTotal <= 0) {
      sweetAlert.warning('Invalid Total', 'Total invoice charge must be greater than ₹0.');
      return;
    }

    try {
      setInvoiceLoading(true);
      setInvoiceError('');
      const res = await api.post('/billing/invoices', {
        patientId: selectedPatientForInvoice.id,
        dueDate: invoiceForm.dueDate,
        taxAmount: Number(invoiceForm.taxAmount) || 0,
        discountAmount: Number(invoiceForm.discountAmount) || 0,
        notes: invoiceForm.notes,
        items: invoiceForm.items.map(item => ({
          itemType: item.itemType,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      });
      setShowInvoiceModal(false);
      sweetAlert.success(
        'Invoice Created',
        `Invoice ${res.data.data.invoiceNumber} (₹${Number(res.data.data.totalAmount).toFixed(2)}) generated successfully for ${selectedPatientForInvoice.firstName} ${selectedPatientForInvoice.lastName}! Added to patient account.`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to generate invoice for patient';
      setInvoiceError(msg);
      sweetAlert.error('Invoice Creation Failed', msg);
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    setCurrentPage(1);
  }, [search]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await patientApi.getPatients({ search: search || undefined, size: 50 });
      if (res.data.success) {
        setPatients(res.data.data.content);
      }
    } catch (e) {
      console.error('Failed to load patients', e);
    } finally {
      setLoading(false);
    }
  };

  const openRegisterModal = () => {
    setError('');
    setDuplicateNotice('');
    setPhoneError('');
    setEmailError('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '+91 ',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
    setShowModal(true);
  };

  const handlePhoneChange = (val: string) => {
    let formatted = val;
    if (!formatted.startsWith('+91')) {
      const digits = formatted.replace(/[^0-9]/g, '');
      formatted = '+91 ' + digits;
    }
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));

    const digitsOnly = formatted.replace(/[^0-9]/g, '');
    const mobileDigits = digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;

    if (mobileDigits.length > 0 && mobileDigits.length < 10) {
      setPhoneError(`Minimum 10 digits required (currently ${mobileDigits.length}/10 digits)`);
    } else {
      setPhoneError('');
    }

    if (mobileDigits.length >= 10) {
      const exists = patients.some(p => {
        const pDigits = (p.phoneNumber || '').replace(/[^0-9]/g, '');
        const pMobile = pDigits.startsWith('91') ? pDigits.slice(2) : pDigits;
        return pMobile.length >= 10 && pMobile.slice(-10) === mobileDigits.slice(-10);
      });
      if (exists) {
        setDuplicateNotice(`Duplicate data is not allowed: Mobile number (+91 ${mobileDigits}) is already registered to an existing patient in the hospital registry.`);
        setPhoneError('This phone number already exists in the system. Duplicate entries are blocked.');
        return;
      }
    }

    if (!emailError) {
      setDuplicateNotice('');
    }
  };

  const handleEmailChange = (val: string) => {
    setFormData(prev => ({ ...prev, email: val }));
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('');
      if (!phoneError.includes('already exists')) {
        setDuplicateNotice('');
      }
      return;
    }

    const exists = patients.some(p => p.email && p.email.trim().toLowerCase() === trimmed);
    if (exists) {
      setDuplicateNotice(`Duplicate data is not allowed: Email address (${val}) is already registered to another patient.`);
      setEmailError('This email is already associated with another patient record.');
    } else {
      setEmailError('');
      if (!phoneError.includes('already exists')) {
        setDuplicateNotice('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDuplicateNotice('');

    // Client-side validations
    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const rawDigits = formData.phoneNumber.replace(/[^0-9]/g, '');
    const mobileDigits = rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;

    if (!cleanFirstName || !cleanLastName) {
      sweetAlert.warning('Missing Name', 'Please enter both first name and last name.');
      return;
    }

    if (!formData.gender) {
      sweetAlert.warning('Missing Gender', 'Please select whether the patient is Male, Female, or Other.');
      return;
    }

    if (!formData.dateOfBirth) {
      sweetAlert.warning('Missing Date of Birth', 'Please enter or select the patient date of birth.');
      return;
    }

    if (mobileDigits.length < 10) {
      setPhoneError('Minimum 10 digits required for mobile number.');
      sweetAlert.warning('Invalid Phone Number', 'Please enter a valid 10-digit mobile number with +91 country code.');
      return;
    }

    // Check duplicate phone against loaded patients
    const duplicatePhone = patients.some(p => {
      const pDigits = (p.phoneNumber || '').replace(/[^0-9]/g, '');
      const pMobile = pDigits.startsWith('91') ? pDigits.slice(2) : pDigits;
      return pMobile.length >= 10 && pMobile.slice(-10) === mobileDigits.slice(-10);
    });
    if (duplicatePhone) {
      const msg = `Duplicate data is not allowed: Mobile number (+91 ${mobileDigits}) is already registered.`;
      setDuplicateNotice(msg);
      setPhoneError('This phone number already exists in the system.');
      sweetAlert.error('Duplicate Data Not Allowed', msg);
      return;
    }

    // Check duplicate email against loaded patients
    if (formData.email.trim()) {
      const duplicateEmail = patients.some(p => p.email && p.email.trim().toLowerCase() === formData.email.trim().toLowerCase());
      if (duplicateEmail) {
        const msg = `Duplicate data is not allowed: Email (${formData.email.trim()}) is already registered.`;
        setDuplicateNotice(msg);
        setEmailError('This email is already in use by another patient.');
        sweetAlert.error('Duplicate Data Not Allowed', msg);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await patientApi.createPatient({
        ...formData,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phoneNumber: `+91 ${mobileDigits}`,
        email: formData.email.trim() || undefined,
        bloodGroup: formData.bloodGroup || undefined,
      });
      if (res.data.success) {
        const pCode = res.data.data.patientCode;
        const uName = res.data.data.portalUsername || pCode;
        setShowModal(false);
        sweetAlert.success(
          'Patient Registered Successfully!',
          `MRN: ${pCode}\nFull Name: ${cleanFirstName} ${cleanLastName}\nPortal Username: ${uName}\nDefault Password: Password@123`
        );
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: '+91 ',
          dateOfBirth: '',
          gender: '',
          bloodGroup: '',
          address: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
        });
        loadPatients();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to register patient';
      setError(msg);
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
        setDuplicateNotice(msg);
        if (msg.toLowerCase().includes('phone')) {
          setPhoneError(msg);
        } else if (msg.toLowerCase().includes('email')) {
          setEmailError(msg);
        }
      }
      sweetAlert.error('Registration Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(patients.length / pageSize) || 1;
  const paginatedPatients = patients.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Master Patient Index &middot; Enterprise EHR Registry</p>
        </div>

        <button
          onClick={openRegisterModal}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or PAT-2026-XXXX code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-teal-500 transition"
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Age / Gender</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No patient records found</td>
                </tr>
              ) : (
                paginatedPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {p.patientCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="py-3 px-4">
                      {p.age} yrs &middot; <span className="capitalize">{p.gender.toLowerCase()}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {p.bloodGroup?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-900 font-mono">{p.phoneNumber}</p>
                      <p className="text-[11px] text-slate-400">{p.email || 'No email'}</p>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/appointments?patientId=${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-teal-800 hover:bg-teal-100 text-[11px] font-semibold transition border border-teal-200 shadow-2xs"
                        title="Schedule Outpatient Consultation for this patient"
                      >
                        <Calendar className="w-3 h-3 text-teal-600" />
                        <span>Schedule OPD</span>
                      </Link>
                      <Link
                        to={`/emr?patientId=${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-navy-50 text-navy-800 hover:bg-navy-100 text-[11px] font-semibold transition"
                        title="Open Comprehensive EMR Chart"
                      >
                        <FileText className="w-3 h-3 text-navy-600" />
                        <span>EMR Chart</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 10-entries-per-page Pagination */}
        {patients.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={patients.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">New Patient Registration</h3>
                  <p className="text-[11px] text-slate-400">Generates unique PAT-2026-XXXX record</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Duplicate Data Alert Banner */}
            {duplicateNotice && (
              <div className="mt-4 p-3.5 bg-rose-50 border-2 border-rose-400 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-xs animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-rose-900">Duplicate Data Is Not Allowed</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5 font-medium">{duplicateNotice}</p>
                </div>
              </div>
            )}

            {error && !duplicateNotice && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number * <span className="text-[10px] text-slate-400 font-normal">(Default +91, Min 10 digits)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white outline-none font-mono text-xs ${
                      phoneError ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-teal-500'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {phoneError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:bg-white outline-none text-xs ${
                      emailError ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:border-teal-500'
                    }`}
                  />
                  {emailError && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {emailError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Blood Group --</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Generate Invoice for Patient */}
      {showInvoiceModal && selectedPatientForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Generate Invoice: {selectedPatientForInvoice.firstName} {selectedPatientForInvoice.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Patient MRN: <span className="font-mono font-semibold text-teal-700">{selectedPatientForInvoice.patientCode}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {invoiceError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{invoiceError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePatientInvoice} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Notes / Purpose</label>
                  <input
                    type="text"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">Itemized Clinical Charges</label>
                    <p className="text-[11px] text-slate-500">Breakdown of consultations, lab investigations, pharmacy medications, and bed charges</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadStandardCharges}
                      className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      ⚡ Standard OP Package (₹2,150)
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-semibold px-2.5 py-1 rounded-lg transition"
                    >
                      + Add Service Item
                    </button>
                  </div>
                </div>

                {/* Column Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-600 px-2 py-1.5 bg-slate-100 rounded-lg uppercase tracking-wider">
                  <span className="col-span-3">Service Category</span>
                  <span className="col-span-4">Service Description</span>
                  <span className="col-span-1 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit Rate (₹)</span>
                  <span className="col-span-2 text-right">Subtotal (₹)</span>
                </div>

                <div className="space-y-2">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="col-span-3">
                        <select
                          value={item.itemType}
                          onChange={(e) => handleItemChange(idx, 'itemType', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-semibold outline-none focus:border-teal-500"
                        >
                          <option value="CONSULTATION">Consultation</option>
                          <option value="LABORATORY">Lab Test</option>
                          <option value="PHARMACY">Pharmacy</option>
                          <option value="ROOM_CHARGE">Room Charge</option>
                          <option value="PROCEDURE">Procedure</option>
                          <option value="OTHER">Other Service</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Clinical service details..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs text-center font-bold text-slate-900 bg-white outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate (₹)"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs text-right font-mono font-bold text-slate-900 bg-white outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between pl-1">
                        <span className="font-mono font-bold text-xs text-teal-800">
                          ₹{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}
                        </span>
                        {invoiceForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 text-xs"
                            title="Remove charge line"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={invoiceForm.taxAmount || ''}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={invoiceForm.discountAmount || ''}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Calculated Invoice Total:</span>
                <span className="text-base font-bold text-navy-950 font-mono">
                  ₹{calculatedDraftTotal.toFixed(2)}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invoiceLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {invoiceLoading ? 'Generating...' : `Create Invoice (₹${calculatedDraftTotal.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
