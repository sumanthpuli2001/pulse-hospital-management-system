import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { departmentApi, inpatientApi, labApi, pharmacyApi } from '../services/api';
import { Department, Ward, LabTest, Medicine } from '../types';
import { sweetAlert } from '../components/SweetAlert';
import { TablePagination } from '../components/TablePagination';
import {
  Database,
  Building2,
  Bed,
  FlaskConical,
  Package,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Check,
  X,
  Sliders,
  IndianRupee
} from 'lucide-react';

export const MasterData: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN']);

  const [activeTab, setActiveTab] = useState<'departments' | 'wards' | 'labTests' | 'medicines'>('departments');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  const getDetailedErrorMessage = (err: any, fallback: string): string => {
    const res = err?.response?.data;
    if (res?.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      const fieldMsgs = Object.entries(res.data).map(([field, msg]) => `${field}: ${msg}`).join(' • ');
      return `${res.message ? res.message + ' (' : ''}${fieldMsgs}${res.message ? ')' : ''}`;
    }
    return res?.message || err?.message || fallback;
  };

  // Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  // Modals & Editing states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', isActive: true });

  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [wardForm, setWardForm] = useState({ name: '', wardType: '', floorNumber: 1, capacity: 20, baseBedRate: '500' });

  const [showLabModal, setShowLabModal] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<LabTest | null>(null);
  const [labForm, setLabForm] = useState({
    name: '',
    code: '',
    category: '',
    sampleType: 'SERUM',
    price: '400',
    unit: 'mg/dL',
    normalRange: '70 - 110 mg/dL',
    description: '',
  });

  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotic',
    dosageForm: '',
    strength: '500mg',
    unitPrice: '25',
    reorderLevel: 50,
    description: '',
  });

  useEffect(() => {
    setCurrentPage(1);
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'departments') {
        const res = await departmentApi.getDepartments(false);
        if (res.data.success && res.data.data) setDepartments(res.data.data);
      } else if (activeTab === 'wards') {
        const res = await inpatientApi.getWards();
        if (res.data.success && res.data.data) setWards(res.data.data);
      } else if (activeTab === 'labTests') {
        const res = await labApi.getTests();
        if (res.data.success && res.data.data) setLabTests(res.data.data);
      } else if (activeTab === 'medicines') {
        const res = await pharmacyApi.getMedicines({ size: 100 });
        if (res.data.success && res.data.data) setMedicines(res.data.data.content || []);
      }
    } catch (err: any) {
      console.error('Failed to load master data', err);
      setError('Failed to fetch data for selected module');
    } finally {
      setLoading(false);
    }
  };

  // --- Department Handlers ---
  const handleOpenDeptModal = (dept?: Department) => {
    setModalError('');
    if (dept) {
      setEditingDept(dept);
      const isAct = dept.isActive !== undefined ? dept.isActive : ((dept as any).active ?? true);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        isActive: isAct,
      });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '', description: '', isActive: true });
    }
    setShowDeptModal(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase(),
        description: deptForm.description.trim(),
        isActive: Boolean(deptForm.isActive),
        active: Boolean(deptForm.isActive),
      };
      if (editingDept) {
        await departmentApi.updateDepartment(editingDept.id, payload);
        setSuccess(`Department "${deptForm.name}" updated successfully!`);
      } else {
        await departmentApi.createDepartment(payload);
        setSuccess(`Department "${deptForm.name}" created successfully!`);
      }
      setShowDeptModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const msg = getDetailedErrorMessage(err, 'Failed to save department');
      setModalError(msg);
      setError(msg);
    }
  };

  const handleDeleteDept = async (id: number, name: string) => {
    const confirmed = await sweetAlert.confirm(
      'Deactivate Department',
      `Are you sure you want to deactivate department "${name}"?`,
      'Deactivate',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      await departmentApi.deleteDepartment(id);
      sweetAlert.success('Department Deactivated', `Department "${name}" has been deactivated.`);
      loadData();
    } catch (err: any) {
      sweetAlert.error('Deactivation Failed', getDetailedErrorMessage(err, 'Failed to deactivate department'));
    }
  };

  // --- Ward Handlers ---
  const handleOpenWardModal = (ward?: Ward) => {
    setModalError('');
    if (ward) {
      setEditingWard(ward);
      setWardForm({
        name: ward.name,
        wardType: ward.wardType,
        floorNumber: ward.floorNumber,
        capacity: ward.capacity,
        baseBedRate: '500',
      });
    } else {
      setEditingWard(null);
      setWardForm({ name: '', wardType: '', floorNumber: 1, capacity: 20, baseBedRate: '500' });
    }
    setShowWardModal(true);
  };

  const handleSaveWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!wardForm.wardType) {
      const msg = 'Please select a ward classification type from the dropdown.';
      setModalError(msg);
      setError(msg);
      return;
    }
    try {
      const wardPayload = {
        name: wardForm.name.trim(),
        wardType: wardForm.wardType.trim().toUpperCase(),
        floorNumber: Number(wardForm.floorNumber) || 1,
        capacity: Number(wardForm.capacity) || 20,
        baseBedRate: Number(wardForm.baseBedRate) || 500,
        description: `Hospital ${wardForm.wardType} Care Unit`,
      };
      if (editingWard) {
        await inpatientApi.updateWard(editingWard.id, wardPayload);
        setSuccess(`Ward "${wardForm.name}" updated successfully!`);
      } else {
        await inpatientApi.createWard(wardPayload);
        setSuccess(`Ward "${wardForm.name}" configured successfully!`);
      }
      setShowWardModal(false);
      setEditingWard(null);
      setWardForm({ name: '', wardType: '', floorNumber: 1, capacity: 20, baseBedRate: '500' });
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const msg = getDetailedErrorMessage(err, editingWard ? 'Failed to update ward' : 'Failed to create ward');
      setModalError(msg);
      setError(msg);
    }
  };

  const handleDeleteWard = async (id: number, name: string) => {
    const confirmed = await sweetAlert.confirm(
      'Deactivate Inpatient Ward',
      `Are you sure you want to deactivate ward "${name}"? This removes the ward from active room allocations.`,
      'Deactivate Ward',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      await inpatientApi.deleteWard(id);
      sweetAlert.success('Ward Deactivated', `Ward "${name}" has been deactivated.`);
      loadData();
    } catch (err: any) {
      sweetAlert.error('Deactivation Failed', getDetailedErrorMessage(err, 'Failed to deactivate ward'));
    }
  };

  // --- Lab Test Handlers ---
  const handleOpenLabModal = (test?: LabTest) => {
    setModalError('');
    if (test) {
      setEditingLabTest(test);
      setLabForm({
        name: test.testName,
        code: test.testCode,
        category: test.category,
        sampleType: test.sampleType || 'SERUM',
        price: String(test.cost || 400),
        unit: 'mg/dL',
        normalRange: test.referenceRanges || 'Standard Normal',
        description: '',
      });
    } else {
      setEditingLabTest(null);
      setLabForm({
        name: '',
        code: '',
        category: '',
        sampleType: 'SERUM',
        price: '400',
        unit: 'mg/dL',
        normalRange: '70 - 110 mg/dL',
        description: '',
      });
    }
    setShowLabModal(true);
  };

  const handleSaveLabTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!labForm.category) {
      const msg = 'Please select a diagnostic test category from the dropdown.';
      setModalError(msg);
      setError(msg);
      return;
    }
    try {
      const costVal = Number(labForm.price) || 200;
      const labPayload = {
        testName: labForm.name.trim(),
        name: labForm.name.trim(),
        testCode: labForm.code.trim().toUpperCase(),
        code: labForm.code.trim().toUpperCase(),
        category: labForm.category.trim().toUpperCase(),
        sampleType: labForm.sampleType || 'SERUM',
        cost: costVal,
        price: costVal,
        referenceRanges: labForm.normalRange || 'Standard Normal',
        normalRange: labForm.normalRange || 'Standard Normal',
        unit: labForm.unit,
        description: labForm.description,
        active: true,
        isActive: true,
      };
      if (editingLabTest) {
        await labApi.updateTest(editingLabTest.id, labPayload);
        setSuccess(`Lab test "${labForm.name}" updated successfully!`);
      } else {
        await labApi.createTest(labPayload);
        setSuccess(`Lab test "${labForm.name}" added to diagnostic catalog!`);
      }
      setShowLabModal(false);
      setEditingLabTest(null);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const msg = getDetailedErrorMessage(err, editingLabTest ? 'Failed to update lab test' : 'Failed to add lab test');
      setModalError(msg);
      setError(msg);
    }
  };

  const handleDeleteLabTest = async (id: number, name: string) => {
    const confirmed = await sweetAlert.confirm(
      'Deactivate Diagnostic Lab Test',
      `Are you sure you want to deactivate test "${name}"? This removes it from the active doctor ordering catalog.`,
      'Deactivate Test',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      await labApi.deleteTest(id);
      sweetAlert.success('Lab Test Deactivated', `Lab test "${name}" has been deactivated.`);
      loadData();
    } catch (err: any) {
      sweetAlert.error('Deactivation Failed', getDetailedErrorMessage(err, 'Failed to deactivate lab test'));
    }
  };

  // --- Medicine Handlers ---
  const handleOpenMedModal = (med?: Medicine) => {
    setModalError('');
    if (med) {
      setEditingMed(med);
      setMedForm({
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        dosageForm: (med as any).dosageForm || med.unitOfMeasure || 'TABLET',
        strength: (med as any).strength || '500mg',
        unitPrice: String(med.unitPrice || 25),
        reorderLevel: med.reorderLevel || 50,
        description: '',
      });
    } else {
      setEditingMed(null);
      setMedForm({
        name: '',
        genericName: '',
        category: 'Antibiotic',
        dosageForm: '',
        strength: '500mg',
        unitPrice: '25',
        reorderLevel: 50,
        description: '',
      });
    }
    setShowMedModal(true);
  };

  const handleSaveMed = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!medForm.dosageForm) {
      const msg = 'Please select a medicine dosage form from the dropdown.';
      setModalError(msg);
      setError(msg);
      return;
    }
    try {
      const unitPriceVal = Number(medForm.unitPrice) || 20;
      const skuVal = editingMed?.sku || (medForm.name.slice(0, 3) + '-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
      const medPayload = {
        name: medForm.name.trim(),
        genericName: medForm.genericName.trim(),
        sku: skuVal,
        category: medForm.category.trim(),
        dosageForm: medForm.dosageForm,
        unitOfMeasure: medForm.dosageForm || 'TABLET',
        strength: medForm.strength,
        unitPrice: unitPriceVal,
        costPrice: Number((unitPriceVal * 0.7).toFixed(2)),
        reorderLevel: Number(medForm.reorderLevel) || 50,
        description: medForm.description,
        requiresPrescription: true,
        isActive: true,
        active: true,
      };
      if (editingMed) {
        await pharmacyApi.updateMedicine(editingMed.id, medPayload);
        setSuccess(`Medicine "${medForm.name}" updated successfully!`);
      } else {
        await pharmacyApi.createMedicine(medPayload);
        setSuccess(`Medicine "${medForm.name}" added to pharmacy formulary!`);
      }
      setShowMedModal(false);
      setEditingMed(null);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const msg = getDetailedErrorMessage(err, editingMed ? 'Failed to update medicine' : 'Failed to add medicine');
      setModalError(msg);
      setError(msg);
    }
  };

  const handleDeleteMed = async (id: number, name: string) => {
    const confirmed = await sweetAlert.confirm(
      'Deactivate Medicine',
      `Are you sure you want to deactivate medicine "${name}"? This removes it from the active doctor prescription catalog.`,
      'Deactivate Medicine',
      'Cancel'
    );
    if (!confirmed) return;
    try {
      await pharmacyApi.deleteMedicine(id);
      sweetAlert.success('Medicine Deactivated', `Medicine "${name}" has been deactivated.`);
      loadData();
    } catch (err: any) {
      sweetAlert.error('Deactivation Failed', getDetailedErrorMessage(err, 'Failed to deactivate medicine'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-6 text-white shadow-lg border border-navy-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-800/80 flex items-center gap-1.5 w-fit">
            <Sliders className="w-3.5 h-3.5" />
            ENTERPRISE SYSTEM GOVERNANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-2 text-white">
            Master Data Configuration Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Manage hospital departments, inpatient wards, diagnostic test catalog, and pharmacy formulary dropdowns with real-time CRUD operations.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === 'departments' && (
              <button
                onClick={() => handleOpenDeptModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Department</span>
              </button>
            )}
            {activeTab === 'wards' && (
              <button
                onClick={() => handleOpenWardModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Inpatient Ward</span>
              </button>
            )}
            {activeTab === 'labTests' && (
              <button
                onClick={() => handleOpenLabModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Lab Test</span>
              </button>
            )}
            {activeTab === 'medicines' && (
              <button
                onClick={() => handleOpenMedModal()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Medicine</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feedback Alerts */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-950 font-bold">✕</button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab('departments'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'departments'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-400" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('wards'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'wards'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bed className="w-4 h-4 text-teal-400" />
          <span>Wards &amp; Bed Rates ({wards.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('labTests'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'labTests'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-teal-400" />
          <span>Diagnostic Test Catalog ({labTests.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('medicines'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'medicines'
              ? 'bg-navy-950 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-teal-400" />
          <span>Pharmacy Medicines ({medicines.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, code or category...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-teal-500 transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DEPARTMENTS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (() => {
        const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()));
        const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Department Name</th>
                  <th className="p-3.5">Clinical Scope / Description</th>
                  <th className="p-3.5">Status</th>
                  {canManage && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Loading departments...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No departments found</td>
                  </tr>
                ) : (
                  displayed.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-teal-800">{dept.code}</td>
                      <td className="p-3.5 font-bold text-slate-900">{dept.name}</td>
                      <td className="p-3.5 text-slate-600">{dept.description || 'General Clinical Department'}</td>
                      <td className="p-3.5">
                        {(() => {
                          const isAct = dept.isActive !== undefined ? dept.isActive : ((dept as any).active ?? true);
                          return (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isAct
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              {isAct ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          );
                        })()}
                      </td>
                      {canManage && (
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDeptModal(dept)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {(dept.isActive !== undefined ? dept.isActive : ((dept as any).active ?? true)) && (
                            <button
                              onClick={() => handleDeleteDept(dept.id, dept.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Deactivate Department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 2: WARDS & ROOMS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'wards' && (() => {
        const filtered = wards.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()) || w.wardType.toLowerCase().includes(search.toLowerCase()));
        const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Ward Name</th>
                  <th className="p-3.5">Ward Type</th>
                  <th className="p-3.5">Floor</th>
                  <th className="p-3.5">Daily Bed Rate</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">Status</th>
                  {canManage && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Loading wards...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No inpatient wards configured</td>
                  </tr>
                ) : (
                  displayed.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{w.name}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-navy-50 text-navy-800 border border-navy-200">
                          {w.wardType}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">Floor {w.floorNumber}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">₹{Number((w as any).baseBedRate || 500).toFixed(2)} / day</td>
                      <td className="p-3.5 text-slate-600">{w.capacity} Beds</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          OPERATIONAL
                        </span>
                      </td>
                      {canManage && (
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenWardModal(w)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Ward"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWard(w.id, w.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Deactivate Ward"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 3: LAB TESTS CATALOG TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'labTests' && (() => {
        const filtered = labTests.filter((t) => (t.testName || '').toLowerCase().includes(search.toLowerCase()) || (t.testCode || '').toLowerCase().includes(search.toLowerCase()));
        const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Test Profile Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Specimen Type</th>
                  <th className="p-3.5">Standard Range</th>
                  <th className="p-3.5">Test Fee (₹)</th>
                  <th className="p-3.5">Status</th>
                  {canManage && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">Loading lab test catalog...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No laboratory tests found</td>
                  </tr>
                ) : (
                  displayed.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-teal-800">{t.testCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{t.testName}</td>
                      <td className="p-3.5 text-slate-600">{t.category}</td>
                      <td className="p-3.5 text-slate-500">{t.sampleType}</td>
                      <td className="p-3.5 font-mono text-slate-600">{t.referenceRanges || (t as any).normalRange || 'Standard clinical normal'}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">₹{Number(t.cost).toFixed(2)}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          AVAILABLE
                        </span>
                      </td>
                      {canManage && (
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenLabModal(t)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Diagnostic Test"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLabTest(t.id, t.testName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Deactivate Diagnostic Test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 4: MEDICINES FORMULARY TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'medicines' && (() => {
        const filtered = medicines.filter((m) => (m.name || '').toLowerCase().includes(search.toLowerCase()) || (m.genericName || '').toLowerCase().includes(search.toLowerCase()));
        const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Medicine Name</th>
                  <th className="p-3.5">Generic Salt</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Form / Strength</th>
                  <th className="p-3.5">Unit Price (₹)</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Reorder Point</th>
                  {canManage && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">Loading medicines...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No formulary medicines found</td>
                  </tr>
                ) : (
                  displayed.map((m) => {
                    const stock = m.totalStock ?? (m as any).totalQuantity ?? 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3.5 text-slate-600 italic">{m.genericName}</td>
                        <td className="p-3.5 text-slate-500">{m.category}</td>
                        <td className="p-3.5 font-mono text-slate-600">{(m as any).dosageForm ? `${(m as any).dosageForm} (${(m as any).strength || ''})` : (m.unitOfMeasure || 'Standard')}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">₹{Number(m.unitPrice).toFixed(2)}</td>
                        <td className={`p-3.5 font-mono font-bold ${stock <= m.reorderLevel ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {stock} units
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{m.reorderLevel} units</td>
                        {canManage && (
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenMedModal(m)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                              title="Edit Medicine"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMed(m.id, m.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Deactivate Medicine"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT DEPARTMENT */}
      {/* ========================================================================= */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>{editingDept ? 'Edit Department' : 'Create New Department'}</span>
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveDept} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{modalError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oncology, Nephrology, Dermatology"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ONCO, NEPH, DERM"
                  value={deptForm.code}
                  disabled={!!editingDept}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase outline-none focus:border-teal-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Scope &amp; Services</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inpatient and outpatient clinical care and surgical procedures"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="deptActive"
                  checked={deptForm.isActive}
                  onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="deptActive" className="text-slate-700 font-semibold cursor-pointer">
                  Department is Active for Admissions &amp; Consultations
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD INPATIENT WARD */}
      {/* ========================================================================= */}
      {showWardModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Bed className="w-4 h-4 text-teal-400" />
                <span>{editingWard ? 'Edit Inpatient Ward' : 'Configure Inpatient Ward'}</span>
              </h3>
              <button onClick={() => setShowWardModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveWard} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{modalError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiac Critical Care Unit, General Male Ward 3"
                  value={wardForm.name}
                  onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ward Type *</label>
                  <select
                    required
                    value={wardForm.wardType}
                    onChange={(e) => setWardForm({ ...wardForm, wardType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 outline-none focus:border-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Ward Type --</option>
                    <option value="ICU">Intensive Care (ICU)</option>
                    <option value="GENERAL">General Ward</option>
                    <option value="DELUXE">Deluxe Private</option>
                    <option value="PEDIATRIC">Pediatric Ward</option>
                    <option value="EMERGENCY">Emergency Triage</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor Number *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={wardForm.floorNumber}
                    onChange={(e) => setWardForm({ ...wardForm, floorNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ward Capacity (Beds) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 20"
                    value={wardForm.capacity}
                    onChange={(e) => setWardForm({ ...wardForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Daily Bed Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 750"
                    value={wardForm.baseBedRate}
                    onChange={(e) => setWardForm({ ...wardForm, baseBedRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWardModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {editingWard ? 'Update Ward' : 'Save Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD LAB TEST */}
      {/* ========================================================================= */}
      {showLabModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-400" />
                <span>{editingLabTest ? 'Edit Diagnostic Laboratory Test' : 'Add Diagnostic Laboratory Test'}</span>
              </h3>
              <button onClick={() => setShowLabModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveLabTest} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{modalError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glycated Hemoglobin (HbA1c), Thyroid Profile"
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HBA1C, TFT"
                    value={labForm.code}
                    onChange={(e) => setLabForm({ ...labForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={labForm.category}
                    onChange={(e) => setLabForm({ ...labForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 outline-none focus:border-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="BIOCHEMISTRY">Biochemistry</option>
                    <option value="HEMATOLOGY">Hematology</option>
                    <option value="IMMUNOLOGY">Immunology</option>
                    <option value="MICROBIOLOGY">Microbiology</option>
                    <option value="RADIOLOGY">Radiology &amp; Imaging</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sample Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whole Blood, Serum, Urine"
                    value={labForm.sampleType}
                    onChange={(e) => setLabForm({ ...labForm, sampleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 450"
                    value={labForm.price}
                    onChange={(e) => setLabForm({ ...labForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Normal Reference Range</label>
                <input
                  type="text"
                  placeholder="e.g. 4.0% - 5.6%"
                  value={labForm.normalRange}
                  onChange={(e) => setLabForm({ ...labForm, normalRange: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {editingLabTest ? 'Update Lab Test' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD MEDICINE */}
      {/* ========================================================================= */}
      {showMedModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-400" />
                <span>{editingMed ? 'Edit Formulary Medicine' : 'Add Formulary Medicine'}</span>
              </h3>
              <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveMed} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{modalError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin 625 Duo, Pan-D, Dolo 650"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Generic Chemical Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin + Clavulanic Acid"
                  value={medForm.genericName}
                  onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Antibiotic, Analgesic, Antacid"
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    required
                    value={medForm.dosageForm}
                    onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 outline-none focus:border-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Dosage Form --</option>
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                    <option value="OINTMENT">Ointment / Gel</option>
                    <option value="DROPS">Drops</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 625mg, 40mg"
                    value={medForm.strength}
                    onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15.50"
                    value={medForm.unitPrice}
                    onChange={(e) => setMedForm({ ...medForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={medForm.reorderLevel}
                    onChange={(e) => setMedForm({ ...medForm, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMedModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  {editingMed ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
