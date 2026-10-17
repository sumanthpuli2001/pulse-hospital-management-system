import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { emrApi, patientApi, doctorApi } from '../services/api';
import { Patient, MedicalRecord, VitalSign, Allergy, Diagnosis, Doctor } from '../types';
import {
  FileText,
  AlertTriangle,
  Activity,
  Heart,
  Plus,
  X,
  Stethoscope,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Thermometer,
  Scale,
  TrendingUp,
  User
} from 'lucide-react';

export const EMR: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    initialPatientId ? Number(initialPatientId) : null
  );
  const [summary, setSummary] = useState<any>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Consultation Form
  const [consultForm, setConsultForm] = useState({
    doctorId: '',
    chiefComplaint: '',
    physicalExamination: '',
    assessmentAndPlan: '',
    vitals: {
      systolicBp: 120,
      diastolicBp: 80,
      pulseRate: 72,
      temperature: 36.8,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weightKg: 70.0,
      heightCm: 175.0,
    },
    diagnoses: [
      { icdCode: 'I10', diagnosisName: 'Essential Primary Hypertension', description: 'Essential Primary Hypertension', diagnosisType: 'FINAL', status: 'ACTIVE' }
    ]
  });

  useEffect(() => {
    loadPatientsList();
    loadDoctorsList();
  }, []);

  useEffect(() => {
    const pParam = searchParams.get('patientId');
    if (pParam) {
      const parsed = Number(pParam);
      if (!isNaN(parsed) && parsed !== selectedPatientId) {
        setSelectedPatientId(parsed);
      }
    }
  }, [searchParams]);

  const handleSelectPatient = (id: number) => {
    setSelectedPatientId(id);
    setSearchParams({ patientId: String(id) });
  };

  const loadDoctorsList = async () => {
    try {
      const res = await doctorApi.getDoctors();
      if (res.data.success && Array.isArray(res.data.data)) {
        setDoctors(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load doctors', e);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientEMR(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatientsList = async () => {
    try {
      const res = await patientApi.getPatients({ size: 50 });
      if (res.data.success && res.data.data.content.length > 0) {
        const patientList = res.data.data.content;
        setPatients(patientList);
        const pParam = searchParams.get('patientId');
        const targetId = pParam ? Number(pParam) : (selectedPatientId || patientList[0].id);
        setSelectedPatientId(targetId);
      }
    } catch (e) {
      console.error('Failed to load patient list', e);
    }
  };

  const loadPatientEMR = async (pId: number) => {
    try {
      setLoading(true);
      const [sumRes, recRes] = await Promise.all([
        emrApi.getPatientSummary(pId),
        emrApi.getPatientRecords(pId),
      ]);
      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (recRes.data.success) {
        const data = recRes.data.data;
        if (Array.isArray(data)) {
          setRecords(data);
        } else if (data && Array.isArray((data as any).content)) {
          setRecords((data as any).content);
        } else if (sumRes.data.data?.recentConsultations) {
          setRecords(sumRes.data.data.recentConsultations);
        } else {
          setRecords([]);
        }
      }
    } catch (e) {
      console.error('Failed to load patient EMR', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    if (!consultForm.doctorId) {
      setError('Please select an attending physician from the dropdown.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        patientId: selectedPatientId,
        doctorId: Number(consultForm.doctorId),
        chiefComplaint: consultForm.chiefComplaint,
        physicalExamination: consultForm.physicalExamination || 'Normal physical examination',
        assessmentAndPlan: consultForm.assessmentAndPlan || 'Continue clinical monitoring and treatment regimen',
        diagnoses: consultForm.diagnoses.map((d: any) => ({
          icdCode: d.icdCode || 'I10',
          diagnosisName: d.diagnosisName || d.description || 'Essential Primary Hypertension',
          diagnosisType: d.diagnosisType || 'FINAL',
          status: d.status || 'ACTIVE',
          notes: d.notes || 'Recorded during clinical encounter'
        }))
      };

      const res = await emrApi.createConsultation(payload);

      // Record vital signs if entered
      if (consultForm.vitals && consultForm.vitals.systolicBp) {
        try {
          await emrApi.addVitals({
            patientId: selectedPatientId,
            systolicBp: consultForm.vitals.systolicBp,
            diastolicBp: consultForm.vitals.diastolicBp,
            pulseRate: consultForm.vitals.pulseRate,
            temperature: consultForm.vitals.temperature,
            respiratoryRate: consultForm.vitals.respiratoryRate,
            oxygenSaturation: consultForm.vitals.oxygenSaturation,
            weightKg: consultForm.vitals.weightKg,
            heightCm: consultForm.vitals.heightCm
          });
        } catch (ve) {
          console.warn('Vitals auto-logging notice', ve);
        }
      }

      if (res.data.success) {
        setSuccess('Clinical consultation and ICD diagnoses recorded successfully!');
        setShowConsultModal(false);
        setConsultForm({
          doctorId: '',
          chiefComplaint: '',
          physicalExamination: '',
          assessmentAndPlan: '',
          vitals: {
            systolicBp: 120,
            diastolicBp: 80,
            pulseRate: 72,
            temperature: 36.8,
            respiratoryRate: 16,
            oxygenSaturation: 98,
            weightKg: 70.0,
            heightCm: 175.0,
          },
          diagnoses: [
            { icdCode: 'I10', diagnosisName: 'Essential Primary Hypertension', description: 'Essential Primary Hypertension', diagnosisType: 'FINAL', status: 'ACTIVE' }
          ]
        });
        loadPatientEMR(selectedPatientId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/patients"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition border border-slate-300 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Patients</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Electronic Medical Records (EMR)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Longitudinal Patient Chart &middot; ICD-10 Diagnoses &middot; Clinical Vitals &middot; Attending Consultations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <User className="w-4 h-4 text-slate-500" />
            <label htmlFor="patient-selector" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Patient:
            </label>
            <select
              id="patient-selector"
              value={selectedPatientId || ''}
              onChange={(e) => handleSelectPatient(Number(e.target.value))}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-md px-2.5 py-1 focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-2xs"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.patientCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowConsultModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Encounter</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading patient chart...</div>
      ) : !summary ? (
        <div className="py-12 text-center text-xs text-slate-400">No medical records found for this patient</div>
      ) : (
        <>
          {/* Patient Banner */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-950 text-white rounded-2xl p-5 shadow-sm border border-navy-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center font-bold text-teal-300 text-sm">
                  {summary.patient?.firstName?.[0]}{summary.patient?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {summary.patient?.firstName} {summary.patient?.lastName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                    <span className="font-mono text-teal-300">{summary.patient?.patientCode}</span>
                    <span>&middot;</span>
                    <span>{summary.patient?.age} yrs, {summary.patient?.gender}</span>
                    <span>&middot;</span>
                    <span>Blood: <strong className="text-white">{summary.patient?.bloodGroup?.replace('_', ' ')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Allergy Warnings */}
              <div className="flex items-center gap-2">
                {summary.allergies?.length === 0 ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg">
                    No Known Drug Allergies (NKDA)
                  </span>
                ) : (
                  summary.allergies?.map((a: Allergy) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{(a as any).allergenName || (a as any).allergen || 'Allergy'} ({(a as any).severity || 'MODERATE'})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Vitals Summary Strip */}
          {summary.latestVitals ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Blood Pressure */}
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30 border border-rose-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">Blood Pressure</span>
                  <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-rose-950 tracking-tight">
                    {summary.latestVitals.systolicBp}/{summary.latestVitals.diastolicBp}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600/70">mmHg</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-100/80 font-bold text-rose-700">
                    {summary.latestVitals.systolicBp < 120 ? 'Optimal' : summary.latestVitals.systolicBp <= 129 ? 'Normal' : 'Elevated'}
                  </span>
                  <span className="text-slate-400 font-medium">Sys/Dia</span>
                </div>
              </div>

              {/* Heart Rate */}
              <div className="relative overflow-hidden bg-gradient-to-br from-red-50/90 via-white to-red-50/30 border border-red-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-red-600">Heart Rate</span>
                  <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-red-950 tracking-tight">
                    {summary.latestVitals.pulseRate}
                  </span>
                  <span className="text-[10px] font-semibold text-red-600/70">bpm</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-red-100/80 font-bold text-red-700">
                    {summary.latestVitals.pulseRate >= 60 && summary.latestVitals.pulseRate <= 100 ? 'Normal sinus' : 'Monitor'}
                  </span>
                  <span className="text-slate-400 font-medium">Resting</span>
                </div>
              </div>

              {/* SpO2 Oxygen */}
              <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50/90 via-white to-cyan-50/30 border border-cyan-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-700">SpO2 Oxygen</span>
                  <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-cyan-950 tracking-tight">
                    {summary.latestVitals.oxygenSaturation}
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-700/70">%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-cyan-100/80 font-bold text-cyan-800">
                    {summary.latestVitals.oxygenSaturation >= 95 ? 'Adequate O₂' : 'Low O₂'}
                  </span>
                  <span className="text-slate-400 font-medium">Room Air</span>
                </div>
              </div>

              {/* Body Temperature */}
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border border-amber-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Body Temp</span>
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    <Thermometer className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-amber-950 tracking-tight">
                    {summary.latestVitals.temperature}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700/70">°C</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100/80 font-bold text-amber-800">
                    {summary.latestVitals.temperature <= 37.2 ? 'Afebrile' : 'Febrile'}
                  </span>
                  <span className="text-slate-400 font-medium">Axillary</span>
                </div>
              </div>

              {/* Weight */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/30 border border-indigo-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">Body Weight</span>
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-indigo-950 tracking-tight">
                    {summary.latestVitals.weightKg}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700/70">kg</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-100/80 font-bold text-indigo-800">
                    Recorded
                  </span>
                  <span className="text-slate-400 font-medium">{((summary.latestVitals.weightKg || 70) * 2.20462).toFixed(1)} lbs</span>
                </div>
              </div>

              {/* BMI Index */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/30 border border-emerald-200 rounded-xl p-3.5 shadow-xs transition hover:shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">BMI Index</span>
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-emerald-950 tracking-tight">
                    {summary.latestVitals.bmi}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700/70">kg/m²</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/80 font-bold text-emerald-800">
                    {Number(summary.latestVitals.bmi) < 18.5 ? 'Underweight' : Number(summary.latestVitals.bmi) <= 24.9 ? 'Healthy BMI' : Number(summary.latestVitals.bmi) <= 29.9 ? 'Overweight' : 'Obese'}
                  </span>
                  <span className="text-slate-400 font-medium">Standard</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              No vital signs recorded for this patient. Click "New Encounter" above to record clinical vitals.
            </div>
          )}

          {/* Active Diagnoses & Longitudinal History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Problem List / Diagnoses */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Active Diagnoses & Conditions
              </h3>
              <div className="space-y-2.5">
                {summary.activeDiagnoses?.length === 0 ? (
                  <p className="text-xs text-slate-400">No active chronic conditions</p>
                ) : (
                  summary.activeDiagnoses?.map((d: Diagnosis) => (
                    <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{d.description}</span>
                        <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          {d.icdCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                        <span className="font-semibold">{d.diagnosisType}</span>
                        <span>&middot;</span>
                        <span className="text-emerald-700 font-bold">{d.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clinical Encounter History */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Clinical Encounter History ({records.length})
              </h3>
              <div className="space-y-4">
                {records.length === 0 ? (
                  <p className="text-xs text-slate-400">No past clinical consultations recorded</p>
                ) : (
                  records.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <span className="font-bold text-slate-900">
                            {rec.doctorName?.startsWith('Dr.') ? rec.doctorName : `Dr. ${rec.doctorName || ''}`}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{rec.encounterDate}</span>
                      </div>

                      <div className="text-xs space-y-2 text-slate-700">
                        <p><strong>Chief Complaint:</strong> {rec.chiefComplaint}</p>
                        {rec.physicalExamination && (
                          <p><strong>Physical Exam:</strong> {rec.physicalExamination}</p>
                        )}
                        {rec.assessmentAndPlan && (
                          <p><strong>Assessment & Treatment Plan:</strong> {rec.assessmentAndPlan}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Consultation Modal */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Clinical Consultation</h3>
                <p className="text-[11px] text-slate-500">Record diagnostic assessment, physical exam findings, and clinical vitals</p>
              </div>
              <button onClick={() => setShowConsultModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRecordConsultation} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Attending Physician *</label>
                <select
                  required
                  value={consultForm.doctorId}
                  onChange={(e) => setConsultForm({ ...consultForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold outline-none focus:border-teal-500 shadow-2xs"
                >
                  <option value="">-- Select Attending Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.departmentName || d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Complaint *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Patient reports mild exertional dyspnea and morning dizziness..."
                  value={consultForm.chiefComplaint}
                  onChange={(e) => setConsultForm({ ...consultForm, chiefComplaint: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-teal-500 shadow-2xs placeholder-slate-400"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Examination Findings</label>
                <textarea
                  rows={2}
                  placeholder="S1/S2 audible, no murmurs. Lungs clear to auscultation bilaterally..."
                  value={consultForm.physicalExamination}
                  onChange={(e) => setConsultForm({ ...consultForm, physicalExamination: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-teal-500 shadow-2xs placeholder-slate-400"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment & Clinical Plan</label>
                <textarea
                  rows={2}
                  placeholder="Titrate antihypertensive therapy. Order Lipid profile. Follow up in 2 weeks..."
                  value={consultForm.assessmentAndPlan}
                  onChange={(e) => setConsultForm({ ...consultForm, assessmentAndPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium outline-none focus:border-teal-500 shadow-2xs placeholder-slate-400"
                ></textarea>
              </div>

              {/* Vitals Entry */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-bold text-slate-800 mb-2">Patient Vitals at Encounter</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Systolic BP</label>
                    <input
                      type="number"
                      value={consultForm.vitals.systolicBp}
                      onChange={(e) => setConsultForm({ ...consultForm, vitals: { ...consultForm.vitals, systolicBp: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900 font-semibold rounded-md shadow-2xs focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Diastolic BP</label>
                    <input
                      type="number"
                      value={consultForm.vitals.diastolicBp}
                      onChange={(e) => setConsultForm({ ...consultForm, vitals: { ...consultForm.vitals, diastolicBp: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900 font-semibold rounded-md shadow-2xs focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Pulse (bpm)</label>
                    <input
                      type="number"
                      value={consultForm.vitals.pulseRate}
                      onChange={(e) => setConsultForm({ ...consultForm, vitals: { ...consultForm.vitals, pulseRate: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900 font-semibold rounded-md shadow-2xs focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">SpO2 (%)</label>
                    <input
                      type="number"
                      value={consultForm.vitals.oxygenSaturation}
                      onChange={(e) => setConsultForm({ ...consultForm, vitals: { ...consultForm.vitals, oxygenSaturation: Number(e.target.value) } })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 text-slate-900 font-semibold rounded-md shadow-2xs focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Save Encounter Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
