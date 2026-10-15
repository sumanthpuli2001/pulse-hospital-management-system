import React, { useState, useEffect } from 'react';
import { labApi } from '../services/api';
import { LabOrder, LabTest, LabOrderItem } from '../types';
import { useAuth } from '../services/authContext';
import {
  FlaskConical,
  Barcode,
  Search,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';

export const Laboratory: React.FC = () => {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
  const [selectedItem, setSelectedItem] = useState<LabOrderItem | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Result Form
  const [resultForm, setResultForm] = useState({
    parameterName: '',
    resultValue: '',
    referenceRange: '',
    unit: '',
    isAbnormal: false,
    remarks: '',
  });

  useEffect(() => {
    loadLabData();
  }, []);

  const loadLabData = async () => {
    try {
      setLoading(true);
      const [ordRes, testRes] = await Promise.all([
        labApi.getOrders({ size: 50 }),
        labApi.getTests(),
      ]);
      if (ordRes.data.success) setOrders(ordRes.data.data.content);
      if (testRes.data.success) setTests(testRes.data.data);
    } catch (e) {
      console.error('Failed to load lab data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectSample = async (item: LabOrderItem) => {
    try {
      const res = await labApi.collectSample(item.id);
      if (res.data.success) {
        setSuccess(`Specimen collected. Barcode assigned: ${res.data.data.sampleBarcode}`);
        loadLabData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to collect specimen');
    }
  };

  const openResultModal = (item: LabOrderItem) => {
    setSelectedItem(item);
    setResultForm({
      parameterName: item.testName,
      resultValue: '',
      referenceRange: '',
      unit: '',
      isAbnormal: false,
      remarks: '',
    });
    setShowResultModal(true);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setError('');

    if (!resultForm.resultValue.trim()) {
      sweetAlert.warning('Missing Result Value', 'Please enter quantitative result value (e.g. 95 mg/dL).');
      return;
    }

    try {
      const res = await labApi.enterResult(selectedItem.id, {
        ...resultForm,
        resultValue: resultForm.resultValue.trim(),
        remarks: resultForm.remarks.trim() || undefined
      });
      if (res.data.success) {
        setShowResultModal(false);
        sweetAlert.success(
          'Diagnostic Result Recorded',
          `Result recorded for ${selectedItem.testName}: ${resultForm.resultValue} ${resultForm.unit || ''}. Status updated to COMPLETED.`
        );
        loadLabData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to record test result';
      setError(msg);
      sweetAlert.error('Lab Update Failed', msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Diagnostic Laboratory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Specimen Barcode Tracking &middot; Result Verification &middot; Pathology Catalog</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laboratory Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Test Catalog ({tests.length})
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-teal-700 text-xs">{ord.orderNumber}</span>
                    <span className="text-xs font-bold text-slate-900">{ord.patientName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({ord.patientCode})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prescribed by Dr. {ord.doctorName} &middot; {ord.orderDate}
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {ord.status}
                </span>
              </div>

              {ord.clinicalIndications && (
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg italic">
                  "{ord.clinicalIndications}"
                </p>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Diagnostic Tests Ordered</span>
                {ord.items.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.testName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                            {item.testCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Specimen: {item.sampleType || 'SERUM'}</span>
                          <span>&middot;</span>
                          <span>Price: ₹{item.price}</span>
                          {item.sampleBarcode && (
                            <>
                              <span>&middot;</span>
                              <span className="flex items-center gap-1 font-mono text-teal-700 font-bold">
                                <Barcode className="w-3.5 h-3.5" />
                                {item.sampleBarcode}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => handleCollectSample(item)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Collect Sample
                          </button>
                        )}
                        {item.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => openResultModal(item)}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Enter Results
                          </button>
                        )}
                        {item.status === 'COMPLETED' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results details if present */}
                    {item.results && item.results.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1.5">
                        {item.results.map((res) => (
                          <div
                            key={res.id}
                            className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                              res.abnormal
                                ? 'bg-rose-50 border border-rose-200 text-rose-900'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{res.parameterName}: </span>
                              <span className="font-semibold text-base">{res.resultValue} {res.unit}</span>
                              <span className="text-[11px] text-slate-500 ml-2">(Ref: {res.referenceRange})</span>
                              {res.remarks && (
                                <p className="text-[11px] text-slate-600 mt-0.5">{res.remarks}</p>
                              )}
                            </div>
                            {res.abnormal && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md uppercase">
                                <AlertTriangle className="w-3 h-3" />
                                Abnormal
                              </span>
                            )}
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
      ) : (
        /* Test Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tests.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                {t.testCode}
              </span>
              <h3 className="text-xs font-bold text-slate-900 mt-2">{t.testName}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.category} &middot; {t.sampleType}</p>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">TAT: {t.standardTurnaroundHours} hrs</span>
                <span className="font-bold text-slate-900">₹{t.cost}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result Entry Modal */}
      {showResultModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Enter Diagnostic Result</h3>
                <p className="text-[11px] text-slate-400">{selectedItem.testName} ({selectedItem.testCode})</p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitResult} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parameter Analyzed *</label>
                <input
                  type="text"
                  required
                  value={resultForm.parameterName}
                  onChange={(e) => setResultForm({ ...resultForm, parameterName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Measured Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 215"
                    value={resultForm.resultValue}
                    onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    placeholder="mg/dL, g/dL"
                    value={resultForm.unit}
                    onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biological Reference Range</label>
                <input
                  type="text"
                  placeholder="e.g. < 200 mg/dL"
                  value={resultForm.referenceRange}
                  onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resultForm.isAbnormal}
                  onChange={(e) => setResultForm({ ...resultForm, isAbnormal: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-rose-700">Flag as Clinically Abnormal Value</span>
              </label>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pathologist Remarks / Impression</label>
                <textarea
                  rows={2}
                  placeholder="Clinical notes..."
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResultModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  Publish Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
