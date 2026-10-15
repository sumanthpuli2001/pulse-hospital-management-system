import axios from 'axios';
import {
  ApiResponse,
  PagedResponse,
  AuthResponse,
  User,
  Patient,
  Doctor,
  Department,
  Appointment,
  MedicalRecord,
  VitalSign,
  Allergy,
  Prescription,
  LabTest,
  LabOrder,
  LabResult,
  Medicine,
  MedicineBatch,
  Ward,
  BedBoardItem,
  Admission,
  Invoice,
  Payment,
  HospitalCensusReport,
  RevenueReport,
  BedOccupancyReport,
  DoctorWorkloadReport,
  AuditLog
} from '../types';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token & Normalize URL
api.interceptors.request.use(
  (config) => {
    // Prevent duplicate /api/v1 prefix if callers pass /api/v1/...
    if (config.url) {
      if (config.url.startsWith('/api/v1/')) {
        config.url = config.url.substring(7);
      } else if (config.url.startsWith('/api/v1')) {
        config.url = config.url.substring(7);
      }
    }

    const token = localStorage.getItem('hms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Automatic Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('hms_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh-token', {
            refreshToken,
          });
          if (res.data.success && res.data.data) {
            localStorage.setItem('hms_access_token', res.data.data.accessToken);
            localStorage.setItem('hms_refresh_token', res.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('hms_access_token');
          localStorage.removeItem('hms_refresh_token');
          localStorage.removeItem('hms_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth APIs ---
export const authApi = {
  login: (data: any) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  logout: () => api.post<ApiResponse<void>>('/auth/logout', {}),
  getCurrentUser: () => api.get<ApiResponse<User>>('/auth/me'),
};

// --- Patient APIs ---
export const patientApi = {
  getPatients: (params?: any) => api.get<ApiResponse<PagedResponse<Patient>>>('/patients', { params }),
  getPatientById: (id: number) => api.get<ApiResponse<Patient>>(`/patients/${id}`),
  createPatient: (data: any) => api.post<ApiResponse<Patient>>('/patients', data),
};

// --- Doctor & Department APIs ---
export const doctorApi = {
  getDoctors: (params?: any) => api.get<ApiResponse<PagedResponse<Doctor>>>('/doctors', { params }),
  getDoctorById: (id: number) => api.get<ApiResponse<Doctor>>(`/doctors/${id}`),
  getDoctorSchedules: (doctorId: number) => api.get<ApiResponse<any[]>>(`/doctors/${doctorId}/schedules`),
  getDepartments: (onlyActive = true) => api.get<ApiResponse<Department[]>>('/departments', { params: { onlyActive } }),
  createDoctor: (data: any) => api.post<ApiResponse<Doctor>>('/doctors', data),
  updateDoctor: (id: number, data: any) => api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data),
  addDoctorSchedule: (doctorId: number, data: any) => api.post<ApiResponse<any>>(`/doctors/${doctorId}/schedules`, data),
  deleteDoctorSchedule: (scheduleId: number) => api.delete<ApiResponse<void>>(`/doctors/schedules/${scheduleId}`),
};

export const departmentApi = {
  getDepartments: (onlyActive = false) => api.get<ApiResponse<Department[]>>('/departments', { params: { onlyActive } }),
  getDepartmentById: (id: number) => api.get<ApiResponse<Department>>(`/departments/${id}`),
  createDepartment: (data: any) => api.post<ApiResponse<Department>>('/departments', data),
  updateDepartment: (id: number, data: any) => api.put<ApiResponse<Department>>(`/departments/${id}`, data),
  deleteDepartment: (id: number) => api.delete<ApiResponse<void>>(`/departments/${id}`),
};

// --- Appointment APIs ---
export const appointmentApi = {
  getAppointments: (params?: any) => api.get<ApiResponse<PagedResponse<Appointment>>>('/appointments', { params }),
  getAppointmentById: (id: number) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  createAppointment: (data: any) => api.post<ApiResponse<Appointment>>('/appointments', data),
  updateStatus: (id: number, status: string, notes?: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status, notes }),
};

// --- EMR APIs ---
export const emrApi = {
  getPatientSummary: (patientId: number) => api.get<ApiResponse<any>>(`/emr/patient/${patientId}/summary`),
  getPatientRecords: (patientId: number) => api.get<ApiResponse<any>>(`/emr/patient/${patientId}/consultations`),
  createConsultation: (data: any) => api.post<ApiResponse<MedicalRecord>>('/emr/consultations', data),
  addVitals: (data: any) => api.post<ApiResponse<VitalSign>>('/emr/vitals', data),
  addAllergy: (data: any) => api.post<ApiResponse<Allergy>>('/emr/allergies', data),
};

// --- Prescription APIs ---
export const prescriptionApi = {
  getPrescriptions: (params?: any) => api.get<ApiResponse<PagedResponse<Prescription>>>('/prescriptions', { params }),
  getPrescriptionById: (id: number) => api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`),
  getPatientPrescriptions: (patientId: number) => api.get<ApiResponse<Prescription[]>>(`/prescriptions/patient/${patientId}`),
  createPrescription: (data: any) => api.post<ApiResponse<Prescription>>('/prescriptions', data),
  fulfillPrescription: (id: number, dispensedItemIds: number[]) =>
    api.patch<ApiResponse<Prescription>>(`/prescriptions/${id}/fulfill`, { dispensedItemIds }),
};

// --- Laboratory APIs ---
export const labApi = {
  getTests: () => api.get<ApiResponse<LabTest[]>>('/laboratory/tests'),
  createTest: (data: any) => api.post<ApiResponse<LabTest>>('/laboratory/tests', data),
  updateTest: (id: number, data: any) => api.put<ApiResponse<LabTest>>(`/laboratory/tests/${id}`, data),
  deleteTest: (id: number) => api.delete<ApiResponse<void>>(`/laboratory/tests/${id}`),
  getOrders: (params?: any) => api.get<ApiResponse<PagedResponse<LabOrder>>>('/laboratory/orders', { params }),
  createOrder: (data: any) => api.post<ApiResponse<LabOrder>>('/laboratory/orders', data),
  getPatientOrders: (patientId: number) => api.get<ApiResponse<LabOrder[]>>(`/laboratory/patient/${patientId}/orders`),
  collectSample: (orderItemId: number, customBarcode?: string) =>
    api.patch<ApiResponse<any>>(`/laboratory/order-items/${orderItemId}/collect-sample`, { customBarcode }),
  enterResult: (orderItemId: number, data: any) =>
    api.post<ApiResponse<LabResult>>(`/laboratory/order-items/${orderItemId}/results`, data),
};

// --- Pharmacy APIs ---
export const pharmacyApi = {
  getMedicines: (params?: any) => api.get<ApiResponse<PagedResponse<Medicine>>>('/pharmacy/medicines', { params }),
  getMedicineById: (id: number) => api.get<ApiResponse<Medicine>>(`/pharmacy/medicines/${id}`),
  createMedicine: (data: any) => api.post<ApiResponse<Medicine>>('/pharmacy/medicines', data),
  updateMedicine: (id: number, data: any) => api.put<ApiResponse<Medicine>>(`/pharmacy/medicines/${id}`, data),
  deleteMedicine: (id: number) => api.delete<ApiResponse<void>>(`/pharmacy/medicines/${id}`),
  receiveBatch: (medicineId: number, data: any) => api.post<ApiResponse<MedicineBatch>>(`/pharmacy/medicines/${medicineId}/batches`, data),
  adjustStock: (batchId: number, data: any) => api.post<ApiResponse<MedicineBatch>>(`/pharmacy/batches/${batchId}/adjust`, data),
  getLowStock: () => api.get<ApiResponse<Medicine[]>>('/pharmacy/alerts/low-stock'),
  getExpiringBatches: (days?: number) => api.get<ApiResponse<MedicineBatch[]>>('/pharmacy/batches/expiring', { params: { days } }),
  getTransactions: (params?: any) => api.get<ApiResponse<PagedResponse<any>>>('/pharmacy/transactions', { params }),
};

// --- Inpatient & Bed Board APIs ---
export const inpatientApi = {
  getWards: () => api.get<ApiResponse<Ward[]>>('/inpatient/wards'),
  createWard: (data: any) => api.post<ApiResponse<Ward>>('/inpatient/wards', data),
  updateWard: (id: number, data: any) => api.put<ApiResponse<Ward>>(`/inpatient/wards/${id}`, data),
  deleteWard: (id: number) => api.delete<ApiResponse<void>>(`/inpatient/wards/${id}`),
  createRoom: (data: any) => api.post<ApiResponse<any>>('/inpatient/rooms', data),
  createBed: (data: any) => api.post<ApiResponse<any>>('/inpatient/beds', data),
  getBedBoard: () => api.get<ApiResponse<BedBoardItem[]>>('/inpatient/bed-board'),
  getAdmissions: (params?: any) => api.get<ApiResponse<PagedResponse<Admission>>>('/inpatient/admissions', { params }),
  getAdmissionById: (id: number) => api.get<ApiResponse<Admission>>(`/inpatient/admissions/${id}`),
  admitPatient: (data: any) => api.post<ApiResponse<Admission>>('/inpatient/admissions', data),
  transferBed: (admissionId: number, data: any) => api.post<ApiResponse<Admission>>(`/inpatient/admissions/${admissionId}/transfer-bed`, data),
  dischargePatient: (admissionId: number, data: any) => api.post<ApiResponse<Admission>>(`/inpatient/admissions/${admissionId}/discharge`, data),
};

// --- Billing APIs ---
export const billingApi = {
  getInvoices: (params?: any) => api.get<ApiResponse<PagedResponse<Invoice>>>('/billing/invoices', { params }),
  getInvoiceById: (id: number) => api.get<ApiResponse<Invoice>>(`/billing/invoices/${id}`),
  createInvoice: (data: any) => api.post<ApiResponse<Invoice>>('/billing/invoices', data),
  generateAdmissionInvoice: (admissionId: number) => api.post<ApiResponse<Invoice>>(`/billing/invoices/admission/${admissionId}`),
  recordPayment: (invoiceId: number, data: any) => api.post<ApiResponse<Payment>>(`/billing/invoices/${invoiceId}/payments`, data),
  getPatientInvoices: (patientId: number) => api.get<ApiResponse<Invoice[]>>(`/billing/invoices/patient/${patientId}`),
};

// --- Reports APIs ---
export const reportApi = {
  getCensus: () => api.get<ApiResponse<HospitalCensusReport>>('/reports/census'),
  getRevenue: () => api.get<ApiResponse<RevenueReport>>('/reports/revenue'),
  getBedOccupancy: () => api.get<ApiResponse<BedOccupancyReport>>('/reports/bed-occupancy'),
  getDoctorWorkload: () => api.get<ApiResponse<DoctorWorkloadReport[]>>('/reports/doctor-workload'),
};

// --- Audit APIs ---
export const auditApi = {
  getLogs: (params?: any) => api.get<ApiResponse<PagedResponse<AuditLog>>>('/audit/logs', { params }),
};

export default api;
