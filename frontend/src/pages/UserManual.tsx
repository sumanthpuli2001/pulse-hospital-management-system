import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import {
  BookOpen,
  ShieldCheck,
  Building2,
  Bed,
  FlaskConical,
  Package,
  CreditCard,
  Activity,
  UserCheck,
  Users,
  Calendar,
  Pill,
  HeartHandshake,
  FileText,
  ShieldAlert,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

interface ManualSection {
  pageName: string;
  route: string;
  icon: any;
  purpose: string;
  buttonsAndWorkflows: {
    buttonLabel: string;
    buttonColor: string;
    triggersWhat: string;
    inputFields: { field: string; type: string; required: boolean; instructions: string; example: string }[];
    submitButton: string;
    subsequentWorkflow: string;
  }[];
  tableInteractions?: string[];
  keyValidations: string[];
}

interface RoleManual {
  roleKey: string;
  roleTitle: string;
  targetAudience: string;
  credentials: string;
  responsibilities: string[];
  sections: ManualSection[];
}

export const UserManual: React.FC = () => {
  const { user } = useAuth();
  const primaryRole = user?.roles?.[0] || 'ROLE_SUPER_ADMIN';
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const isHospitalAdmin = user?.roles?.includes('ROLE_HOSPITAL_ADMIN');
  const canSwitchRole = isSuperAdmin || isHospitalAdmin;

  // Initial role selection based on user
  const getDefaultRoleKey = () => {
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'SUPER_ADMIN';
    if (user?.roles?.includes('ROLE_HOSPITAL_ADMIN')) return 'HOSPITAL_ADMIN';
    if (user?.roles?.includes('ROLE_DOCTOR')) return 'DOCTOR';
    if (user?.roles?.includes('ROLE_NURSE')) return 'NURSE';
    if (user?.roles?.includes('ROLE_PHARMACIST')) return 'PHARMACIST';
    if (user?.roles?.includes('ROLE_LAB_TECHNICIAN')) return 'LAB_TECHNICIAN';
    if (user?.roles?.includes('ROLE_ACCOUNTANT')) return 'ACCOUNTANT';
    if (user?.roles?.includes('ROLE_RECEPTIONIST')) return 'RECEPTIONIST';
    if (user?.roles?.includes('ROLE_PATIENT')) return 'PATIENT';
    return 'SUPER_ADMIN';
  };

  const [selectedRole, setSelectedRole] = useState<string>(getDefaultRoleKey());

  const manuals: Record<string, RoleManual> = {
    SUPER_ADMIN: {
      roleKey: 'SUPER_ADMIN',
      roleTitle: 'Super Administrator Master Operating Manual',
      targetAudience: 'Chief Information Officer, System Administrators & Enterprise DevOps',
      credentials: 'Username: superadmin | Default Password: Password@123',
      responsibilities: [
        'Complete administrative authority across clinical, financial, and diagnostic modules',
        'Master data configuration for departments, inpatient wards, lab catalog, and medicine formulary',
        'Staff credential provisioning and doctor duty scheduling',
        'Tamper-evident HIPAA audit log surveillance and compliance monitoring',
        'Financial revenue settlement oversight and fiscal year reporting'
      ],
      sections: [
        {
          pageName: 'Enterprise Operational Dashboard',
          route: '/dashboard',
          icon: Activity,
          purpose: 'Executive overview of hospital bed occupancy, real-time revenue in ₹, active consults, and department health.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Register New Patient',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens the Patient Intake modal on the Patients registry screen.',
              inputFields: [
                { field: 'First & Last Name', type: 'Text', required: true, instructions: 'Legal name of patient', example: 'Aarav Sharma' },
                { field: 'Date of Birth & Gender', type: 'Date & Select', required: true, instructions: 'Select date and gender (Male/Female/Other)', example: '1990-05-14 / Male' },
                { field: 'Contact Phone', type: 'Text (10 digits)', required: true, instructions: '10-digit Indian mobile number', example: '9876543210' },
                { field: 'Blood Group', type: 'Select', required: false, instructions: 'Clinical ABO blood group with Rh factor', example: 'O+' },
                { field: 'Street Address & City', type: 'Text', required: true, instructions: 'Permanent residential address', example: '45 MG Road, Bangalore' },
                { field: 'Emergency Contact & Phone', type: 'Text', required: true, instructions: 'Next of kin name and mobile', example: 'Sunita Sharma (9876543211)' }
              ],
              submitButton: 'Click "Save Patient Record"',
              subsequentWorkflow: 'Patient is allocated unique PAT-2026-XXXX MRN number and patient portal account is generated automatically with Password@123.'
            },
            {
              buttonLabel: '+ Schedule Appointment',
              buttonColor: 'bg-blue-600',
              triggersWhat: 'Opens appointment booking modal.',
              inputFields: [
                { field: 'Patient Selection', type: 'Select', required: true, instructions: 'Select registered patient from searchable dropdown', example: 'Aarav Sharma (PAT-2026-0001)' },
                { field: 'Department & Doctor', type: 'Select', required: true, instructions: 'Select clinical specialty and active consulting physician', example: 'Cardiology -> Dr. Rajesh Varma' },
                { field: 'Appointment Date', type: 'Date picker', required: true, instructions: 'Select consultation date (weekdays)', example: '2026-10-18' },
                { field: 'Time Slot', type: 'Select', required: true, instructions: 'Select available slot (15/30 min intervals)', example: '09:00 - 09:30 AM' },
                { field: 'Chief Complaint', type: 'Textarea', required: true, instructions: 'Primary symptoms or reason for visit', example: 'Persistent chest discomfort and palpitations' }
              ],
              submitButton: 'Click "Confirm Appointment"',
              subsequentWorkflow: 'Slot is locked, collision detection validates no overlapping bookings exist, and appointment routes to Doctor Consultation queue.'
            },
            {
              buttonLabel: '+ Add Inpatient Ward',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Inpatient Ward Configuration modal.',
              inputFields: [
                { field: 'Ward Name', type: 'Text', required: true, instructions: 'Name of the inpatient clinical care unit', example: 'Cardiac Intensive Care Unit 2' },
                { field: 'Ward Type', type: 'Select', required: true, instructions: 'Select ICU, GENERAL, DELUXE, PEDIATRIC, or EMERGENCY', example: 'ICU' },
                { field: 'Floor Number', type: 'Number', required: true, instructions: 'Building floor location (1-10)', example: '3' },
                { field: 'Ward Capacity (Beds)', type: 'Number', required: true, instructions: 'Total bed allocation capacity (min 1)', example: '20' },
                { field: 'Base Daily Bed Rate (₹)', type: 'Number', required: true, instructions: 'Base per-day room charge in ₹', example: '1500.00' }
              ],
              submitButton: 'Click "Save Ward"',
              subsequentWorkflow: 'Ward is immediately provisioned in MySQL database and activated across Inpatient Bed Board for doctor/nurse admissions.'
            }
          ],
          tableInteractions: [
            'Click on any metric card (Total Beds, Active Consultations, Pharmacy Revenue) to drill directly into corresponding modules.',
            'Review Live Activity Feed in right-hand drawer for real-time patient admissions, prescription issuances, and payments.'
          ],
          keyValidations: [
            'Appointments block bookings outside doctor duty rosters.',
            'Revenue calculation strictly formats decimal-safe ₹ without rounding discrepancies.'
          ]
        },
        {
          pageName: 'Master Data Configuration Hub',
          route: '/master-data',
          icon: Building2,
          purpose: 'Centralized hospital configuration for clinical departments, inpatient wards, pathology test catalogs, and pharmacy medicines formulary.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Add Department',
              buttonColor: 'bg-teal-500',
              triggersWhat: 'Opens Department modal.',
              inputFields: [
                { field: 'Department Name', type: 'Text', required: true, instructions: 'Specialty unit name', example: 'Nephrology & Renal Transplant' },
                { field: 'Department Code', type: 'Text (2-20 chars)', required: true, instructions: 'Uppercase unique alphanumeric code', example: 'NEPH' },
                { field: 'Clinical Scope', type: 'Textarea', required: false, instructions: 'Description of clinical services offered', example: 'Comprehensive renal care, dialysis, and transplant follow-up' },
                { field: 'Active Checkbox', type: 'Checkbox', required: false, instructions: 'Check to enable admissions and doctor scheduling', example: 'Checked (Active)' }
              ],
              submitButton: 'Click "Create Department" or "Update Department"',
              subsequentWorkflow: 'Department becomes available for doctor rosters, bed allocations, and OPD appointments.'
            },
            {
              buttonLabel: '+ Add Lab Test',
              buttonColor: 'bg-teal-500',
              triggersWhat: 'Opens Add Diagnostic Laboratory Test modal.',
              inputFields: [
                { field: 'Test Name', type: 'Text', required: true, instructions: 'Official diagnostic test name', example: 'High-Sensitivity Troponin-I' },
                { field: 'Test Code', type: 'Text', required: true, instructions: 'Laboratory catalog test code', example: 'TROP-I' },
                { field: 'Category', type: 'Select', required: true, instructions: 'Select BIOCHEMISTRY, HEMATOLOGY, IMMUNOLOGY, MICROBIOLOGY, or RADIOLOGY', example: 'BIOCHEMISTRY' },
                { field: 'Sample Type', type: 'Text', required: true, instructions: 'Specimen type required for test', example: 'Serum / Heparin Plasma' },
                { field: 'Price (₹)', type: 'Number', required: true, instructions: 'Standard billing price in ₹', example: '750.00' },
                { field: 'Normal Reference Range', type: 'Text', required: false, instructions: 'Clinical diagnostic range', example: '< 0.04 ng/mL' }
              ],
              submitButton: 'Click "Add to Catalog"',
              subsequentWorkflow: 'Test is instantly bookable by doctors during OPD consultations and visible on the Diagnostic Lab worklist.'
            },
            {
              buttonLabel: '+ Add Medicine',
              buttonColor: 'bg-teal-500',
              triggersWhat: 'Opens Formulary Medicine modal.',
              inputFields: [
                { field: 'Brand Name', type: 'Text', required: true, instructions: 'Commercial brand name', example: 'Augmentin 625 Duo' },
                { field: 'Generic Chemical Name', type: 'Text', required: true, instructions: 'Pharmacological composition', example: 'Amoxicillin 500mg + Clavulanic Acid 125mg' },
                { field: 'Category', type: 'Text', required: true, instructions: 'Therapeutic classification', example: 'Antibiotic' },
                { field: 'Dosage Form', type: 'Select', required: true, instructions: 'Select TABLET, CAPSULE, SYRUP, INJECTION, or OINTMENT', example: 'TABLET' },
                { field: 'Strength', type: 'Text', required: true, instructions: 'Dosage strength', example: '625mg' },
                { field: 'Unit Price (₹)', type: 'Number', required: true, instructions: 'MRP selling price per unit in ₹', example: '22.50' },
                { field: 'Reorder Level', type: 'Number', required: true, instructions: 'Minimum threshold before low-stock warning triggers', example: '100' }
              ],
              submitButton: 'Click "Add Medicine"',
              subsequentWorkflow: 'Formulary medicine is added with auto-generated SKU and cost price, ready for batch receiving and prescription dispensing.'
            }
          ],
          tableInteractions: [
            'Click Edit (pencil icon) on any Department to update name, description, or toggle active/inactive status.',
            'Click Deactivate (trash icon) to safely soft-delete a department without breaking past historical medical records.'
          ],
          keyValidations: [
            'Duplicate department codes, test codes, and medicine SKUs are strictly rejected by the backend.',
            'Validation failures display specific field errors in real time directly within the modal alert box.'
          ]
        },
        {
          pageName: 'Audit Logs & Security Compliance Hub',
          route: '/audit',
          icon: ShieldAlert,
          purpose: 'Immutable audit trail capturing all user actions, logins, clinical modifications, prescription edits, and bill settlements for regulatory compliance.',
          buttonsAndWorkflows: [
            {
              buttonLabel: 'Filter by Action / Module',
              buttonColor: 'bg-slate-200',
              triggersWhat: 'Filters audit stream by CREATE, UPDATE, DELETE, LOGIN, or DISPENSE.',
              inputFields: [
                { field: 'Module Selector', type: 'Select', required: false, instructions: 'Filter by PATIENT, PRESCRIPTION, BILLING, PHARMACY, or SECURITY', example: 'PRESCRIPTION' },
                { field: 'Date Range', type: 'Date pickers', required: false, instructions: 'Start and end timestamp filters', example: 'Past 7 Days' }
              ],
              submitButton: 'Real-time filtering as parameters change',
              subsequentWorkflow: 'Displays client IP, timestamp, user ID, HTTP status code, and detailed payload changes.'
            }
          ],
          keyValidations: [
            'Audit records are append-only; deletion or modification is cryptographically blocked at the database engine level.'
          ]
        }
      ]
    },

    HOSPITAL_ADMIN: {
      roleKey: 'HOSPITAL_ADMIN',
      roleTitle: 'Hospital Administrator Operating Manual',
      targetAudience: 'Hospital Operations Managers, Medical Superintendents & Unit Heads',
      credentials: 'Username: admin | Default Password: Password@123',
      responsibilities: [
        'Supervising day-to-day OPD and IPD clinical operational workflows',
        'Configuring doctor roster schedules and consultation slots',
        'Managing patient bed allocations, ward transfers, and clinical discharges',
        'Monitoring hospital pharmacy stock levels and laboratory throughput'
      ],
      sections: [
        {
          pageName: 'Doctors & Scheduling Hub',
          route: '/doctors',
          icon: UserCheck,
          purpose: 'Manage active medical staff, assign clinical specialties, and configure doctor weekly consultation schedules.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Add Specialist Doctor',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Doctor Onboarding modal.',
              inputFields: [
                { field: 'First & Last Name', type: 'Text', required: true, instructions: 'Doctor full name', example: 'Dr. Priya Sundaram' },
                { field: 'Specialization', type: 'Text', required: true, instructions: 'Clinical specialization', example: 'Neurology' },
                { field: 'Department', type: 'Select', required: true, instructions: 'Assigned hospital department', example: 'Neurology' },
                { field: 'Medical License Number', type: 'Text', required: true, instructions: 'MCI / State Medical Council Registration', example: 'MCI-2024-8849' },
                { field: 'Consultation Fee (₹)', type: 'Number', required: true, instructions: 'OPD consultation charge in ₹', example: '600.00' },
                { field: 'Contact Email & Phone', type: 'Email & Phone', required: true, instructions: 'Official contact details', example: 'priya.s@hospital.com / 9876543220' }
              ],
              submitButton: 'Click "Save Doctor Profile"',
              subsequentWorkflow: 'Doctor profile is provisioned and ready for weekly slot scheduling.'
            },
            {
              buttonLabel: 'Manage Weekly Schedule',
              buttonColor: 'bg-blue-600',
              triggersWhat: 'Opens weekly schedule slot configuration modal.',
              inputFields: [
                { field: 'Day of Week', type: 'Select', required: true, instructions: 'Select Monday through Saturday', example: 'Monday' },
                { field: 'Start Time & End Time', type: 'Time', required: true, instructions: 'OPD duty shift hours', example: '09:00 AM - 01:00 PM' },
                { field: 'Slot Duration', type: 'Select', required: true, instructions: '15 min or 30 min per appointment', example: '30 Minutes' }
              ],
              submitButton: 'Click "Save Duty Schedule"',
              subsequentWorkflow: 'Generates OPD appointment slots for receptionists and online patient portal bookings.'
            }
          ],
          keyValidations: [
            'Overlapping duty slots for the same doctor are blocked with clear conflict messages.',
            'Consultation fee cannot be negative.'
          ]
        }
      ]
    },

    DOCTOR: {
      roleKey: 'DOCTOR',
      roleTitle: 'Specialist Physician & Clinical OPD Manual',
      targetAudience: 'Consulting Physicians, Surgeons, Residents, and Medical Officers',
      credentials: 'Username: dr.rajesh | Default Password: Password@123',
      responsibilities: [
        'Reviewing daily OPD appointment rosters and patient medical records',
        'Authoring digital E-Prescriptions with structured dosages and instructions',
        'Ordering diagnostic laboratory investigations (CBC, Lipid, Troponin, etc.)',
        'Documenting clinical soap notes, vitals, diagnosis, and treatment plans',
        'Authorizing inpatient admissions to ICU, General, or Deluxe wards'
      ],
      sections: [
        {
          pageName: 'Appointments & OPD Consultation Queue',
          route: '/appointments',
          icon: Calendar,
          purpose: 'Track scheduled patient consults, review patient history, and start consultations.',
          buttonsAndWorkflows: [
            {
              buttonLabel: 'Start Consultation',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens patient clinical consultation session and updates appointment status to IN_PROGRESS.',
              inputFields: [
                { field: 'Chief Complaints', type: 'Textarea', required: true, instructions: 'Symptom description from patient', example: 'Acute headache, dizziness, BP 150/95' },
                { field: 'Clinical Diagnosis', type: 'Text', required: true, instructions: 'Provisional or confirmed medical diagnosis', example: 'Essential Hypertension Stage 1' }
              ],
              submitButton: 'Click "Complete Consultation"',
              subsequentWorkflow: 'Appointment status marks COMPLETED, enabling prescription authoring and invoice settlement.'
            }
          ],
          keyValidations: ['Cannot complete appointment without a verified clinical diagnosis.']
        },
        {
          pageName: 'E-Prescriptions Hub',
          route: '/prescriptions',
          icon: Pill,
          purpose: 'Author digital, drug-interaction-checked prescriptions that instantly route to the Central Pharmacy.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Issue Prescription',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Digital Prescription authoring modal.',
              inputFields: [
                { field: 'Patient', type: 'Select', required: true, instructions: 'Select patient under consultation', example: 'Aarav Sharma (PAT-2026-0001)' },
                { field: 'Medicine Selection', type: 'Select', required: true, instructions: 'Choose formulary medication', example: 'Augmentin 625 Duo (TABLET)' },
                { field: 'Dosage & Frequency', type: 'Text & Select', required: true, instructions: 'Specify quantity and timing', example: '1 Tablet / Twice daily (BD)' },
                { field: 'Duration (Days)', type: 'Number', required: true, instructions: 'Treatment duration', example: '5 Days' },
                { field: 'Clinical Instructions', type: 'Text', required: false, instructions: 'Special patient instructions', example: 'Take with warm water after meals' }
              ],
              submitButton: 'Click "Issue Prescription"',
              subsequentWorkflow: 'Prescription routes immediately to Central Pharmacy worklist with status PENDING_DISPENSE.'
            }
          ],
          keyValidations: [
            'Medications must be selected from active hospital formulary.',
            'Duration must be at least 1 day.'
          ]
        },
        {
          pageName: 'Laboratory Diagnostic Orders',
          route: '/laboratory',
          icon: FlaskConical,
          purpose: 'Order pathology tests and review quantitative diagnostic findings.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Create Lab Order',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Laboratory Investigation Request modal.',
              inputFields: [
                { field: 'Patient', type: 'Select', required: true, instructions: 'Select patient', example: 'Aarav Sharma (PAT-2026-0001)' },
                { field: 'Test Profiles', type: 'Multi-Select', required: true, instructions: 'Check required diagnostic tests', example: 'Complete Blood Count (CBC) + Lipid Profile' },
                { field: 'Clinical Urgency', type: 'Select', required: true, instructions: 'ROUTINE, URGENT, or STAT (Immediate)', example: 'ROUTINE' },
                { field: 'Doctor Notes', type: 'Text', required: false, instructions: 'Clinical notes for laboratory technician', example: 'Rule out severe bacterial infection' }
              ],
              submitButton: 'Click "Place Order"',
              subsequentWorkflow: 'Generates barcode tracking number and queues order in Diagnostic Laboratory for specimen collection.'
            }
          ],
          keyValidations: ['At least one valid laboratory test must be selected.']
        }
      ]
    },

    NURSE: {
      roleKey: 'NURSE',
      roleTitle: 'Inpatient Ward Nurse & Telemetry Operations Manual',
      targetAudience: 'Registered Nurses, Ward Supervisors & Critical Care Nursing Staff',
      credentials: 'Username: nurse | Default Password: Password@123',
      responsibilities: [
        'Managing inpatient ward bed board and patient room telemetry',
        'Executing inpatient admissions, transfers, and discharge vitals checks',
        'Adjusting IV saline drip rates and administering scheduled medications',
        'Conducting bedside clinical check-ins and updating nursing handover notes'
      ],
      sections: [
        {
          pageName: 'Inpatient Bed Board & Ward Telemetry',
          route: '/bed-board',
          icon: Bed,
          purpose: 'Real-time interactive matrix of ICU, General, Deluxe, and Pediatric beds across all hospital floors.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Admit Patient to Bed',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Inpatient Bed Admission modal.',
              inputFields: [
                { field: 'Patient Selection', type: 'Select', required: true, instructions: 'Search and select registered patient', example: 'Arjun Sharma' },
                { field: 'Target Bed', type: 'Select', required: true, instructions: 'Select available bed (e.g. ICU-101-A, GEN-201-B)', example: 'ICU Bed 101-A' },
                { field: 'Admitting Doctor', type: 'Select', required: true, instructions: 'Attending specialist physician', example: 'Dr. Rajesh Varma' },
                { field: 'Admission Diagnosis', type: 'Text', required: true, instructions: 'Primary medical condition requiring stay', example: 'Post-op observation, cardiac monitoring' }
              ],
              submitButton: 'Click "Admit Patient"',
              subsequentWorkflow: 'Bed status changes to OCCUPIED (solid teal) and patient room telemetry session initiates.'
            },
            {
              buttonLabel: 'Room View',
              buttonColor: 'bg-slate-100',
              triggersWhat: 'Opens Interactive Patient Room Telemetry interface for that bed.',
              inputFields: [],
              submitButton: 'N/A (Interactive screen)',
              subsequentWorkflow: 'Nurse can monitor live heart rate (BPM), SpO2, Blood Pressure, adjust IV saline drip rate (0-150 mL/hr), and click "Doctor Bedside Check-In".'
            },
            {
              buttonLabel: 'Discharge Patient',
              buttonColor: 'bg-rose-600',
              triggersWhat: 'Opens Patient Discharge Modal.',
              inputFields: [
                { field: 'Discharge Summary', type: 'Textarea', required: true, instructions: 'Clinical condition at discharge', example: 'Patient stable, vitals normal, wound healing well' },
                { field: 'Discharge Medication', type: 'Text', required: false, instructions: 'Take-home medication instructions', example: 'Paracetamol 500mg SOS' }
              ],
              submitButton: 'Click "Confirm Discharge"',
              subsequentWorkflow: 'Bed status updates to CLEANING / AVAILABLE and final inpatient room stay charges route to Billing.'
            }
          ],
          tableInteractions: [
            'Filter bed board by ward type: ALL, ICU, GENERAL, DELUXE, PEDIATRIC, or EMERGENCY.',
            'Beds color-coded: Emerald = Available, Rose = Occupied, Amber = Maintenance.'
          ],
          keyValidations: [
            'Cannot admit patient to a bed that is currently occupied.',
            'Admitting doctor ID is mandatory.'
          ]
        }
      ]
    },

    PHARMACIST: {
      roleKey: 'PHARMACIST',
      roleTitle: 'Central Pharmacy & Inventory Management Manual',
      targetAudience: 'Chief Pharmacists, Dispensing Chemists & Inventory Controllers',
      credentials: 'Username: pharmacist | Default Password: Password@123',
      responsibilities: [
        'Fulfilling and dispensing doctor E-prescriptions to patients',
        'Auditing medication batches using FEFO (First-Expired, First-Out) standards',
        'Receiving new pharmaceutical stock lots with manufacturer batch numbers and expiry dates',
        'Monitoring low-stock alerts and quarantine expired batches'
      ],
      sections: [
        {
          pageName: 'Pharmacy Inventory & Batch Control Hub',
          route: '/pharmacy',
          icon: Package,
          purpose: 'Manage formulary drug inventory, batch tracking, stock levels, and expiry alerts.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Receive Batch Lot',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Inward Batch Receiving modal.',
              inputFields: [
                { field: 'Medicine Selection', type: 'Select', required: true, instructions: 'Choose medicine from hospital formulary', example: 'Augmentin 625 Duo' },
                { field: 'Manufacturer Batch Number', type: 'Text', required: true, instructions: 'Supplier lot identifier', example: 'AUG-2026-B89' },
                { field: 'Quantity Received', type: 'Number', required: true, instructions: 'Number of units/tablets', example: '500' },
                { field: 'Purchase Cost Price (₹)', type: 'Number', required: true, instructions: 'Acquisition cost per unit in ₹', example: '14.50' },
                { field: 'Expiry Date', type: 'Date picker', required: true, instructions: 'Must be a future calendar date', example: '2027-12-31' },
                { field: 'Supplier Name', type: 'Text', required: false, instructions: 'Pharmaceutical distributor', example: 'GlaxoSmithKline Healthcare' }
              ],
              submitButton: 'Click "Receive Stock Lot"',
              subsequentWorkflow: 'Inventory balance increments, batch is indexed for FEFO dispensing, and audit log records stock receipt.'
            },
            {
              buttonLabel: 'Dispense Prescription',
              buttonColor: 'bg-emerald-600',
              triggersWhat: 'Executes dispensing from earliest expiry batch.',
              inputFields: [],
              submitButton: 'Click "Confirm Dispensing"',
              subsequentWorkflow: 'Decrements total stock, locks lot batch, updates prescription status to DISPENSED, and posts itemized drug cost to patient invoice.'
            }
          ],
          keyValidations: [
            'System blocks receiving any batch with an expiry date in the past.',
            'Dispensing automatically selects batches strictly on FEFO basis.'
          ]
        }
      ]
    },

    LAB_TECHNICIAN: {
      roleKey: 'LAB_TECHNICIAN',
      roleTitle: 'Diagnostic Pathology Laboratory Manual',
      targetAudience: 'Pathologists, Laboratory Technicians, Biochemists & Phlebotomists',
      credentials: 'Username: labtech | Default Password: Password@123',
      responsibilities: [
        'Receiving specimen barcodes and tracking diagnostic orders',
        'Running hematology, biochemistry, immunology, and microbiology assays',
        'Entering verified quantitative test results with clinical interpretations',
        'Dispatching finalized laboratory diagnostic reports to consulting doctors'
      ],
      sections: [
        {
          pageName: 'Laboratory Orders & Results Management',
          route: '/laboratory',
          icon: FlaskConical,
          purpose: 'Track pending diagnostic orders, input quantitative assay results, and publish lab reports.',
          buttonsAndWorkflows: [
            {
              buttonLabel: 'Enter Results',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Quantitative Result Entry modal for selected order item.',
              inputFields: [
                { field: 'Result Value', type: 'Text / Number', required: true, instructions: 'Quantitative test value measured', example: '14.2' },
                { field: 'Unit of Measure', type: 'Text', required: true, instructions: 'Reporting unit (e.g. g/dL, mg/dL, %)', example: 'g/dL' },
                { field: 'Clinical Interpretation', type: 'Select', required: true, instructions: 'NORMAL, LOW, HIGH, or CRITICAL', example: 'NORMAL' },
                { field: 'Technician Remarks', type: 'Textarea', required: false, instructions: 'Any microscopic or clinical notes', example: 'Sample clear, no hemolysis observed' }
              ],
              submitButton: 'Click "Save & Verify Results"',
              subsequentWorkflow: 'Updates order status to COMPLETED, attaches results to patient EMR, and notifies consulting doctor.'
            }
          ],
          tableInteractions: [
            'Filter orders by status: PENDING, SAMPLE_COLLECTED, IN_PROGRESS, or COMPLETED.',
            'Click Print Report to generate patient pathology report card.'
          ],
          keyValidations: [
            'Result value is mandatory before marking order item as completed.'
          ]
        }
      ]
    },

    ACCOUNTANT: {
      roleKey: 'ACCOUNTANT',
      roleTitle: 'Hospital Billing, Ledgers & Revenue Clearance Manual',
      targetAudience: 'Chief Financial Officers, Billing Executives, Cashiers & Medical Insurance Officers',
      credentials: 'Username: accountant | Default Password: Password@123',
      responsibilities: [
        'Compiling itemized patient invoices (consultation, pharmacy, lab, inpatient room)',
        'Recording patient payments in Indian Rupees (₹) with split tender options',
        'Auditing daily collection ledgers and outstanding balances',
        'Generating print-ready GST-compliant medical receipts and discharge clearances'
      ],
      sections: [
        {
          pageName: 'Billing & Invoicing Ledger',
          route: '/billing',
          icon: CreditCard,
          purpose: 'Comprehensive financial dashboard managing invoices, payments, revenue metrics, and outstanding hospital balances in ₹.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Generate Invoice',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Itemized Invoice Creation modal.',
              inputFields: [
                { field: 'Patient Selection', type: 'Select', required: true, instructions: 'Choose patient for billing', example: 'Aarav Sharma (PAT-2026-0001)' },
                { field: 'Line Items', type: 'Table / Add Rows', required: true, instructions: 'Add service, description, unit price in ₹, quantity', example: 'Cardiology Consultation (₹600), Blood Test (₹450)' },
                { field: 'Tax (GST %)', type: 'Number', required: false, instructions: 'Applicable GST (0% for basic clinical)', example: '0' },
                { field: 'Discount (₹)', type: 'Number', required: false, instructions: 'Authorized hospital concession in ₹', example: '50.00' }
              ],
              submitButton: 'Click "Generate Invoice"',
              subsequentWorkflow: 'Generates INV-2026-XXXX record, sets status to PENDING/PARTIAL, and updates patient ledger.'
            },
            {
              buttonLabel: 'Record Payment',
              buttonColor: 'bg-emerald-600',
              triggersWhat: 'Opens Payment Settlement modal.',
              inputFields: [
                { field: 'Payment Amount (₹)', type: 'Number', required: true, instructions: 'Amount paid in ₹ (up to outstanding balance)', example: '1000.00' },
                { field: 'Payment Method', type: 'Select', required: true, instructions: 'CASH, UPI, CREDIT_CARD, DEBIT_CARD, or INSURANCE', example: 'UPI' },
                { field: 'Transaction Reference', type: 'Text', required: false, instructions: 'Bank reference / UPI UTR / Card approval code', example: 'UPI-REF-99201928' }
              ],
              submitButton: 'Click "Process Payment"',
              subsequentWorkflow: 'Generates payment receipt REC-2026-XXXX, decrements outstanding balance, and marks invoice as PAID when balance reaches ₹0.00.'
            }
          ],
          tableInteractions: [
            'Click Print Receipt on any paid invoice to generate a clean, thermal-ready hospital receipt.',
            'Filter invoices by status: ALL, PAID, PENDING, or OVERDUE.'
          ],
          keyValidations: [
            'Payment amount cannot exceed the pending invoice balance.',
            'All monetary transactions are currency-locked to Indian Rupees (₹).'
          ]
        }
      ]
    },

    RECEPTIONIST: {
      roleKey: 'RECEPTIONIST',
      roleTitle: 'Front-Desk Patient Intake & Appointment Scheduling Manual',
      targetAudience: 'Front Desk Officers, Patient Care Coordinators & Admission Desks',
      credentials: 'Username: receptionist | Default Password: Password@123',
      responsibilities: [
        'Registering new walk-in and emergency patients into Master Patient Index (MPI)',
        'Scheduling OPD consultation appointments with specialist doctors',
        'Issuing patient registration cards with MRN barcode PAT-2026-XXXX',
        'Directing patients to respective OPD consultation suites or diagnostic labs'
      ],
      sections: [
        {
          pageName: 'Patient Intake & MPI Registry',
          route: '/patients',
          icon: Users,
          purpose: 'Master Patient Index (MPI) containing registered demographic and emergency contact records.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Register Patient',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens Patient Registration modal.',
              inputFields: [
                { field: 'First & Last Name', type: 'Text', required: true, instructions: 'Official legal name', example: 'Rohan Mehra' },
                { field: 'Date of Birth', type: 'Date picker', required: true, instructions: 'Date of birth', example: '1985-11-20' },
                { field: 'Gender', type: 'Select', required: true, instructions: 'Male, Female, or Other', example: 'Male' },
                { field: 'Contact Phone', type: 'Text (10 digits)', required: true, instructions: '10-digit mobile number', example: '9123456780' },
                { field: 'Residential Address', type: 'Text', required: true, instructions: 'Full address and city', example: '12 Indiranagar, Bangalore' },
                { field: 'Emergency Contact', type: 'Text & Phone', required: true, instructions: 'Family member name & phone', example: 'Kavita Mehra (9123456781)' }
              ],
              submitButton: 'Click "Save Patient Record"',
              subsequentWorkflow: 'Patient is allocated unique PAT-2026-XXXX MRN number and credentials are generated for the online patient portal.'
            }
          ],
          keyValidations: [
            '10-digit phone number is strictly validated.',
            'Date of birth cannot be in the future.'
          ]
        },
        {
          pageName: 'Appointment Booking Desk',
          route: '/appointments',
          icon: Calendar,
          purpose: 'Book, reschedule, or cancel patient appointments across doctor schedules.',
          buttonsAndWorkflows: [
            {
              buttonLabel: '+ Schedule Appointment',
              buttonColor: 'bg-blue-600',
              triggersWhat: 'Opens appointment scheduling modal.',
              inputFields: [
                { field: 'Patient', type: 'Select', required: true, instructions: 'Choose registered patient', example: 'Rohan Mehra' },
                { field: 'Department & Doctor', type: 'Select', required: true, instructions: 'Select department and doctor', example: 'Cardiology -> Dr. Rajesh Varma' },
                { field: 'Date & Time Slot', type: 'Date & Select', required: true, instructions: 'Pick appointment date and open slot', example: '2026-10-19 at 10:00 AM' },
                { field: 'Reason for Visit', type: 'Textarea', required: true, instructions: 'Brief symptom explanation', example: 'Follow-up consultation for BP check' }
              ],
              submitButton: 'Click "Confirm Appointment"',
              subsequentWorkflow: 'Appointment slot is locked; collision detection blocks double bookings.'
            }
          ],
          keyValidations: ['Doctor collision detection blocks duplicate bookings for the same time slot.']
        }
      ]
    },

    PATIENT: {
      roleKey: 'PATIENT',
      roleTitle: 'Patient Self-Service Health Portal Guide',
      targetAudience: 'Registered Patients, Family Members & Caregivers',
      credentials: 'Username: patient1 (or unique PAT MRN) | Default Password: Password@123',
      responsibilities: [
        'Viewing personal health records, vitals, and doctor consultation notes',
        'Accessing digital prescriptions and medication schedules',
        'Reviewing and downloading laboratory diagnostic reports',
        'Checking billing balances and payment receipts in Indian Rupees (₹)'
      ],
      sections: [
        {
          pageName: 'My Health Portal Dashboard',
          route: '/portal',
          icon: HeartHandshake,
          purpose: 'Patient central dashboard showing medical records, upcoming appointments, prescriptions, and billing receipts.',
          buttonsAndWorkflows: [
            {
              buttonLabel: 'View Active Prescriptions',
              buttonColor: 'bg-teal-600',
              triggersWhat: 'Opens active digital prescriptions issued by consulting doctors.',
              inputFields: [],
              submitButton: 'N/A (Read-only view)',
              subsequentWorkflow: 'Displays medicine name, dosage instructions (e.g. 1 Tablet BD after meals), duration, and fulfillment status from Central Pharmacy.'
            },
            {
              buttonLabel: 'Download Lab Reports',
              buttonColor: 'bg-indigo-600',
              triggersWhat: 'Displays diagnostic test results (e.g. CBC, HbA1c, Lipid Profile).',
              inputFields: [],
              submitButton: 'N/A',
              subsequentWorkflow: 'Displays quantitative test findings, normal clinical reference ranges, and verified pathologist signature.'
            },
            {
              buttonLabel: 'View Invoices & Receipts',
              buttonColor: 'bg-emerald-600',
              triggersWhat: 'Opens patient financial ledger in ₹.',
              inputFields: [],
              submitButton: 'N/A',
              subsequentWorkflow: 'Shows itemized hospital expenses, past payments, and download link for official GST receipts.'
            }
          ],
          keyValidations: [
            'Patients have strictly read-only access to their own medical charts and cannot modify clinical data.'
          ]
        }
      ]
    }
  };

  const currentManual = manuals[selectedRole] || manuals.SUPER_ADMIN;

  return (
    <div className="space-y-6">
      {/* Printable Official Hospital SOP Header (Shows only on print) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                PULSE HOSPITAL MANAGEMENT SYSTEM
              </h1>
              <p className="text-xs font-semibold text-slate-700">
                Enterprise Clinical Standard Operating Procedure (SOP) & User Manual &middot; v2.0-PROD
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">CLASSIFICATION: ENTERPRISE RESTRICTED</p>
            <p>Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
          </div>
        </div>
      </div>

      {/* Compact Top Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-xl px-5 py-3 text-white shadow-sm border border-navy-800/80 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30 shrink-0">
            <BookOpen className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                Role-Based User Manual &amp; Step-by-Step SOP
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                Official Protocols
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Step-by-step operational protocols, action triggers, modal form inputs, and clinical workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selector Tabs (Visible to Admins or for Reference) */}
      {canSwitchRole && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto print:hidden">
          <span className="text-xs font-bold text-slate-600 px-3 whitespace-nowrap">
            Select Role Manual:
          </span>
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1">
            {Object.keys(manuals).map((rKey) => {
              const isSelected = selectedRole === rKey;
              return (
                <button
                  key={rKey}
                  onClick={() => setSelectedRole(rKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-navy-950 text-teal-300 shadow-xs border border-navy-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {rKey.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-100 text-teal-900 border border-teal-300">
                {currentManual.roleKey.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500">Security Clearance Level &middot; Tier 1</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {currentManual.roleTitle}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              <strong>Target Personnel:</strong> {currentManual.targetAudience}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 shrink-0">
            <span className="font-semibold block text-slate-900 mb-0.5">Authorized Credentials:</span>
            <code className="text-teal-800 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {currentManual.credentials}
            </code>
          </div>
        </div>

        {/* Primary Role Scope */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Authorized Scope &amp; Responsibilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {currentManual.responsibilities.map((resp, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page-by-Page Detailed Sections */}
      <div className="space-y-6">
        {currentManual.sections.map((section, sIdx) => {
          const SectionIcon = section.icon;
          return (
            <div
              key={sIdx}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:break-inside-avoid"
            >
              {/* Section Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                    <SectionIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {section.pageName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Route: {section.route}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  Step {sIdx + 1}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Module Purpose */}
                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl text-xs text-teal-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Module Operational Purpose: </strong> {section.purpose}
                  </p>
                </div>

                {/* Buttons and Detailed Workflow */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Module Buttons &amp; Action Specifications
                  </h4>

                  {section.buttonsAndWorkflows.map((bw, bIdx) => (
                    <div
                      key={bIdx}
                      className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 space-y-3.5 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-3 py-1 text-xs font-bold text-white rounded-lg shadow-2xs ${bw.buttonColor}`}>
                            {bw.buttonLabel}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Action Trigger
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          <strong>Triggers:</strong> {bw.triggersWhat}
                        </span>
                      </div>

                      {/* Input Specifications */}
                      {bw.inputFields.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-700 mb-2">
                            Modal Form Inputs &amp; Required Data Specifications:
                          </p>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                                <tr>
                                  <th className="p-2.5">Field Name</th>
                                  <th className="p-2.5">Input Type</th>
                                  <th className="p-2.5">Required?</th>
                                  <th className="p-2.5">Data Requirements</th>
                                  <th className="p-2.5">Example Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {bw.inputFields.map((field, fIdx) => (
                                  <tr key={fIdx} className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900">{field.field}</td>
                                    <td className="p-2.5 font-mono text-[11px] text-slate-600">{field.type}</td>
                                    <td className="p-2.5">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          field.required
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {field.required ? 'REQUIRED' : 'OPTIONAL'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-600">{field.instructions}</td>
                                    <td className="p-2.5 font-mono font-medium text-teal-800 bg-teal-50/50">
                                      {field.example}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Submission and Subsequent Workflow */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs">
                          <span className="font-bold text-slate-900 block mb-1">
                            Save / Submit Action:
                          </span>
                          <span className="font-semibold text-teal-700">
                            {bw.submitButton}
                          </span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs">
                          <span className="font-bold text-slate-900 block mb-1">
                            Cross-Departmental Next Step:
                          </span>
                          <span className="text-slate-700">
                            {bw.subsequentWorkflow}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Interactions & Key Validations */}
                {(section.tableInteractions || section.keyValidations) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    {section.tableInteractions && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Table Filters &amp; Screen Actions
                        </h5>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                          {section.tableInteractions.map((act, aIdx) => (
                            <li key={aIdx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.keyValidations && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                          Strict Business &amp; Clinical Validations
                        </h5>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                          {section.keyValidations.map((val, vIdx) => (
                            <li key={vIdx}>{val}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default UserManual;
