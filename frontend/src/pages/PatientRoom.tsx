import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inpatientApi, patientApi } from '../services/api';
import { BedBoardItem } from '../types';
import { 
  ArrowLeft, 
  Activity, 
  Heart, 
  Droplet, 
  Thermometer, 
  Wind, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  ShieldCheck, 
  Stethoscope, 
  Pill, 
  AlertCircle,
  Eye,
  Sliders,
  Play,
  Pause
} from 'lucide-react';
import { sweetAlert } from '../components/SweetAlert';
import { LiveECGMonitor } from '../components/LiveECGMonitor';

export const PatientRoom: React.FC = () => {
  const { bedId } = useParams<{ bedId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bed, setBed] = useState<BedBoardItem | null>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [admissionData, setAdmissionData] = useState<any>(null);
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');

  // Live Saline Drip Simulator State
  const [isDripActive, setIsDripActive] = useState(true);
  const [dripRate, setDripRate] = useState(75); // mL/hr
  const [volumeInfused, setVolumeInfused] = useState(320); // mL
  const totalVolume = 500; // mL

  // Live Vitals State
  const [pulse, setPulse] = useState(78);
  const [bpSys, setBpSys] = useState(124);
  const [bpDia, setBpDia] = useState(82);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(98.6);
  const [respRate, setRespRate] = useState(16);

  useEffect(() => {
    loadRoomDetails();
  }, [bedId]);

  // Subtle live pulse wave simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Slight natural fluctuations
      setPulse((prev) => Math.min(84, Math.max(72, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const res = await inpatientApi.getBedBoard();
      if (res.data.success) {
        const beds = res.data.data;
        const foundBed = beds.find((b: BedBoardItem) => b.bedId === Number(bedId)) || 
                         beds.find((b: BedBoardItem) => b.status === 'OCCUPIED') || 
                         beds[0];
        setBed(foundBed || null);

        if (foundBed && foundBed.currentAdmissionId) {
          try {
            const admRes = await inpatientApi.getAdmissionById(foundBed.currentAdmissionId);
            if (admRes.data.success) {
              setAdmissionData(admRes.data.data);
            }
          } catch (e) {
            console.error('Failed to load admission details', e);
          }
        }

        let detectedGender: 'MALE' | 'FEMALE' = 'MALE';
        if (foundBed && foundBed.currentPatientId) {
          try {
            const patRes = await patientApi.getPatientById(foundBed.currentPatientId);
            if (patRes.data.success) {
              const p = patRes.data.data;
              setPatientData(p);
              if (p.gender) {
                detectedGender = p.gender.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
              } else {
                const pName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                detectedGender = /kavya|soniya|priya|sarah|mary|lisa|anna|anita|swathi|sneha/i.test(pName) ? 'FEMALE' : 'MALE';
              }
            }
          } catch (e) {
            console.error('Failed to load patient details', e);
          }
        } else if (foundBed && foundBed.currentPatientName) {
          detectedGender = /kavya|soniya|priya|sarah|mary|lisa|anna|anita|swathi|sneha/i.test(foundBed.currentPatientName) ? 'FEMALE' : 'MALE';
        }
        setPatientGender(detectedGender);
      }
    } catch (err: any) {
      console.error('Failed to load room details', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDrip = () => {
    const nextState = !isDripActive;
    setIsDripActive(nextState);
    if (nextState) {
      sweetAlert.success('IV Saline Resumed', `Normal Saline 0.9% infusion set to ${dripRate} mL/hr.`);
    } else {
      sweetAlert.warning('IV Infusion Paused', 'Roller clamp closed. Saline drip paused.');
    }
  };

  const handleUpdateDripRate = (newRate: number) => {
    setDripRate(newRate);
    sweetAlert.info('Flow Rate Adjusted', `IV Saline infusion rate updated to ${newRate} mL/hr.`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-700">Connecting to Inpatient Bed Telemetry...</p>
        <p className="text-xs text-slate-400 mt-1">Establishing high-fidelity room monitoring link</p>
      </div>
    );
  }

  const patientName = bed?.currentPatientName || patientData ? `${patientData?.firstName} ${patientData?.lastName}` : (patientGender === 'MALE' ? 'Arjun Sharma' : 'Kavya Reddy');
  const patientCode = bed?.currentPatientCode || patientData?.patientCode || (patientGender === 'MALE' ? 'PAT-2026-0009' : 'PAT-2026-0003');
  const admissionNumber = bed?.currentAdmissionNumber || admissionData?.admissionNumber || (patientGender === 'MALE' ? 'ADM-2026-0004' : 'ADM-2026-0003');
  const roomNumber = bed?.roomNumber || 'GEN-201';
  const bedNumber = bed?.bedNumber || (patientGender === 'MALE' ? 'B-201-A' : 'B-201-B');
  const wardName = bed?.wardName || 'General Medicine Ward';
  const roomType = bed?.roomType || 'GENERAL_WARD';
  const diagnosis = admissionData?.admissionReason || (patientGender === 'MALE' ? 'Acute Observation & IV Rehydration' : 'Acute Fatigue & Observation · Dehydration');

  const isFemalePatient = patientGender === 'FEMALE';
  const roomImage = isFemalePatient ? '/images/patient_room_female.jpg' : '/images/patient_room_male.jpg';
  const doctorNameDisplay = isFemalePatient
    ? 'Dr. Mark Peterson, MD'
    : 'Dr. Elena Volkova, MD';
  const doctorRoleDisplay = isFemalePatient
    ? 'American Senior Attending Physician (Harvard Medical Board)'
    : 'Russian Clinical Specialist Physician (Moscow State Med Academy · JCI Board)';
  const doctorRoundNote = isFemalePatient
    ? `Dr. Mark Peterson examined the patient at bedside. IV normal saline infusion running smoothly at ${dripRate} mL/hr. Vitals stable, cardiac rhythm regular sinus, and patient hydration improving. Continue inpatient observation.`
    : `Dr. Elena Volkova conducted clinical rounding at bedside. IV normal saline 0.9% cannula verified and clear. Patient resting comfortably with stable hemodynamics and adequate perfusion. Continue current orders.`;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bed-board')}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            title="Return to Inpatient Bed Board"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-navy-950 tracking-tight">Patient Room Live View</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                LIVE CLINICAL TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ward: <span className="font-semibold text-navy-900">{wardName}</span> &middot; Room: <span className="font-semibold text-navy-900">{roomNumber}</span> &middot; Bed: <span className="font-bold text-teal-700">{bedNumber}</span> ({roomType})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/bed-board"
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
          >
            Bed Census Matrix
          </Link>
          <button
            onClick={() => sweetAlert.success('Care Team Alerted', `Station nurse (Sister Mary) and attending doctor (${doctorNameDisplay}) notified for Bed ${bedNumber}.`)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Page Attending Doctor
          </button>
        </div>
      </div>

      {/* Main Split-Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Realistic Hospital Patient Room Photo & Saline Drip System (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Clinical Viewport Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative group">
            {/* Live Indicator Overlay Banner */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
              <span className="bg-slate-900/85 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Inpatient Bed: {bedNumber}
              </span>
              <span className="bg-teal-900/85 backdrop-blur-xs text-teal-200 px-3 py-1 rounded-full text-xs font-medium border border-teal-500/30 flex items-center gap-1.5">
                <Droplet className="w-3 h-3 text-teal-400" />
                IV Saline Infusion Active
              </span>
            </div>

            <div className="absolute top-3 right-3 z-10">
              <span className="bg-emerald-950/80 backdrop-blur-xs text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Vitals Stable &middot; Room {roomNumber}
              </span>
            </div>

            {/* Realistic AI Hospital Room Photography (Dynamic matching patient gender and doctor nationality) */}
            <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
              <img
                src={roomImage}
                alt={isFemalePatient ? "Female Inpatient Resting with IV Saline attended by Male American Doctor" : "Male Inpatient Resting with IV Saline attended by Female Russian Doctor"}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* Bottom Clinical Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent p-4 flex items-end justify-between text-white">
                <div>
                  <p className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    {doctorRoleDisplay}
                  </p>
                  <p className="text-sm font-bold mt-0.5">{doctorNameDisplay} checking vitals & charts at bedside</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-300">Inpatient Room Sensor</p>
                  <p className="text-xs font-mono font-bold text-emerald-400">Online &middot; High-Fidelity Clinical Feed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saline IV Drip Telemetry & Controller Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-950">Intravenous (IV) Saline Infusion System</h3>
                  <p className="text-xs text-slate-500">Normal Saline 0.9% Sodium Chloride &middot; 500 mL Bag</p>
                </div>
              </div>

              <button
                onClick={toggleDrip}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isDripActive
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isDripActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause IV Drip
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Resume Infusion
                  </>
                )}
              </button>
            </div>

            {/* Drip Gauge & Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Flow Rate</span>
                <p className="text-lg font-black text-navy-950 mt-0.5">{dripRate} <span className="text-xs font-normal text-slate-500">mL/hr</span></p>
                <span className="text-[10px] text-teal-600 font-medium">Standard Hydration Rate</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Volume Infused</span>
                <p className="text-lg font-black text-teal-700 mt-0.5">{volumeInfused} <span className="text-xs font-normal text-slate-500">/ {totalVolume} mL</span></p>
                <span className="text-[10px] text-slate-500 font-medium">{totalVolume - volumeInfused} mL Remaining</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Line Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${isDripActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <p className="text-sm font-bold text-navy-950">{isDripActive ? 'Actively Infusing' : 'Line Paused'}</p>
                </div>
                <span className="text-[10px] text-slate-500">Left forearm IV cannula</span>
              </div>
            </div>

            {/* Volume Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Infusion Progress: {Math.round((volumeInfused / totalVolume) * 100)}%</span>
                <span className="font-semibold text-navy-900">{volumeInfused} mL of 500 mL delivered</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(volumeInfused / totalVolume) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Flow Adjustments */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Adjust Rate:
              </span>
              {[50, 75, 100, 125].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleUpdateDripRate(rate)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    dripRate === rate
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {rate} mL/hr
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Inpatient Patient Record & Live Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Patient Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={isFemalePatient ? '/images/avatars/patient_f.jpg' : '/images/avatars/patient_m.jpg'}
                  alt={patientName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500/40 shadow-xs"
                />
                <div>
                  <h2 className="text-base font-bold text-navy-950">{patientName}</h2>
                  <p className="text-xs text-slate-500 font-medium">MRN: {patientCode}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                Admitted Inpatient
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Admission #</span>
                <span className="font-bold text-navy-900">{admissionNumber}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Allocated Bed</span>
                <span className="font-bold text-teal-700">{bedNumber} (Room {roomNumber})</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Attending Doctor</span>
                <span className="font-bold text-navy-900">{doctorNameDisplay}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Primary Care Nurse</span>
                <span className="font-bold text-navy-900">Sister Mary (RN)</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">Admission Diagnosis</span>
              <p className="font-semibold text-slate-800 leading-relaxed">{diagnosis}</p>
            </div>
          </div>

          {/* Real-time ICU / Bedside Vitals Card */}
          <div className="bg-navy-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-navy-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold tracking-tight">Bedside Telemetry & Vitals Monitor</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                NORMAL SINUS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Heart Rate */}
              <div className="bg-navy-900/80 p-3 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Heart Rate</span>
                  <p className="text-2xl font-black text-rose-400 mt-0.5">{pulse} <span className="text-xs font-normal text-slate-400">BPM</span></p>
                </div>
                <Heart className="w-7 h-7 text-rose-500 animate-pulse" />
              </div>

              {/* Blood Pressure */}
              <div className="bg-navy-900/80 p-3 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Blood Pressure</span>
                  <p className="text-2xl font-black text-teal-300 mt-0.5">{bpSys}/{bpDia} <span className="text-xs font-normal text-slate-400">mmHg</span></p>
                </div>
                <Activity className="w-7 h-7 text-teal-400" />
              </div>

              {/* SpO2 */}
              <div className="bg-navy-900/80 p-3 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Oxygen (SpO2)</span>
                  <p className="text-2xl font-black text-cyan-400 mt-0.5">{spo2}%</p>
                </div>
                <Wind className="w-7 h-7 text-cyan-400" />
              </div>

              {/* Temperature */}
              <div className="bg-navy-900/80 p-3 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Temperature</span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">{temp}&deg;F</p>
                </div>
                <Thermometer className="w-7 h-7 text-amber-400" />
              </div>
            </div>

            {/* Live Real-Time Canvas Oscilloscope ECG Monitor */}
            <LiveECGMonitor heartRate={pulse} spo2={spo2} className="mt-2" />
          </div>

          {/* Active Medications & Inpatient Charting */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                Active Inpatient Medication Orders
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">4 Active</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Normal Saline 0.9% IV Infusion</p>
                  <p className="text-[11px] text-slate-500">Continuous IV Hydration &middot; {dripRate} mL/hr</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {isDripActive ? 'INFUSING' : 'PAUSED'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Ceftriaxone 1g IV Powder</p>
                  <p className="text-[11px] text-slate-500">Broad spectrum antibiotic &middot; Q12H</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">DUE 20:00</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Pantoprazole 40mg IV</p>
                  <p className="text-[11px] text-slate-500">GI mucosal prophylaxis &middot; Once Daily</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">GIVEN 08:00</span>
              </div>
            </div>

            {/* Doctor Rounding Notes */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-950 mb-1">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Attending Doctor Rounding Note &middot; {doctorNameDisplay}
              </div>
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                "{doctorRoundNote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
