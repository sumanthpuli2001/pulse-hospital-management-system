// Common API wrappers
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// User & Authentication
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  gender?: string;
  roles: string[];
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  expiresInSeconds?: number;
  userId?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  roles?: string[];
  user?: User;
}

// Department & Doctor
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface DoctorSchedule {
  id: number;
  doctorId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxPatientsPerSlot: number;
  isActive: boolean;
}

export interface Doctor {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  departmentId: number;
  departmentName: string;
  licenseNumber: string;
  specialization: string;
  qualifications: string;
  consultationFee: number;
  roomNumber?: string;
  bio?: string;
  gender?: string;
  isAvailable: boolean;
  isActive: boolean;
  schedules?: DoctorSchedule[];
}

// Patient
export interface Patient {
  id: number;
  userId?: number;
  portalUsername?: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

// Appointment
export interface Appointment {
  id: number;
  appointmentNumber: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  doctorId: number;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  consultationNotes?: string;
}

// EMR
export interface VitalSign {
  id: number;
  patientId: number;
  recordedByUserName?: string;
  recordedAt: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  notes?: string;
}

export interface Allergy {
  id: number;
  patientId: number;
  allergenName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  reaction?: string;
  diagnosedDate?: string;
}

export interface Diagnosis {
  id: number;
  medicalRecordId: number;
  icdCode: string;
  description: string;
  diagnosisType: 'PRIMARY' | 'SECONDARY' | 'PROVISIONAL' | 'CONFIRMED';
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  encounterDate: string;
  chiefComplaint: string;
  physicalExamination?: string;
  assessmentAndPlan?: string;
  vitals?: VitalSign;
  diagnoses?: Diagnosis[];
  allergies?: Allergy[];
  createdAt: string;
}

// Prescription
export interface PrescriptionItem {
  id: number;
  medicineId?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number;
  quantity: number;
  instructions?: string;
  dispensedQuantity?: number;
  dispensed: boolean;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  doctorId: number;
  doctorName: string;
  departmentName?: string;
  issueDate: string;
  status: 'ACTIVE' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'CANCELLED';
  clinicalNotes?: string;
  items: PrescriptionItem[];
  createdAt: string;
}

// Laboratory
export interface LabTest {
  id: number;
  testCode: string;
  testName: string;
  category: string;
  sampleType?: string;
  standardTurnaroundHours: number;
  cost: number;
  referenceRanges?: string;
  active: boolean;
}

export interface LabResult {
  id: number;
  parameterName: string;
  resultValue: string;
  referenceRange?: string;
  unit?: string;
  abnormal: boolean;
  remarks?: string;
  performedByUserName?: string;
  verifiedByUserName?: string;
  verifiedAt?: string;
}

export interface LabOrderItem {
  id: number;
  testId: number;
  testCode: string;
  testName: string;
  category: string;
  sampleType?: string;
  status: 'PENDING' | 'SAMPLE_COLLECTED' | 'IN_ANALYSIS' | 'COMPLETED' | 'CANCELLED';
  sampleBarcode?: string;
  collectedAt?: string;
  collectedByUserName?: string;
  price: number;
  results?: LabResult[];
}

export interface LabOrder {
  id: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  doctorId: number;
  doctorName: string;
  appointmentId?: number;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  clinicalIndications?: string;
  orderDate: string;
  items: LabOrderItem[];
}

// Pharmacy & Inventory
export interface MedicineBatch {
  id: number;
  medicineId: number;
  medicineName?: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantityInStock: number;
  unitCost: number;
  supplierName?: string;
  active: boolean;
  expired: boolean;
  expiringSoon: boolean;
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  totalStock?: number;
  lowStock?: boolean;
  requiresPrescription: boolean;
  active: boolean;
  batches?: MedicineBatch[];
}

export interface InventoryTransaction {
  id: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  transactionType: string;
  quantity: number;
  unitPrice: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  performedByUserName?: string;
  createdAt: string;
}

// Inpatient & Bed Board
export interface Ward {
  id: number;
  name: string;
  wardType: string;
  departmentId?: number;
  departmentName?: string;
  floorNumber: number;
  capacity: number;
  active: boolean;
}

export interface Room {
  id: number;
  wardId: number;
  wardName?: string;
  roomNumber: string;
  roomType: string;
  dailyRate: number;
  active: boolean;
}

export interface Bed {
  id: number;
  roomId: number;
  roomNumber?: string;
  roomType?: string;
  wardName?: string;
  dailyRate?: number;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  active: boolean;
}

export interface BedAllocation {
  id: number;
  admissionId: number;
  bedId: number;
  bedNumber: string;
  roomNumber?: string;
  wardName?: string;
  allocatedFrom: string;
  allocatedTo?: string;
  dailyCharge: number;
  status: 'ACTIVE' | 'TRANSFERRED' | 'RELEASED';
  notes?: string;
}

export interface Admission {
  id: number;
  admissionNumber: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  admittingDoctorId: number;
  doctorName: string;
  departmentName?: string;
  admissionDate: string;
  dischargeDate?: string;
  admissionReason: string;
  status: 'ADMITTED' | 'DISCHARGED' | 'CANCELLED';
  dischargeSummary?: string;
  currentBed?: Bed;
  bedAllocations?: BedAllocation[];
}

export interface BedBoardItem {
  bedId: number;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  roomId: number;
  roomNumber: string;
  roomType: string;
  dailyRate: number;
  wardId: number;
  wardName: string;
  wardType: string;
  floorNumber: number;
  currentAdmissionId?: number;
  currentAdmissionNumber?: string;
  currentPatientId?: number;
  currentPatientName?: string;
  currentPatientCode?: string;
}

// Billing
export interface InvoiceItem {
  id: number;
  invoiceId: number;
  itemType: string;
  itemReferenceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber?: string;
  patientId: number;
  patientName?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionReference?: string;
  notes?: string;
  receivedByUserName?: string;
  status: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  patientCode: string;
  admissionId?: number;
  admissionNumber?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  notes?: string;
  createdByUserName?: string;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

// Reports
export interface HospitalCensusReport {
  totalPatients: number;
  totalDoctors: number;
  availableDoctors: number;
  todayAppointments: number;
  activeInpatients: number;
  totalBeds: number;
  occupiedBeds: number;
  bedOccupancyPercentage: number;
  pendingLabOrders: number;
  lowStockMedicines: number;
  todayRevenue: number;
  totalOutstandingBalance: number;
}

export interface RevenueReport {
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
  totalInvoices: number;
  paidInvoices: number;
  partiallyPaidInvoices: number;
  issuedInvoices: number;
}

export interface BedOccupancyReport {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  occupancyRatePercentage: number;
  bedsByWard: Record<string, number>;
  occupiedBedsByWard: Record<string, number>;
}

export interface DoctorWorkloadReport {
  doctorId: number;
  doctorName: string;
  departmentName: string;
  totalAppointments: number;
  completedAppointments: number;
  activeInpatients: number;
}

// Audit Log
export interface AuditLog {
  id: number;
  userId?: number;
  username: string;
  action: string;
  resourceName: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}
