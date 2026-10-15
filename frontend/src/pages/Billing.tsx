import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Invoice, Payment, Patient } from '../types';
import { useAuth } from '../services/authContext';
import { 
  CreditCard, 
  PlusCircle, 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  AlertCircle,
  FileText,
  Calendar,
  User,
  ArrowUpRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';
import { TablePagination } from '../components/TablePagination';

interface InvoiceLineItemDraft {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const Billing: React.FC = () => {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Service Category Presets for Auto-filling
  const BILLING_SERVICE_PRESETS: Record<string, { desc: string; rate: number }> = {
    CONSULTATION: { desc: 'Physician Specialist Clinical Consultation', rate: 500.0 },
    LABORATORY: { desc: 'Clinical Pathology & Diagnostic Panel', rate: 800.0 },
    PHARMACY: { desc: 'Prescription Pharmaceuticals & Dispensing', rate: 450.0 },
    ROOM_CHARGE: { desc: 'Inpatient General Ward Bed (Daily Rate)', rate: 1200.0 },
    PROCEDURE: { desc: 'Minor Medical Procedure & Clinical Dressing', rate: 750.0 },
    OTHER: { desc: 'Hospital Administrative & Facility Service Fee', rate: 250.0 },
  };

  // New Invoice Form
  const [createForm, setCreateForm] = useState({
    patientId: '',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    taxAmount: '0',
    discountAmount: '0',
    notes: '',
    items: [
      { itemType: 'CONSULTATION', description: 'Physician Specialist Clinical Consultation', quantity: 1, unitPrice: 500.0 }
    ] as InvoiceLineItemDraft[]
  });

  // Payment Form
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: '',
    transactionReference: '',
    notes: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canManageBilling = hasRole(['ROLE_SUPER_ADMIN', 'ROLE_HOSPITAL_ADMIN', 'ROLE_ACCOUNTANT']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, patRes] = await Promise.all([
        api.get('/billing/invoices?size=100'),
        api.get('/patients?size=100')
      ]);

      setInvoices(invRes.data.data?.content || []);
      setPatients(patRes.data.data?.content || []);
    } catch (err: any) {
      console.error('Failed to load billing records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setCreateForm({
      ...createForm,
      items: [
        ...createForm.items,
        { itemType: 'LABORATORY', description: 'Clinical Pathology & Diagnostic Panel', quantity: 1, unitPrice: 800.0 }
      ]
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (createForm.items.length <= 1) return;
    const updated = createForm.items.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, items: updated });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...createForm.items];
    if (field === 'itemType' && BILLING_SERVICE_PRESETS[value]) {
      updated[index] = {
        ...updated[index],
        itemType: value,
        description: BILLING_SERVICE_PRESETS[value].desc,
        unitPrice: BILLING_SERVICE_PRESETS[value].rate
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCreateForm({ ...createForm, items: updated });
  };

  const handleLoadStandardCharges = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [
        { itemType: 'CONSULTATION', description: 'Senior Specialist Consultation', quantity: 1, unitPrice: 500.0 },
        { itemType: 'ROOM_CHARGE', description: 'Ward Bed & Nursing Care (Daily)', quantity: 1, unitPrice: 1200.0 },
        { itemType: 'PHARMACY', description: 'Prescription Pharmaceuticals & Supplies', quantity: 1, unitPrice: 450.0 }
      ]
    }));
  };

  const draftTotal = createForm.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0)
    + (Number(createForm.taxAmount) || 0)
    - (Number(createForm.discountAmount) || 0);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.patientId) {
      sweetAlert.warning('Missing Patient', 'Please select a patient for this invoice.');
      return;
    }
    if (createForm.items.length === 0 || createForm.items.some(it => !it.description.trim())) {
      sweetAlert.warning('Incomplete Items', 'Please ensure all line items have a valid description.');
      return;
    }
    if (createForm.items.some(it => Number(it.quantity) <= 0 || Number(it.unitPrice) < 0)) {
      sweetAlert.warning('Invalid Quantities/Rates', 'Quantity must be greater than 0 and unit price cannot be negative.');
      return;
    }
    if (draftTotal <= 0) {
      sweetAlert.warning('Invalid Invoice Total', 'Invoice total must be greater than ₹0.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError('');
      const res = await api.post('/billing/invoices', {
        patientId: Number(createForm.patientId),
        dueDate: createForm.dueDate,
        taxAmount: Number(createForm.taxAmount) || 0,
        discountAmount: Number(createForm.discountAmount) || 0,
        notes: createForm.notes,
        items: createForm.items.map(item => ({
          itemType: item.itemType,
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      });
      setShowCreateModal(false);
      sweetAlert.success('Invoice Created', `Invoice ${res.data.data?.invoiceNumber || ''} for ₹${draftTotal.toFixed(2)} generated successfully.`);
      fetchData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to create invoice';
      setFormError(errMsg);
      sweetAlert.error('Invoice Creation Failed', errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const openPayModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayForm({
      amount: inv.balanceAmount.toString(),
      paymentMethod: 'CARD',
      transactionReference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Full payment received at checkout desk'
    });
    setFormError('');
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const paymentAmt = Number(payForm.amount);
    if (!paymentAmt || paymentAmt <= 0) {
      sweetAlert.warning('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }
    if (!payForm.paymentMethod) {
      sweetAlert.warning('Missing Payment Method', 'Please select a payment tender / method (Card, Cash, UPI, etc.).');
      return;
    }
    if (paymentAmt > Number(selectedInvoice.balanceAmount) + 0.01) {
      sweetAlert.warning('Amount Exceeds Balance', `Payment cannot exceed the outstanding balance of ₹${Number(selectedInvoice.balanceAmount).toFixed(2)}.`);
      return;
    }

    try {
      setFormLoading(true);
      setFormError('');
      await api.post(`/billing/invoices/${selectedInvoice.id}/payments`, {
        amount: paymentAmt,
        paymentMethod: payForm.paymentMethod,
        transactionReference: payForm.transactionReference,
        notes: payForm.notes
      });
      setShowPayModal(false);
      sweetAlert.success('Payment Cleared', `Payment of ₹${paymentAmt.toFixed(2)} recorded successfully via ${payForm.paymentMethod}. Balance updated.`);
      fetchData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to record payment';
      setFormError(errMsg);
      sweetAlert.error('Payment Failed', errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const openDetails = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowDetailsModal(true);
  };

  // Financial KPI calculations
  const totalBilled = invoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const totalBalance = invoices.reduce((acc, curr) => acc + (Number(curr.balanceAmount) || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'PAID').length;

  const filteredInvoices = invoices.filter(i => {
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSearch = 
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.patientCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" />
            Billing & Revenue Settlement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Itemized invoicing, multi-tender payment processing, receivables aging, and balance reconciliation
          </p>
        </div>
        {canManageBilling && (
          <button
            onClick={() => { setFormError(''); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            + Generate Invoice
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced</p>
            <p className="text-2xl font-bold text-navy-950 mt-1">₹{totalBilled.toFixed(2)}</p>
          </div>
          <Receipt className="w-8 h-8 text-slate-400" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">₹{totalPaid.toFixed(2)}</p>
          </div>
          <IndianRupee className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between bg-rose-50/20">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase">Outstanding Balance</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">₹{totalBalance.toFixed(2)}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between bg-teal-50/20">
          <div>
            <p className="text-xs font-semibold text-teal-700 uppercase">Settlement Rate</p>
            <p className="text-2xl font-bold text-teal-800 mt-1">
              {invoices.length > 0 ? ((paidCount / invoices.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, patient name, or patient ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ISSUED">Issued (Unpaid)</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid / Cleared</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Patient Details</th>
                <th className="px-5 py-3.5">Date / Due</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Paid Amount</th>
                <th className="px-5 py-3.5">Outstanding Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">Loading billing records...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">No invoices found matching criteria.</td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isPartial = inv.status === 'PARTIALLY_PAID';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-navy-950 block">{inv.invoiceNumber}</span>
                        {inv.admissionNumber && (
                          <span className="text-[11px] text-teal-600 font-medium">IPD: {inv.admissionNumber}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-navy-900">{inv.patientName}</div>
                        <div className="text-xs text-slate-400">{inv.patientCode}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        <div>Billed: {inv.invoiceDate}</div>
                        <div className="text-slate-400">Due: {inv.dueDate}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-navy-950">
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
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(inv)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            View Bill
                          </button>
                          {!isPaid && canManageBilling && (
                            <button
                              onClick={() => openPayModal(inv)}
                              className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm whitespace-nowrap"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              Record Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 10-entries-per-page Pagination */}
        {filteredInvoices.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredInvoices.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* MODAL: View Invoice Details */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-base">Invoice #{selectedInvoice.invoiceNumber}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Patient: <strong className="text-white font-medium">{selectedInvoice.patientName}</strong> ({selectedInvoice.patientCode})</span>
                    <span>&middot;</span>
                    <span>Billed By: <strong className="text-teal-400 font-medium">{selectedInvoice.createdByUserName || 'Hospital Billing Desk'}</strong></span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-sm">
              {/* Itemized Table */}
              <div>
                <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider mb-2">Itemized Charges</h4>
                <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-700">{item.itemType}</td>
                        <td className="p-2.5 text-slate-800">{item.description}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-navy-900">₹{Number(item.totalPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-mono">₹{Number(selectedInvoice.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-mono text-emerald-600">-₹{Number(selectedInvoice.discountAmount).toFixed(2)}</span>
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
                      <div key={p.id} className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-emerald-900">{p.paymentNumber}</span>
                          <span className="text-slate-500 ml-2">Method: {p.paymentMethod}</span>
                          <span className="text-slate-400 ml-2 font-mono">{p.transactionReference}</span>
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
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
                Process Payment: {selectedInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <p className="text-slate-600">Patient: <span className="font-semibold text-navy-900">{selectedInvoice.patientName}</span></p>
                <p className="text-slate-600">Outstanding: <span className="font-bold text-rose-600 font-mono">₹{Number(selectedInvoice.balanceAmount).toFixed(2)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 400.00"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-navy-900 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Tender / Method *</label>
                <select
                  required
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Select Payment Method --</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / Digital QR</option>
                  <option value="INSURANCE">Insurance TPA</option>
                  <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={payForm.transactionReference}
                  onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                  placeholder="POS auth code or receipt #"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {formLoading ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Generate Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="bg-navy-950 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-teal-400" />
                Generate New Outpatient / Clinical Invoice
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={createForm.patientId}
                    onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
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
                      title="Load standard charges: Consultation (₹500), Bed (₹1,200), Pharmacy (₹450)"
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
                  {createForm.items.map((item, idx) => (
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
                        {createForm.items.length > 1 && (
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
                    value={createForm.taxAmount}
                    onChange={(e) => setCreateForm({ ...createForm, taxAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={createForm.discountAmount}
                    onChange={(e) => setCreateForm({ ...createForm, discountAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">Calculated Invoice Total:</span>
                <span className="font-bold text-lg text-navy-950 font-mono">₹{Math.max(0, draftTotal).toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 shadow-sm"
                >
                  {formLoading ? 'Creating...' : `Create Invoice (₹${Math.max(0, draftTotal).toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
