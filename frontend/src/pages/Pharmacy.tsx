import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Medicine, MedicineBatch, InventoryTransaction } from '../types';
import { useAuth } from '../services/authContext';
import { 
  Package, 
  AlertTriangle, 
  PlusCircle, 
  Clock, 
  Search, 
  Filter, 
  CheckCircle, 
  Sliders, 
  Calendar, 
  Layers, 
  TrendingDown,
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';

export const Pharmacy: React.FC = () => {
  const { hasRole } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [lowStockList, setLowStockList] = useState<Medicine[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<MedicineBatch[]>([]);
  const [allBatches, setAllBatches] = useState<MedicineBatch[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'batches' | 'alerts' | 'transactions'>('catalog');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [showReceiveBatchModal, setShowReceiveBatchModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<MedicineBatch | null>(null);

  // Forms
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    sku: '',
    category: '',
    unitOfMeasure: '',
    unitPrice: '',
    costPrice: '',
    reorderLevel: '50',
    requiresPrescription: true
  });

  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    unitCost: '',
    supplierName: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    quantityChange: '',
    adjustmentType: '',
    notes: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canManageStock = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_PHARMACIST']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsRes, lowRes, expRes, allBatchesRes, txRes] = await Promise.all([
        api.get('/pharmacy/medicines?size=100'),
        api.get('/pharmacy/alerts/low-stock'),
        api.get('/pharmacy/batches/expiring?days=60'),
        api.get('/pharmacy/batches/expiring?days=3650'),
        api.get('/pharmacy/transactions?size=50')
      ]);

      setMedicines(medsRes.data.data?.content || []);
      setLowStockList(lowRes.data.data || []);
      setExpiringBatches(expRes.data.data || []);
      setAllBatches(allBatchesRes.data.data || []);
      setTransactions(txRes.data.data?.content || []);
    } catch (err: any) {
      console.error('Failed to load pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name.trim() || !medForm.genericName.trim() || !medForm.sku.trim()) {
      sweetAlert.warning('Missing Required Fields', 'Please enter Medicine Name, Generic Name, and SKU code.');
      return;
    }

    if (!medForm.category) {
      sweetAlert.warning('Missing Category', 'Please select a medicine category from the dropdown.');
      return;
    }

    if (!medForm.unitOfMeasure) {
      sweetAlert.warning('Missing Unit', 'Please select a unit of measure from the dropdown.');
      return;
    }

    const uPrice = Number(medForm.unitPrice);
    if (isNaN(uPrice) || uPrice < 0) {
      sweetAlert.warning('Invalid Price', 'Please enter a valid non-negative selling price in ₹.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError('');
      await api.post('/pharmacy/medicines', {
        ...medForm,
        name: medForm.name.trim(),
        genericName: medForm.genericName.trim(),
        sku: medForm.sku.trim(),
        unitPrice: uPrice,
        costPrice: Number(medForm.costPrice) || 0,
        reorderLevel: Number(medForm.reorderLevel) || 50
      });
      setShowAddMedModal(false);
      sweetAlert.success('Medication Added', `"${medForm.name}" registered into hospital formulary successfully.`);
      setMedForm({
        name: '',
        genericName: '',
        sku: '',
        category: '',
        unitOfMeasure: '',
        unitPrice: '',
        costPrice: '',
        reorderLevel: '50',
        requiresPrescription: true
      });
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create medicine';
      setFormError(msg);
      sweetAlert.error('Formulary Error', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleReceiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.medicineId || !batchForm.batchNumber.trim() || !batchForm.expiryDate || !batchForm.quantity) {
      sweetAlert.warning('Incomplete Batch Data', 'Please specify medicine, batch lot number, expiration date, and inward quantity.');
      return;
    }

    const qty = Number(batchForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      sweetAlert.warning('Invalid Quantity', 'Batch inward quantity must be greater than 0.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError('');
      await api.post(`/pharmacy/medicines/${batchForm.medicineId}/batches`, {
        batchNumber: batchForm.batchNumber.trim(),
        expiryDate: batchForm.expiryDate,
        quantity: qty,
        unitCost: Number(batchForm.unitCost) || 0,
        supplierName: batchForm.supplierName.trim() || 'Direct Pharmaceutical Supply'
      });
      setShowReceiveBatchModal(false);
      sweetAlert.success('Stock Batch Received', `Received ${qty} units under Lot #${batchForm.batchNumber}. Stock inventory updated.`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to receive batch';
      setFormError(msg);
      sweetAlert.error('Stock Inward Failed', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !adjustForm.quantityChange || !adjustForm.notes.trim()) {
      sweetAlert.warning('Missing Adjustment Info', 'Please enter discrepancy quantity change and clinical justification notes.');
      return;
    }
    if (!adjustForm.adjustmentType) {
      sweetAlert.warning('Missing Adjustment Reason', 'Please select an adjustment reason from the dropdown.');
      return;
    }
    try {
      setFormLoading(true);
      setFormError('');
      await api.post(`/pharmacy/batches/${selectedBatch.id}/adjust`, {
        adjustmentQuantity: Number(adjustForm.quantityChange),
        quantityChange: Number(adjustForm.quantityChange),
        transactionType: adjustForm.adjustmentType,
        adjustmentType: adjustForm.adjustmentType,
        notes: adjustForm.notes.trim()
      });
      setShowAdjustModal(false);
      sweetAlert.success('Stock Adjusted', 'Inventory balance updated in central dispensary.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to adjust stock';
      setFormError(msg);
      sweetAlert.error('Adjustment Failed', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const openReceiveBatch = (med?: Medicine) => {
    setBatchForm({
      medicineId: med ? med.id.toString() : '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      unitCost: med ? med.costPrice.toString() : '',
      supplierName: ''
    });
    setFormError('');
    setShowReceiveBatchModal(true);
  };

  const openAdjustModal = (batch: MedicineBatch) => {
    setSelectedBatch(batch);
    setAdjustForm({
      quantityChange: '',
      adjustmentType: '',
      notes: ''
    });
    setFormError('');
    setShowAdjustModal(true);
  };

  // Filtered meds
  const filteredMedicines = medicines.filter(m => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Pharmacy & Formulary Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Batch tracking, First-Expired-First-Out (FEFO) dispensing, stock receipt, and discrepancy audits
          </p>
        </div>
        {canManageStock && (
          <div className="flex gap-2">
            <button
              onClick={() => openReceiveBatch()}
              className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Layers className="w-4 h-4" />
              Receive Batch
            </button>
            <button
              onClick={() => { setFormError(''); setShowAddMedModal(true); }}
              className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Formulary Drugs</p>
            <p className="text-2xl font-bold text-navy-950 mt-1">{medicines.length}</p>
          </div>
          <Package className="w-8 h-8 text-slate-400" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between bg-amber-50/20">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Low-Stock Alerts</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{lowStockList.length}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between bg-rose-50/20">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase">Expiring Batches (60d)</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{expiringBatches.length}</p>
          </div>
          <Clock className="w-8 h-8 text-rose-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between bg-teal-50/20">
          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase">Recent Movements</p>
            <p className="text-2xl font-bold text-teal-800 mt-1">{transactions.length}</p>
          </div>
          <Sliders className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Medication Catalog ({medicines.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'batches'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-600" />
          Active Batches & Adjustments ({allBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'alerts'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Alerts & Expiry ({lowStockList.length + expiringBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-1 border-b-2 transition-all ${
            activeTab === 'transactions'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory Audit Log
        </button>
      </div>

      {/* TAB 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search drug name, generic name, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Categories</option>
              <option value="ANTIBIOTIC">Antibiotic</option>
              <option value="ANALGESIC">Analgesic</option>
              <option value="ANTIPYRETIC">Antipyretic</option>
              <option value="CARDIOVASCULAR">Cardiovascular</option>
              <option value="ANTIDIABETIC">Antidiabetic</option>
              <option value="RESPIRATORY">Respiratory</option>
              <option value="GASTROINTESTINAL">Gastrointestinal</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Medicine Name</th>
                    <th className="px-5 py-3.5">SKU / Generic</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">Current Stock</th>
                    <th className="px-5 py-3.5">Reorder Level</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading catalog...</td>
                    </tr>
                  ) : filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No medicines found matching criteria.</td>
                    </tr>
                  ) : (
                    filteredMedicines.map((med) => {
                      const isLow = (med.totalStock ?? 0) <= med.reorderLevel;
                      return (
                        <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-navy-950 block">{med.name}</span>
                            <span className="text-[11px] text-slate-400">{med.unitOfMeasure}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-mono text-xs text-slate-700">{med.sku}</div>
                            <div className="text-[11px] text-slate-500 italic">{med.genericName}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {med.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-navy-900">
                            ₹{Number(med.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                                {med.totalStock ?? 0}
                              </span>
                              {isLow && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                  LOW
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-medium">
                            {med.reorderLevel} units
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {canManageStock && (
                              <div className="flex items-center justify-end gap-2">
                                {allBatches.some((b) => b.medicineId === med.id) && (
                                  <button
                                    onClick={() => {
                                      const batch = allBatches.find((b) => b.medicineId === med.id);
                                      if (batch) openAdjustModal(batch);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1"
                                    title="Adjust stock or report discrepancy for this medicine"
                                  >
                                    <Sliders className="w-3 h-3" />
                                    Adjust Stock
                                  </button>
                                )}
                                <button
                                  onClick={() => openReceiveBatch(med)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 rounded-lg transition-colors"
                                >
                                  + Add Stock
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Active Batches & Stock Adjustments */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h3 className="font-bold text-base text-navy-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                Hospital Active Drug Batches & Adjustments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full list of active medication batches. Click "Adjust Stock" on any batch (e.g. AMO26001) to record returns, damage, or audit discrepancies.
              </p>
            </div>
            {canManageStock && (
              <button
                onClick={() => openReceiveBatch()}
                className="flex items-center gap-2 px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Receive New Batch
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Batch Number</th>
                  <th className="px-5 py-3.5">Medication Name</th>
                  <th className="px-5 py-3.5">Stock In Inventory</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Supplier / Vendor</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {allBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No medication batches found in inventory.
                    </td>
                  </tr>
                ) : (
                  allBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-navy-950 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                          {b.batchNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-navy-900">
                          {b.medicineName || `Medication #${b.medicineId}`}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">
                          {b.quantityInStock} units
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-600">
                          {b.expiryDate}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {b.supplierName || 'Standard Formulary Supply'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {canManageStock && (
                          <button
                            onClick={() => openAdjustModal(b)}
                            className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Alerts & Expiry */}
      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-navy-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Critical Low-Stock Formulary Drugs
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {lowStockList.length} Items
              </span>
            </div>

            {lowStockList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">All medicines meet minimum safety inventory levels.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockList.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-navy-950">{m.name}</p>
                      <p className="text-xs text-slate-500">Generic: {m.genericName} • Category: {m.category}</p>
                      <div className="flex gap-4 mt-1 text-xs">
                        <span className="text-rose-600 font-semibold">Stock: {m.totalStock ?? 0}</span>
                        <span className="text-slate-500">Reorder Level: {m.reorderLevel}</span>
                      </div>
                    </div>
                    {canManageStock && (
                      <button
                        onClick={() => openReceiveBatch(m)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                      >
                        Order / Restock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring Batches */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-navy-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                Batches Expiring Within 60 Days
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {expiringBatches.length} Batches
              </span>
            </div>

            {expiringBatches.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">No active batches expiring in the next 60 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringBatches.map((b) => (
                  <div key={b.id} className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-navy-950">{b.medicineName || `Med #${b.medicineId}`}</p>
                      <p className="text-xs text-slate-500 font-mono">Batch: {b.batchNumber} • Expiry: {b.expiryDate}</p>
                      <p className="text-xs font-semibold text-rose-700 mt-0.5">Remaining Units: {b.quantityInStock}</p>
                    </div>
                    {canManageStock && (
                      <button
                        onClick={() => openAdjustModal(b)}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg border border-rose-300 inline-flex items-center gap-1 shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Adjust Stock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Transactions Audit */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Medicine</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Qty</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No inventory transactions logged.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-navy-950">
                        {tx.medicineName}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">
                        {tx.batchNumber}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          tx.transactionType === 'RECEIPT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.transactionType === 'DISPENSE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-navy-900">
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {tx.performedByUserName || 'System'}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-xs truncate">
                        {tx.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Register Medicine */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-400" />
                Add Medicine to Formulary
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateMedicine} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g., Augmentin 625mg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
                  <input
                    type="text"
                    required
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    placeholder="e.g., Amoxicillin + Clavulanate"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={medForm.sku}
                    onChange={(e) => setMedForm({ ...medForm, sku: e.target.value })}
                    placeholder="AUG-625"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="ANTIBIOTIC">Antibiotic</option>
                    <option value="ANALGESIC">Analgesic</option>
                    <option value="CARDIOVASCULAR">Cardiovascular</option>
                    <option value="ANTIDIABETIC">Antidiabetic</option>
                    <option value="RESPIRATORY">Respiratory</option>
                    <option value="GASTROINTESTINAL">Gastrointestinal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                  <select
                    required
                    value={medForm.unitOfMeasure}
                    onChange={(e) => setMedForm({ ...medForm, unitOfMeasure: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Unit of Measure --</option>
                    <option value="TABLET">Tablet</option>
                    <option value="CAPSULE">Capsule</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="VIAL">Vial (Inj)</option>
                    <option value="TUBE">Tube (Oint)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={medForm.costPrice}
                    onChange={(e) => setMedForm({ ...medForm, costPrice: e.target.value })}
                    placeholder="e.g. 50.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={medForm.unitPrice}
                    onChange={(e) => setMedForm({ ...medForm, unitPrice: e.target.value })}
                    placeholder="e.g. 120.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    value={medForm.reorderLevel}
                    onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Receive Batch */}
      {showReceiveBatchModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                Receive Stock Batch from Supplier
              </h3>
              <button onClick={() => setShowReceiveBatchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleReceiveBatch} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Medicine *</label>
                <select
                  required
                  value={batchForm.medicineId}
                  onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                >
                  <option value="">-- Select Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    placeholder="BATCH-2026-X"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    placeholder="500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.unitCost}
                    onChange={(e) => setBatchForm({ ...batchForm, unitCost: e.target.value })}
                    placeholder="e.g. 50.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  value={batchForm.supplierName}
                  onChange={(e) => setBatchForm({ ...batchForm, supplierName: e.target.value })}
                  placeholder="e.g., Pfizer Global / MedSupply Co."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReceiveBatchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {formLoading ? 'Receiving...' : 'Confirm Stock Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjust Stock */}
      {showAdjustModal && selectedBatch && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-400" />
                Adjust Stock: Batch {selectedBatch.batchNumber}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p className="text-slate-600">Medicine: <span className="font-semibold text-navy-900">{selectedBatch.medicineName}</span></p>
                <p className="text-slate-600">Current Stock: <span className="font-bold text-navy-900">{selectedBatch.quantityInStock} units</span></p>
                <p className="text-slate-600">Expiry: <span className="text-rose-600 font-mono">{selectedBatch.expiryDate}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Quantity *</label>
                  <input
                    type="number"
                    required
                    value={adjustForm.quantityChange}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })}
                    placeholder="-10 or +5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Use negative for deductions</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Type *</label>
                  <select
                    required
                    value={adjustForm.adjustmentType}
                    onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  >
                    <option value="">-- Select Reason / Type --</option>
                    <option value="DAMAGED">Damaged / Broken</option>
                    <option value="EXPIRED">Quarantine / Expired</option>
                    <option value="AUDIT_DISCREPANCY">Audit Discrepancy</option>
                    <option value="RETURN">Return to Vendor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="Explain reason for discrepancy or physical inspection results..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {formLoading ? 'Recording...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
