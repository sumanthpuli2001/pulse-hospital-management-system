const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;
const BACKEND_PORT = process.env.BACKEND_PORT || 8085;
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// =====================================================================
//  COMPREHENSIVE MOCK DATA FOR CLOUD DEMO (when Spring Boot is absent)
// =====================================================================

const DEMO_USERS = {
  superadmin: { userId: 1, username: 'superadmin', email: 'superadmin@hospital.com', firstName: 'System', lastName: 'SuperAdmin', roles: ['ROLE_SUPER_ADMIN'] },
  admin: { userId: 2, username: 'admin', email: 'admin@hospital.com', firstName: 'Hospital', lastName: 'Administrator', roles: ['ROLE_HOSPITAL_ADMIN'] },
  'dr.rajesh': { userId: 3, username: 'dr.rajesh', email: 'rajesh.sharma@hospital.com', firstName: 'Dr. Rajesh', lastName: 'Sharma', roles: ['ROLE_DOCTOR'], department: 'Cardiology' },
  nurse: { userId: 4, username: 'nurse', email: 'deepa.nair@hospital.com', firstName: 'Sister Deepa', lastName: 'Nair', roles: ['ROLE_NURSE'], department: 'ICU' },
  accountant: { userId: 5, username: 'accountant', email: 'accounts@hospital.com', firstName: 'Ramesh', lastName: 'Kumar', roles: ['ROLE_ACCOUNTANT'], department: 'Billing & Finance' },
};

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'General Medicine', code: 'GEN', description: 'Primary care and internal medicine', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 2, name: 'Cardiology', code: 'CARD', description: 'Cardiovascular diagnosis and heart care', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 3, name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal and bone surgery', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 4, name: 'Pediatrics', code: 'PED', description: 'Infant and child healthcare', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 5, name: 'Neurology', code: 'NEUR', description: 'Brain and neurological system care', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 6, name: 'Emergency & Trauma', code: 'EMRG', description: '24/7 acute trauma and emergency resuscitation', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 7, name: 'Gynecology & Obstetrics', code: 'OBGY', description: 'Women health, pregnancy and childbirth', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
  { id: 8, name: 'Radiology', code: 'CT/MRI', description: 'X-Ray & Digital Radiography, MRI/CT diagnostics', createdAt: '2026-01-01T10:00:00', isActive: true, active: true },
];

const MOCK_PATIENTS = [
  { id: 1, patientCode: 'PAT-2026-0010', firstName: 'Mahesh', lastName: 'Babu', dateOfBirth: '2001-03-15', age: 25, gender: 'MALE', bloodGroup: 'A_NEGATIVE', phone: '+91 6390875432', phoneNumber: '+91 6390875432', email: 'babu@gmail.com', address: '12 MG Road, Hyderabad', emergencyContactName: 'Lakshmi Babu', emergencyContactPhone: '+91 9876543210', createdAt: '2026-09-15T10:30:00', isActive: true, active: true },
  { id: 2, patientCode: 'PAT-2026-0009', firstName: 'Hemanth', lastName: 'Karvadi', dateOfBirth: '2001-07-22', age: 25, gender: 'MALE', bloodGroup: 'O_NEGATIVE', phone: '9876543210', phoneNumber: '9876543210', email: 'hemanth@gmail.com', address: '45 Jubilee Hills, Hyderabad', emergencyContactName: 'Srinivas Karvadi', emergencyContactPhone: '+91 9988776655', createdAt: '2026-09-14T14:20:00', isActive: true, active: true },
  { id: 3, patientCode: 'PAT-2026-0008', firstName: 'Deepa', lastName: 'Verma', dateOfBirth: '1990-11-05', age: 36, gender: 'FEMALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'deepa.verma@example.com', address: '78 Banjara Hills, Hyderabad', emergencyContactName: 'Rahul Verma', emergencyContactPhone: '+91 8877665544', createdAt: '2026-09-12T09:15:00', isActive: true, active: true },
  { id: 4, patientCode: 'PAT-2026-0007', firstName: 'Vikram', lastName: 'Joshi', dateOfBirth: '1990-04-18', age: 36, gender: 'MALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'vikram.joshi@example.com', address: '23 Madhapur, Hyderabad', emergencyContactName: 'Priya Joshi', emergencyContactPhone: '+91 7766554433', createdAt: '2026-09-10T11:45:00', isActive: true, active: true },
  { id: 5, patientCode: 'PAT-2026-0006', firstName: 'Sneha', lastName: 'Patel', dateOfBirth: '1990-08-25', age: 36, gender: 'FEMALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'sneha.patel@example.com', address: '56 Gachibowli, Hyderabad', emergencyContactName: 'Amit Patel', emergencyContactPhone: '+91 6655443322', createdAt: '2026-09-08T16:30:00', isActive: true, active: true },
  { id: 6, patientCode: 'PAT-2026-0005', firstName: 'Rajesh', lastName: 'Iyer', dateOfBirth: '1990-01-12', age: 36, gender: 'MALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'rajesh.iyer@example.com', address: '89 Kondapur, Hyderabad', emergencyContactName: 'Meena Iyer', emergencyContactPhone: '+91 5544332211', createdAt: '2026-09-05T08:00:00', isActive: true, active: true },
  { id: 7, patientCode: 'PAT-2026-0004', firstName: 'Priya', lastName: 'Nair', dateOfBirth: '1990-06-30', age: 36, gender: 'FEMALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'priya.nair@example.com', address: '34 HITEC City, Hyderabad', emergencyContactName: 'Suresh Nair', emergencyContactPhone: '+91 4433221100', createdAt: '2026-09-03T13:15:00', isActive: true, active: true },
  { id: 8, patientCode: 'PAT-2026-0003', firstName: 'Kavya', lastName: 'Reddy', dateOfBirth: '1996-12-08', age: 30, gender: 'FEMALE', bloodGroup: 'B_POSITIVE', phone: '+91 99887 66554', phoneNumber: '+91 99887 66554', email: 'kavya.reddy@example.com', address: '67 Kukatpally, Hyderabad', emergencyContactName: 'Ravi Reddy', emergencyContactPhone: '+91 3322110099', createdAt: '2026-09-01T10:00:00', isActive: true, active: true },
  { id: 9, patientCode: 'PAT-2026-0002', firstName: 'Arjun', lastName: 'Singh', dateOfBirth: '1985-09-20', age: 41, gender: 'MALE', bloodGroup: 'AB_POSITIVE', phone: '+91 8765432109', phoneNumber: '+91 8765432109', email: 'arjun.singh@example.com', address: '12 Ameerpet, Hyderabad', emergencyContactName: 'Kavita Singh', emergencyContactPhone: '+91 2211009988', createdAt: '2026-08-28T15:45:00', isActive: true, active: true },
  { id: 10, patientCode: 'PAT-2026-0001', firstName: 'Sumanth', lastName: 'Puli', dateOfBirth: '2001-05-10', age: 25, gender: 'MALE', bloodGroup: 'O_POSITIVE', phone: '+91 9876543210', phoneNumber: '+91 9876543210', email: 'sumanth.puli@example.com', address: '90 SR Nagar, Hyderabad', emergencyContactName: 'Ramesh Puli', emergencyContactPhone: '+91 1100998877', createdAt: '2026-08-25T09:30:00', isActive: true, active: true },
];

const MOCK_DOCTORS = [
  {
    id: 1, userId: 3, firstName: 'Rajesh', lastName: 'Sharma', fullName: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@hospital.com', phoneNumber: '+91 9876543001', phone: '+91 9876543001',
    departmentId: 2, departmentName: 'Cardiology', department: MOCK_DEPARTMENTS[1],
    specialization: 'Interventional Cardiology', qualifications: 'MD, DM Cardiology',
    experienceYears: 15, licenseNumber: 'MCI-2011-HYD-4521', roomNumber: 'C-201',
    consultationFee: 1500, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'MALE',
    createdAt: '2026-01-15T10:00:00', user: { id: 3, firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh.sharma@hospital.com', username: 'dr.rajesh' },
    schedules: [
      { id: 1, doctorId: 1, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15, maxPatients: 16, isAvailable: true },
      { id: 2, doctorId: 1, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15, maxPatients: 16, isAvailable: true },
      { id: 3, doctorId: 1, dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '18:00', slotDurationMinutes: 15, maxPatients: 16, isAvailable: true },
    ]
  },
  {
    id: 2, userId: 6, firstName: 'Anitha', lastName: 'Rao', fullName: 'Dr. Anitha Rao',
    email: 'anitha.rao@hospital.com', phoneNumber: '+91 9876543002', phone: '+91 9876543002',
    departmentId: 3, departmentName: 'Orthopedics', department: MOCK_DEPARTMENTS[2],
    specialization: 'Orthopedic Surgery', qualifications: 'MS Orthopedics, Fellowship Joint Replacement',
    experienceYears: 12, licenseNumber: 'MCI-2014-HYD-5632', roomNumber: 'O-105',
    consultationFee: 1200, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'FEMALE',
    createdAt: '2026-01-20T10:00:00', user: { id: 6, firstName: 'Anitha', lastName: 'Rao', email: 'anitha.rao@hospital.com', username: 'dr.anitha' },
    schedules: [
      { id: 4, doctorId: 2, dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 20, maxPatients: 12, isAvailable: true },
      { id: 5, doctorId: 2, dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 20, maxPatients: 12, isAvailable: true },
    ]
  },
  {
    id: 3, userId: 7, firstName: 'Suresh', lastName: 'Kumar', fullName: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@hospital.com', phoneNumber: '+91 9876543003', phone: '+91 9876543003',
    departmentId: 4, departmentName: 'Pediatrics', department: MOCK_DEPARTMENTS[3],
    specialization: 'Pediatric Medicine', qualifications: 'MD Pediatrics, DCH',
    experienceYears: 18, licenseNumber: 'MCI-2008-HYD-3210', roomNumber: 'P-302',
    consultationFee: 1000, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'MALE',
    createdAt: '2026-02-01T10:00:00', user: { id: 7, firstName: 'Suresh', lastName: 'Kumar', email: 'suresh.kumar@hospital.com', username: 'dr.suresh' },
    schedules: [
      { id: 6, doctorId: 3, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', slotDurationMinutes: 15, maxPatients: 12, isAvailable: true },
      { id: 7, doctorId: 3, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '12:00', slotDurationMinutes: 15, maxPatients: 12, isAvailable: true },
    ]
  },
  {
    id: 4, userId: 8, firstName: 'Priya', lastName: 'Menon', fullName: 'Dr. Priya Menon',
    email: 'priya.menon@hospital.com', phoneNumber: '+91 9876543004', phone: '+91 9876543004',
    departmentId: 5, departmentName: 'Neurology', department: MOCK_DEPARTMENTS[4],
    specialization: 'Neurosurgery', qualifications: 'MCh Neurosurgery',
    experienceYears: 10, licenseNumber: 'MCI-2016-HYD-6743', roomNumber: 'N-401',
    consultationFee: 2000, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'FEMALE',
    createdAt: '2026-02-10T10:00:00', user: { id: 8, firstName: 'Priya', lastName: 'Menon', email: 'priya.menon@hospital.com', username: 'dr.priya' },
    schedules: [
      { id: 8, doctorId: 4, dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '15:00', slotDurationMinutes: 30, maxPatients: 8, isAvailable: true },
    ]
  },
  {
    id: 5, userId: 9, firstName: 'Venkat', lastName: 'Reddy', fullName: 'Dr. Venkat Reddy',
    email: 'venkat.reddy@hospital.com', phoneNumber: '+91 9876543005', phone: '+91 9876543005',
    departmentId: 6, departmentName: 'Emergency & Trauma', department: MOCK_DEPARTMENTS[5],
    specialization: 'Emergency Medicine', qualifications: 'MD Emergency Medicine',
    experienceYears: 8, licenseNumber: 'MCI-2018-HYD-7854', roomNumber: 'E-001',
    consultationFee: 800, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'MALE',
    createdAt: '2026-02-15T10:00:00', user: { id: 9, firstName: 'Venkat', lastName: 'Reddy', email: 'venkat.reddy@hospital.com', username: 'dr.venkat' },
    schedules: [
      { id: 9, doctorId: 5, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '16:00', slotDurationMinutes: 20, maxPatients: 24, isAvailable: true },
    ]
  },
  {
    id: 6, userId: 10, firstName: 'Lakshmi', lastName: 'Devi', fullName: 'Dr. Lakshmi Devi',
    email: 'lakshmi.devi@hospital.com', phoneNumber: '+91 9876543006', phone: '+91 9876543006',
    departmentId: 7, departmentName: 'Gynecology & Obstetrics', department: MOCK_DEPARTMENTS[6],
    specialization: 'Obstetrics & Gynecology', qualifications: 'MD OBG, Fellowship Maternal Medicine',
    experienceYears: 20, licenseNumber: 'MCI-2006-HYD-2109', roomNumber: 'G-201',
    consultationFee: 1400, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'FEMALE',
    createdAt: '2026-03-01T10:00:00', user: { id: 10, firstName: 'Lakshmi', lastName: 'Devi', email: 'lakshmi.devi@hospital.com', username: 'dr.lakshmi' },
    schedules: [
      { id: 10, doctorId: 6, dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '14:00', slotDurationMinutes: 20, maxPatients: 12, isAvailable: true },
    ]
  },
  {
    id: 7, userId: 11, firstName: 'Arun', lastName: 'Prasad', fullName: 'Dr. Arun Prasad',
    email: 'arun.prasad@hospital.com', phoneNumber: '+91 9876543007', phone: '+91 9876543007',
    departmentId: 1, departmentName: 'General Medicine', department: MOCK_DEPARTMENTS[0],
    specialization: 'General Medicine', qualifications: 'MD General Medicine',
    experienceYears: 14, licenseNumber: 'MCI-2012-HYD-4900', roomNumber: 'G-101',
    consultationFee: 700, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'MALE',
    createdAt: '2026-03-10T10:00:00', user: { id: 11, firstName: 'Arun', lastName: 'Prasad', email: 'arun.prasad@hospital.com', username: 'dr.arun' },
    schedules: [
      { id: 11, doctorId: 7, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15, maxPatients: 16, isAvailable: true },
    ]
  },
  {
    id: 8, userId: 12, firstName: 'Meera', lastName: 'Krishnan', fullName: 'Dr. Meera Krishnan',
    email: 'meera.krishnan@hospital.com', phoneNumber: '+91 9876543008', phone: '+91 9876543008',
    departmentId: 8, departmentName: 'Radiology', department: MOCK_DEPARTMENTS[7],
    specialization: 'Diagnostic Radiology', qualifications: 'MD Radiology, Fellowship Interventional Radiology',
    experienceYears: 9, licenseNumber: 'MCI-2017-HYD-7100', roomNumber: 'R-001',
    consultationFee: 1100, isAvailable: true, isActive: true, status: 'ACTIVE', gender: 'FEMALE',
    createdAt: '2026-03-15T10:00:00', user: { id: 12, firstName: 'Meera', lastName: 'Krishnan', email: 'meera.krishnan@hospital.com', username: 'dr.meera' },
    schedules: [
      { id: 12, doctorId: 8, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '15:00', slotDurationMinutes: 30, maxPatients: 12, isAvailable: true },
    ]
  },
];

const today = new Date().toISOString().split('T')[0];
const MOCK_APPOINTMENTS = [
  { id: 1, appointmentNumber: 'APT-2026-0001', patientId: 1, patientName: 'Mahesh Babu', patientCode: 'PAT-2026-0010', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', departmentName: 'Cardiology', appointmentDate: today, startTime: '09:00', endTime: '09:30', reasonForVisit: 'Follow-up for chest pain', status: 'SCHEDULED', patient: MOCK_PATIENTS[0], doctor: MOCK_DOCTORS[0], createdAt: '2026-10-14T08:00:00' },
  { id: 2, appointmentNumber: 'APT-2026-0002', patientId: 2, patientName: 'Hemanth Karvadi', patientCode: 'PAT-2026-0009', doctorId: 3, doctorName: 'Dr. Suresh Kumar', departmentName: 'Pediatrics', appointmentDate: today, startTime: '09:30', endTime: '10:00', reasonForVisit: 'Pediatric routine checkup', status: 'CHECKED_IN', patient: MOCK_PATIENTS[1], doctor: MOCK_DOCTORS[2], createdAt: '2026-10-14T09:00:00' },
  { id: 3, appointmentNumber: 'APT-2026-0003', patientId: 3, patientName: 'Deepa Verma', patientCode: 'PAT-2026-0008', doctorId: 2, doctorName: 'Dr. Anitha Rao', departmentName: 'Orthopedics', appointmentDate: today, startTime: '10:00', endTime: '10:30', reasonForVisit: 'Post-surgery knee review', status: 'SCHEDULED', patient: MOCK_PATIENTS[2], doctor: MOCK_DOCTORS[1], createdAt: '2026-10-14T10:00:00' },
  { id: 4, appointmentNumber: 'APT-2026-0004', patientId: 4, patientName: 'Vikram Joshi', patientCode: 'PAT-2026-0007', doctorId: 4, doctorName: 'Dr. Priya Menon', departmentName: 'Neurology', appointmentDate: today, startTime: '10:30', endTime: '11:00', reasonForVisit: 'Migraine assessment', status: 'COMPLETED', patient: MOCK_PATIENTS[3], doctor: MOCK_DOCTORS[3], createdAt: '2026-10-13T14:00:00' },
  { id: 5, appointmentNumber: 'APT-2026-0005', patientId: 5, patientName: 'Sneha Patel', patientCode: 'PAT-2026-0006', doctorId: 6, doctorName: 'Dr. Lakshmi Devi', departmentName: 'Gynecology & Obstetrics', appointmentDate: today, startTime: '11:00', endTime: '11:30', reasonForVisit: 'Annual gynecology checkup', status: 'SCHEDULED', patient: MOCK_PATIENTS[4], doctor: MOCK_DOCTORS[5], createdAt: '2026-10-14T11:00:00' },
  { id: 6, appointmentNumber: 'APT-2026-0006', patientId: 6, patientName: 'Rajesh Iyer', patientCode: 'PAT-2026-0005', doctorId: 7, doctorName: 'Dr. Arun Prasad', departmentName: 'General Medicine', appointmentDate: today, startTime: '11:30', endTime: '12:00', reasonForVisit: 'Diabetes management review', status: 'SCHEDULED', patient: MOCK_PATIENTS[5], doctor: MOCK_DOCTORS[6], createdAt: '2026-10-14T12:00:00' },
  { id: 7, appointmentNumber: 'APT-2026-0007', patientId: 7, patientName: 'Priya Nair', patientCode: 'PAT-2026-0004', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', departmentName: 'Cardiology', appointmentDate: today, startTime: '14:00', endTime: '14:30', reasonForVisit: 'ECG and heart evaluation', status: 'SCHEDULED', patient: MOCK_PATIENTS[6], doctor: MOCK_DOCTORS[0], createdAt: '2026-10-14T13:00:00' },
  { id: 8, appointmentNumber: 'APT-2026-0008', patientId: 8, patientName: 'Kavya Reddy', patientCode: 'PAT-2026-0003', doctorId: 8, doctorName: 'Dr. Meera Krishnan', departmentName: 'Radiology', appointmentDate: today, startTime: '14:30', endTime: '15:00', reasonForVisit: 'MRI scan review', status: 'SCHEDULED', patient: MOCK_PATIENTS[7], doctor: MOCK_DOCTORS[7], createdAt: '2026-10-14T14:00:00' },
];

const MOCK_PRESCRIPTIONS = [
  { id: 1, prescriptionNumber: 'RX-2026-0001', patientId: 1, patientName: 'Mahesh Babu', patientCode: 'PAT-2026-0010', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', departmentName: 'Cardiology', diagnosis: 'Hypertension Stage 2', status: 'ACTIVE', issueDate: '2026-10-14', prescribedDate: '2026-10-14', items: [{ id: 1, medicineId: 2, medicineName: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', quantity: 30, dispensed: false }], createdAt: '2026-10-14T10:00:00' },
  { id: 2, prescriptionNumber: 'RX-2026-0002', patientId: 3, patientName: 'Deepa Verma', patientCode: 'PAT-2026-0008', doctorId: 2, doctorName: 'Dr. Anitha Rao', departmentName: 'Orthopedics', diagnosis: 'Post-operative pain management', status: 'DISPENSED', issueDate: '2026-10-13', prescribedDate: '2026-10-13', items: [{ id: 2, medicineId: 1, medicineName: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '7 days', quantity: 21, dispensed: true }], createdAt: '2026-10-13T14:00:00' },
  { id: 3, prescriptionNumber: 'RX-2026-0003', patientId: 6, patientName: 'Rajesh Iyer', patientCode: 'PAT-2026-0005', doctorId: 7, doctorName: 'Dr. Arun Prasad', departmentName: 'General Medicine', diagnosis: 'Type 2 Diabetes Mellitus', status: 'ACTIVE', issueDate: '2026-10-12', prescribedDate: '2026-10-12', items: [{ id: 3, medicineId: 3, medicineName: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '90 days', quantity: 180, dispensed: false }], createdAt: '2026-10-12T09:00:00' },
  { id: 4, prescriptionNumber: 'RX-2026-0004', patientId: 4, patientName: 'Vikram Joshi', patientCode: 'PAT-2026-0007', doctorId: 4, doctorName: 'Dr. Priya Menon', departmentName: 'Neurology', diagnosis: 'Chronic Migraine', status: 'ACTIVE', issueDate: '2026-10-11', prescribedDate: '2026-10-11', items: [{ id: 4, medicineId: 7, medicineName: 'Sumatriptan 50mg', dosage: '1 tablet', frequency: 'As needed', duration: '30 days', quantity: 10, dispensed: false }], createdAt: '2026-10-11T16:00:00' },
];

const MOCK_LAB_TESTS = [
  { id: 1, testName: 'Complete Blood Count (CBC)', testCode: 'LAB-CBC', category: 'HEMATOLOGY', normalRange: 'WBC: 4,500-11,000/uL', price: 450, turnaroundHours: 4, active: true },
  { id: 2, testName: 'Lipid Profile', testCode: 'LAB-LIPID', category: 'BIOCHEMISTRY', normalRange: 'Total Cholesterol: <200 mg/dL', price: 800, turnaroundHours: 6, active: true },
  { id: 3, testName: 'Liver Function Test (LFT)', testCode: 'LAB-LFT', category: 'BIOCHEMISTRY', normalRange: 'ALT: 7-56 U/L', price: 900, turnaroundHours: 6, active: true },
  { id: 4, testName: 'Thyroid Profile (T3, T4, TSH)', testCode: 'LAB-THYROID', category: 'ENDOCRINOLOGY', normalRange: 'TSH: 0.4-4.0 mIU/L', price: 1200, turnaroundHours: 8, active: true },
  { id: 5, testName: 'Blood Glucose Fasting', testCode: 'LAB-GLU-F', category: 'BIOCHEMISTRY', normalRange: '70-100 mg/dL', price: 200, turnaroundHours: 2, active: true },
  { id: 6, testName: 'Urine Routine & Microscopy', testCode: 'LAB-URINE', category: 'MICROBIOLOGY', normalRange: 'pH: 4.5-8.0', price: 300, turnaroundHours: 3, active: true },
];

const MOCK_LAB_ORDERS = [
  { id: 1, orderNumber: 'LO-2026-0001', patientId: 1, patientName: 'Mahesh Babu', patientCode: 'PAT-2026-0010', doctorId: 1, doctorName: 'Dr. Rajesh Sharma', status: 'COMPLETED', priority: 'NORMAL', orderDate: '2026-10-14', items: [{ id: 1, test: MOCK_LAB_TESTS[0], testName: 'Complete Blood Count (CBC)', testCode: 'LAB-CBC', status: 'COMPLETED', price: 450 }], createdAt: '2026-10-14T08:30:00' },
  { id: 2, orderNumber: 'LO-2026-0002', patientId: 4, patientName: 'Vikram Joshi', patientCode: 'PAT-2026-0007', doctorId: 4, doctorName: 'Dr. Priya Menon', status: 'SAMPLE_COLLECTED', priority: 'URGENT', orderDate: '2026-10-15', items: [{ id: 2, test: MOCK_LAB_TESTS[3], testName: 'Thyroid Profile (T3, T4, TSH)', testCode: 'LAB-THYROID', status: 'SAMPLE_COLLECTED', price: 1200 }], createdAt: '2026-10-15T09:00:00' },
  { id: 3, orderNumber: 'LO-2026-0003', patientId: 6, patientName: 'Rajesh Iyer', patientCode: 'PAT-2026-0005', doctorId: 7, doctorName: 'Dr. Arun Prasad', status: 'ORDERED', priority: 'NORMAL', orderDate: today, items: [{ id: 3, test: MOCK_LAB_TESTS[4], testName: 'Blood Glucose Fasting', testCode: 'LAB-GLU-F', status: 'ORDERED', price: 200 }], createdAt: '2026-10-16T07:00:00' },
  { id: 4, orderNumber: 'LO-2026-0004', patientId: 8, patientName: 'Kavya Reddy', patientCode: 'PAT-2026-0003', doctorId: 8, doctorName: 'Dr. Meera Krishnan', status: 'ORDERED', priority: 'NORMAL', orderDate: today, items: [{ id: 4, test: MOCK_LAB_TESTS[1], testName: 'Lipid Profile', testCode: 'LAB-LIPID', status: 'ORDERED', price: 800 }], createdAt: '2026-10-16T08:00:00' },
];

const MOCK_MEDICINES = [
  { id: 1, name: 'Paracetamol 650mg', genericName: 'Acetaminophen', category: 'ANALGESIC', manufacturer: 'Cipla Ltd', unitPrice: 5.50, currentStock: 2500, reorderLevel: 500, expiryDate: '2027-06-30', status: 'IN_STOCK', active: true },
  { id: 2, name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', category: 'ANTIHYPERTENSIVE', manufacturer: 'Sun Pharma', unitPrice: 8.00, currentStock: 1800, reorderLevel: 400, expiryDate: '2027-09-15', status: 'IN_STOCK', active: true },
  { id: 3, name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'ANTIDIABETIC', manufacturer: 'Dr. Reddy\'s', unitPrice: 4.50, currentStock: 3200, reorderLevel: 600, expiryDate: '2027-12-01', status: 'IN_STOCK', active: true },
  { id: 4, name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'ANTIBIOTIC', manufacturer: 'Ranbaxy Labs', unitPrice: 12.00, currentStock: 150, reorderLevel: 300, expiryDate: '2027-03-20', status: 'LOW_STOCK', active: true },
  { id: 5, name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'ANTACID', manufacturer: 'Lupin Ltd', unitPrice: 6.00, currentStock: 2100, reorderLevel: 400, expiryDate: '2027-08-10', status: 'IN_STOCK', active: true },
  { id: 6, name: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium', category: 'STATIN', manufacturer: 'Biocon', unitPrice: 10.50, currentStock: 100, reorderLevel: 200, expiryDate: '2027-05-25', status: 'LOW_STOCK', active: true },
  { id: 7, name: 'Sumatriptan 50mg', genericName: 'Sumatriptan', category: 'ANTIMIGRAINE', manufacturer: 'Zydus Cadila', unitPrice: 45.00, currentStock: 800, reorderLevel: 150, expiryDate: '2027-11-18', status: 'IN_STOCK', active: true },
  { id: 8, name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', category: 'ANTIHISTAMINE', manufacturer: 'Mankind Pharma', unitPrice: 3.50, currentStock: 4000, reorderLevel: 500, expiryDate: '2028-01-15', status: 'IN_STOCK', active: true },
];

const MOCK_INVOICES = [
  { id: 1, invoiceNumber: 'INV-2026-0001', patientId: 1, patientName: 'Mahesh Babu', patientCode: 'PAT-2026-0010', totalAmount: 4500.00, paidAmount: 4500.00, balanceAmount: 0, status: 'PAID', invoiceDate: '2026-10-14', dueDate: '2026-10-21', subtotal: 4500, taxAmount: 0, discountAmount: 0, items: [{ id: 1, invoiceId: 1, itemType: 'CONSULTATION', description: 'Consultation - Cardiology', quantity: 1, unitPrice: 1500, totalPrice: 1500 }, { id: 2, invoiceId: 1, itemType: 'PROCEDURE', description: 'ECG Test', quantity: 1, unitPrice: 800, totalPrice: 800 }, { id: 3, invoiceId: 1, itemType: 'LAB_TEST', description: 'Blood Tests', quantity: 1, unitPrice: 2200, totalPrice: 2200 }], createdAt: '2026-10-14T16:00:00' },
  { id: 2, invoiceNumber: 'INV-2026-0002', patientId: 3, patientName: 'Deepa Verma', patientCode: 'PAT-2026-0008', totalAmount: 85000.00, paidAmount: 60000.00, balanceAmount: 25000.00, status: 'PARTIALLY_PAID', invoiceDate: '2026-10-13', dueDate: '2026-10-20', subtotal: 85000, taxAmount: 0, discountAmount: 0, items: [{ id: 4, invoiceId: 2, itemType: 'SURGERY', description: 'Knee Replacement Surgery', quantity: 1, unitPrice: 75000, totalPrice: 75000 }, { id: 5, invoiceId: 2, itemType: 'ROOM_CHARGE', description: 'Ward Charges (3 days)', quantity: 3, unitPrice: 2000, totalPrice: 6000 }, { id: 6, invoiceId: 2, itemType: 'MEDICATION', description: 'Post-op Medicines', quantity: 1, unitPrice: 4000, totalPrice: 4000 }], createdAt: '2026-10-13T18:00:00' },
  { id: 3, invoiceNumber: 'INV-2026-0003', patientId: 4, patientName: 'Vikram Joshi', patientCode: 'PAT-2026-0007', totalAmount: 3200.00, paidAmount: 3200.00, balanceAmount: 0, status: 'PAID', invoiceDate: '2026-10-11', dueDate: '2026-10-18', subtotal: 3200, taxAmount: 0, discountAmount: 0, items: [{ id: 7, invoiceId: 3, itemType: 'CONSULTATION', description: 'Consultation - Neurology', quantity: 1, unitPrice: 2000, totalPrice: 2000 }, { id: 8, invoiceId: 3, itemType: 'LAB_TEST', description: 'MRI Brain', quantity: 1, unitPrice: 1200, totalPrice: 1200 }], createdAt: '2026-10-11T17:00:00' },
  { id: 4, invoiceNumber: 'INV-2026-0004', patientId: 6, patientName: 'Rajesh Iyer', patientCode: 'PAT-2026-0005', totalAmount: 1500.00, paidAmount: 0, balanceAmount: 1500.00, status: 'PENDING', invoiceDate: today, dueDate: today, subtotal: 1500, taxAmount: 0, discountAmount: 0, items: [{ id: 9, invoiceId: 4, itemType: 'CONSULTATION', description: 'Consultation - General Medicine', quantity: 1, unitPrice: 700, totalPrice: 700 }, { id: 10, invoiceId: 4, itemType: 'LAB_TEST', description: 'Blood Glucose Test', quantity: 1, unitPrice: 200, totalPrice: 200 }, { id: 11, invoiceId: 4, itemType: 'LAB_TEST', description: 'HbA1c Test', quantity: 1, unitPrice: 600, totalPrice: 600 }], createdAt: '2026-10-16T10:00:00' },
  { id: 5, invoiceNumber: 'INV-2026-0005', patientId: 7, patientName: 'Priya Nair', patientCode: 'PAT-2026-0004', totalAmount: 2800.00, paidAmount: 2800.00, balanceAmount: 0, status: 'PAID', invoiceDate: '2026-10-10', dueDate: '2026-10-17', subtotal: 2800, taxAmount: 0, discountAmount: 0, items: [{ id: 12, invoiceId: 5, itemType: 'CONSULTATION', description: 'Consultation - Cardiology', quantity: 1, unitPrice: 1500, totalPrice: 1500 }, { id: 13, invoiceId: 5, itemType: 'PROCEDURE', description: 'Echo Cardiogram', quantity: 1, unitPrice: 1300, totalPrice: 1300 }], createdAt: '2026-10-10T15:00:00' },
  { id: 6, invoiceNumber: 'INV-2026-0006', patientId: 9, patientName: 'Arjun Singh', patientCode: 'PAT-2026-0002', totalAmount: 12000.00, paidAmount: 12000.00, balanceAmount: 0, status: 'PAID', invoiceDate: '2026-10-09', dueDate: '2026-10-16', subtotal: 12000, taxAmount: 0, discountAmount: 0, items: [{ id: 14, invoiceId: 6, itemType: 'EMERGENCY', description: 'Emergency Treatment', quantity: 1, unitPrice: 5000, totalPrice: 5000 }, { id: 15, invoiceId: 6, itemType: 'LAB_TEST', description: 'CT Scan', quantity: 1, unitPrice: 4500, totalPrice: 4500 }, { id: 16, invoiceId: 6, itemType: 'MEDICATION', description: 'Medicines & IV', quantity: 1, unitPrice: 2500, totalPrice: 2500 }], createdAt: '2026-10-09T22:00:00' },
];

const MOCK_WARDS = [
  { id: 1, name: 'General Ward A', code: 'GW-A', wardType: 'GENERAL', floorNumber: 1, capacity: 20, totalBeds: 20, occupiedBeds: 14, availableBeds: 6, active: true },
  { id: 2, name: 'ICU', code: 'ICU-1', wardType: 'ICU', floorNumber: 2, capacity: 10, totalBeds: 10, occupiedBeds: 8, availableBeds: 2, active: true },
  { id: 3, name: 'Pediatric Ward', code: 'PED-W', wardType: 'PEDIATRIC', floorNumber: 3, capacity: 12, totalBeds: 12, occupiedBeds: 5, availableBeds: 7, active: true },
  { id: 4, name: 'Maternity Ward', code: 'MAT-W', wardType: 'MATERNITY', floorNumber: 3, capacity: 8, totalBeds: 8, occupiedBeds: 4, availableBeds: 4, active: true },
  { id: 5, name: 'Private Suite', code: 'PVT-S', wardType: 'PRIVATE', floorNumber: 4, capacity: 6, totalBeds: 6, occupiedBeds: 3, availableBeds: 3, active: true },
];

const MOCK_ADMISSIONS = [
  { id: 1, admissionNumber: 'ADM-2026-001', patientId: 3, patientName: 'Deepa Verma', patientCode: 'PAT-2026-0008', admittingDoctorId: 2, doctorName: 'Dr. Anitha Rao', departmentName: 'Orthopedics', wardName: 'General Ward A', bedNumber: 'GW-A-05', admissionDate: '2026-10-11T10:00:00', status: 'ADMITTED', admissionReason: 'Knee replacement surgery - post-op recovery', createdAt: '2026-10-11T10:00:00' },
  { id: 2, admissionNumber: 'ADM-2026-002', patientId: 9, patientName: 'Arjun Singh', patientCode: 'PAT-2026-0002', admittingDoctorId: 5, doctorName: 'Dr. Venkat Reddy', departmentName: 'Emergency & Trauma', wardName: 'ICU', bedNumber: 'ICU-1-03', admissionDate: '2026-10-09T21:30:00', status: 'ADMITTED', admissionReason: 'Road traffic accident - polytrauma', createdAt: '2026-10-09T21:30:00' },
];

const MOCK_BED_BOARD = [
  { bedId: 1, bedNumber: 'GW-A-01', status: 'OCCUPIED', roomId: 1, roomNumber: 'GW-A-01', wardName: 'General Ward A', patientId: 3, patientName: 'Deepa Verma', admissionNumber: 'ADM-2026-001' },
  { bedId: 2, bedNumber: 'GW-A-02', status: 'AVAILABLE', roomId: 1, roomNumber: 'GW-A-01', wardName: 'General Ward A' },
  { bedId: 3, bedNumber: 'ICU-1-03', status: 'OCCUPIED', roomId: 2, roomNumber: 'ICU-1-03', wardName: 'ICU', patientId: 9, patientName: 'Arjun Singh', admissionNumber: 'ADM-2026-002' },
  { bedId: 4, bedNumber: 'ICU-1-04', status: 'AVAILABLE', roomId: 2, roomNumber: 'ICU-1-03', wardName: 'ICU' },
  { bedId: 5, bedNumber: 'PED-W-01', status: 'AVAILABLE', roomId: 3, roomNumber: 'PED-W-01', wardName: 'Pediatric Ward' },
  { bedId: 6, bedNumber: 'PVT-S-01', status: 'AVAILABLE', roomId: 4, roomNumber: 'PVT-S-01', wardName: 'Private Suite' },
  { bedId: 7, bedNumber: 'MAT-W-01', status: 'AVAILABLE', roomId: 5, roomNumber: 'MAT-W-01', wardName: 'Maternity Ward' },
];

const MOCK_AUDIT_LOGS = [
  { id: 1, action: 'LOGIN', resourceName: 'USER', resourceId: '2', description: 'User admin logged in successfully', username: 'admin', ipAddress: '192.168.1.105', createdAt: new Date().toISOString() },
  { id: 2, action: 'CREATE', resourceName: 'PATIENT', resourceId: '10', description: 'New patient Sumanth Puli (PAT-2026-0001) registered', username: 'admin', ipAddress: '192.168.1.105', createdAt: '2026-10-15T09:30:00' },
  { id: 3, action: 'CREATE', resourceName: 'APPOINTMENT', resourceId: '1', description: 'Appointment scheduled for Mahesh Babu with Dr. Rajesh Sharma', username: 'admin', ipAddress: '192.168.1.105', createdAt: '2026-10-14T08:00:00' },
  { id: 4, action: 'UPDATE', resourceName: 'PRESCRIPTION', resourceId: '2', description: 'Prescription RX-2026-0002 dispensed for Deepa Verma', username: 'accountant', ipAddress: '192.168.1.110', createdAt: '2026-10-13T14:30:00' },
  { id: 5, action: 'CREATE', resourceName: 'INVOICE', resourceId: '2', description: 'Invoice INV-2026-0002 generated for surgery: ₹85,000', username: 'accountant', ipAddress: '192.168.1.110', createdAt: '2026-10-13T18:00:00' },
  { id: 6, action: 'CREATE', resourceName: 'ADMISSION', resourceId: '2', description: 'Emergency admission ADM-2026-002 for Arjun Singh', username: 'dr.venkat', ipAddress: '192.168.1.120', createdAt: '2026-10-09T21:30:00' },
];

const MOCK_CENSUS = {
  totalPatients: 10, totalDoctors: 8, availableDoctors: 8, todayAppointments: 8,
  activeInpatients: 2, totalBeds: 56, occupiedBeds: 34, bedOccupancyPercentage: 60.7,
  pendingLabOrders: 2, lowStockMedicines: 2, todayRevenue: 245000.0, totalOutstandingBalance: 26500.0,
};

const MOCK_REVENUE = {
  totalRevenue: 1245000.0, totalCollected: 985000.0, totalOutstanding: 260000.0,
  todayRevenue: 245000.0, weeklyRevenue: 680000.0, monthlyRevenue: 1245000.0,
  departmentWise: MOCK_DEPARTMENTS.slice(0, 6).map((d, i) => ({ department: d.name, revenue: [320000, 285000, 180000, 150000, 120000, 190000][i] })),
};

const MOCK_BED_OCCUPANCY = {
  totalBeds: 56, occupiedBeds: 34, availableBeds: 22, occupancyRate: 60.7,
  wardWise: MOCK_WARDS.map(w => ({ ward: w.name, total: w.totalBeds, occupied: w.occupiedBeds, available: w.availableBeds, rate: Math.round(w.occupiedBeds / w.totalBeds * 100) })),
};

const MOCK_DOCTOR_WORKLOAD = MOCK_DOCTORS.map((d, i) => ({
  doctorId: d.id, doctorName: `Dr. ${d.firstName} ${d.lastName}`, departmentName: d.departmentName,
  totalAppointments: [45, 38, 52, 28, 60, 35, 48, 22][i],
  completedAppointments: [40, 35, 48, 25, 55, 32, 44, 20][i],
  activeInpatients: [2, 1, 0, 1, 3, 1, 0, 0][i],
}));

// =====================================================================
//  MOCK FALLBACK ROUTER
// =====================================================================
function handleMockFallback(req, res, pathname, requestBody) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const ok = (data, message = 'Success') => {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message, data, timestamp: new Date().toISOString() }));
  };
  const paged = (content, message = 'Success') => {
    ok({ content, totalElements: content.length, totalPages: 1, number: 0, size: 50 }, message);
  };

  // --- Auth ---
  if (pathname.includes('/auth/login') && req.method === 'POST') {
    try {
      const parsed = JSON.parse(requestBody || '{}');
      const u = (parsed.usernameOrEmail || '').toLowerCase();
      const user = DEMO_USERS[u] || DEMO_USERS['admin'];
      ok({
        accessToken: 'demo_jwt_' + Buffer.from(JSON.stringify(user)).toString('base64'),
        refreshToken: 'demo_refresh_' + Date.now(), tokenType: 'Bearer', expiresIn: 86400,
        userId: user.userId, username: user.username, email: user.email,
        firstName: user.firstName, lastName: user.lastName, roles: user.roles,
      }, 'Login successful');
    } catch (e) { ok(DEMO_USERS['admin'], 'Login successful'); }
    return;
  }
  if (pathname.includes('/auth/refresh')) {
    const user = DEMO_USERS['admin'];
    ok({ accessToken: 'demo_jwt_refreshed_' + Date.now(), refreshToken: 'demo_refresh_' + Date.now(), tokenType: 'Bearer', expiresIn: 86400, userId: user.userId, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, roles: user.roles }, 'Token refreshed');
    return;
  }
  if (pathname.includes('/auth/me')) { ok(DEMO_USERS['admin']); return; }
  if (pathname.includes('/auth/logout')) { ok(null, 'Logged out'); return; }

  // --- Patients ---
  if (pathname.match(/\/patients\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    const pat = MOCK_PATIENTS.find(p => p.id === id) || MOCK_PATIENTS[0];
    ok(pat, 'Patient retrieved'); return;
  }
  if (pathname.includes('/patients')) {
    if (req.method === 'POST') { ok(MOCK_PATIENTS[0], 'Patient created successfully'); return; }
    paged(MOCK_PATIENTS, 'Patients retrieved'); return;
  }

  // --- Doctors & Schedules ---
  if (pathname.match(/\/doctors\/\d+\/schedules/)) {
    const id = parseInt(pathname.split('/')[pathname.split('/').indexOf('doctors') + 1]);
    const doc = MOCK_DOCTORS.find(d => d.id === id) || MOCK_DOCTORS[0];
    ok(doc.schedules || [], 'Schedules retrieved'); return;
  }
  if (pathname.match(/\/doctors\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    const doc = MOCK_DOCTORS.find(d => d.id === id) || MOCK_DOCTORS[0];
    ok(doc, 'Doctor retrieved'); return;
  }
  if (pathname.includes('/doctors')) {
    if (req.method === 'POST') { ok(MOCK_DOCTORS[0], 'Doctor created'); return; }
    paged(MOCK_DOCTORS, 'Doctors retrieved'); return;
  }

  // --- Departments ---
  if (pathname.match(/\/departments\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    const dept = MOCK_DEPARTMENTS.find(d => d.id === id) || MOCK_DEPARTMENTS[0];
    ok(dept); return;
  }
  if (pathname.includes('/departments')) {
    if (req.method === 'POST') { ok(MOCK_DEPARTMENTS[0], 'Department created'); return; }
    ok(MOCK_DEPARTMENTS, 'Departments retrieved'); return;
  }

  // --- Appointments ---
  if (pathname.match(/\/appointments\/\d+\/status/)) { ok(MOCK_APPOINTMENTS[0], 'Status updated'); return; }
  if (pathname.match(/\/appointments\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    const apt = MOCK_APPOINTMENTS.find(a => a.id === id) || MOCK_APPOINTMENTS[0];
    ok(apt); return;
  }
  if (pathname.includes('/appointments')) {
    if (req.method === 'POST') { ok(MOCK_APPOINTMENTS[0], 'Appointment scheduled'); return; }
    paged(MOCK_APPOINTMENTS, 'Appointments retrieved'); return;
  }

  // --- EMR ---
  if (pathname.includes('/emr/') && pathname.includes('/summary')) {
    ok({
      patient: MOCK_PATIENTS[0],
      recentVitals: { temperature: 98.6, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, respiratoryRate: 16, oxygenSaturation: 98 },
      allergies: [{ allergen: 'Penicillin', severity: 'HIGH', reaction: 'Rash' }],
      recentConsultations: [],
      activePrescriptions: MOCK_PRESCRIPTIONS.slice(0, 1)
    }, 'Patient EMR summary');
    return;
  }
  if (pathname.includes('/emr/')) { ok([], 'EMR data retrieved'); return; }

  // --- Prescriptions ---
  if (pathname.match(/\/prescriptions\/patient\/\d+/)) { ok(MOCK_PRESCRIPTIONS.slice(0, 2)); return; }
  if (pathname.match(/\/prescriptions\/\d+/)) {
    const id = parseInt(pathname.split('/').pop());
    const rx = MOCK_PRESCRIPTIONS.find(p => p.id === id) || MOCK_PRESCRIPTIONS[0];
    ok(rx); return;
  }
  if (pathname.includes('/prescriptions')) {
    if (req.method === 'POST') { ok(MOCK_PRESCRIPTIONS[0], 'Prescription created'); return; }
    paged(MOCK_PRESCRIPTIONS, 'Prescriptions retrieved'); return;
  }

  // --- Laboratory ---
  if (pathname.includes('/laboratory/tests')) {
    if (req.method === 'POST') { ok(MOCK_LAB_TESTS[0], 'Test created'); return; }
    ok(MOCK_LAB_TESTS, 'Lab tests retrieved'); return;
  }
  if (pathname.includes('/laboratory/patient/')) { ok(MOCK_LAB_ORDERS.slice(0, 1)); return; }
  if (pathname.includes('/laboratory/order')) {
    if (req.method === 'POST') { ok(MOCK_LAB_ORDERS[0], 'Lab order created'); return; }
    if (pathname.includes('/collect-sample') || pathname.includes('/results')) { ok({}, 'Updated'); return; }
    paged(MOCK_LAB_ORDERS, 'Lab orders retrieved'); return;
  }

  // --- Pharmacy ---
  if (pathname.includes('/pharmacy/alerts/low-stock')) { ok(MOCK_MEDICINES.filter(m => m.status === 'LOW_STOCK'), 'Low stock medicines'); return; }
  if (pathname.includes('/pharmacy/batches/expiring')) { ok([], 'No expiring batches'); return; }
  if (pathname.includes('/pharmacy/transactions')) { paged([], 'Transactions retrieved'); return; }
  if (pathname.match(/\/pharmacy\/medicines\/\d+/)) {
    const id = parseInt(pathname.split('/').pop());
    const med = MOCK_MEDICINES.find(m => m.id === id) || MOCK_MEDICINES[0];
    ok(med); return;
  }
  if (pathname.includes('/pharmacy/medicines')) {
    if (req.method === 'POST') { ok(MOCK_MEDICINES[0], 'Medicine created'); return; }
    paged(MOCK_MEDICINES, 'Medicines retrieved'); return;
  }

  // --- Inpatient & Bed Board ---
  if (pathname.includes('/inpatient/bed-board')) { ok(MOCK_BED_BOARD, 'Bed board retrieved'); return; }
  if (pathname.includes('/inpatient/wards')) {
    if (req.method === 'POST') { ok(MOCK_WARDS[0], 'Ward created'); return; }
    ok(MOCK_WARDS, 'Wards retrieved'); return;
  }
  if (pathname.match(/\/inpatient\/admissions\/\d+/)) {
    const id = parseInt(pathname.split('/').pop());
    const adm = MOCK_ADMISSIONS.find(a => a.id === id) || MOCK_ADMISSIONS[0];
    ok(adm); return;
  }
  if (pathname.includes('/inpatient/admissions')) {
    if (req.method === 'POST') { ok(MOCK_ADMISSIONS[0], 'Patient admitted'); return; }
    paged(MOCK_ADMISSIONS, 'Admissions retrieved'); return;
  }
  if (pathname.includes('/inpatient/rooms') || pathname.includes('/inpatient/beds')) { ok({}, 'Created'); return; }

  // --- Billing ---
  if (pathname.includes('/billing/invoices/patient/')) { ok(MOCK_INVOICES.slice(0, 2)); return; }
  if (pathname.match(/\/billing\/invoices\/\d+\/payments/)) { ok({ id: 1, amount: 1000, method: 'CASH' }, 'Payment recorded'); return; }
  if (pathname.match(/\/billing\/invoices\/admission/)) { ok(MOCK_INVOICES[0], 'Invoice generated'); return; }
  if (pathname.match(/\/billing\/invoices\/\d+$/)) {
    const id = parseInt(pathname.split('/').pop());
    const inv = MOCK_INVOICES.find(i => i.id === id) || MOCK_INVOICES[0];
    ok(inv); return;
  }
  if (pathname.includes('/billing/invoices')) {
    if (req.method === 'POST') { ok(MOCK_INVOICES[0], 'Invoice created'); return; }
    paged(MOCK_INVOICES, 'Invoices retrieved'); return;
  }

  // --- Reports ---
  if (pathname.includes('/reports/census')) { ok(MOCK_CENSUS, 'Hospital operational census retrieved'); return; }
  if (pathname.includes('/reports/revenue')) { ok(MOCK_REVENUE, 'Revenue report retrieved'); return; }
  if (pathname.includes('/reports/bed-occupancy')) { ok(MOCK_BED_OCCUPANCY, 'Bed occupancy report'); return; }
  if (pathname.includes('/reports/doctor-workload')) { ok(MOCK_DOCTOR_WORKLOAD, 'Doctor workload report'); return; }

  // --- Audit ---
  if (pathname.includes('/audit/logs')) { paged(MOCK_AUDIT_LOGS, 'Audit logs retrieved'); return; }

  // --- Generic fallback ---
  ok({ content: [], totalElements: 0, totalPages: 0 }, 'Operation processed');
}

// =====================================================================
//  HTTP SERVER
// =====================================================================
const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // 1. API Reverse Proxy to Spring Boot Backend (Port 8085)
  if (req.url.startsWith('/api')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      const requestBody = Buffer.concat(bodyChunks);

      const proxyReq = http.request({
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: `${BACKEND_HOST}:${BACKEND_PORT}`,
          origin: `http://localhost:${PORT}`,
          referer: `http://localhost:${PORT}/`,
          'content-length': requestBody.length,
        },
        timeout: 4000,
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy(new Error('Backend connection timeout'));
      });

      proxyReq.on('error', (err) => {
        console.warn(`[Fallback] ${req.method} ${req.url} → mock (${err.message})`);
        handleMockFallback(req, res, pathname, requestBody.toString('utf8'));
      });

      if (requestBody.length > 0) {
        proxyReq.write(requestBody);
      }
      proxyReq.end();
    });

    return;
  }

  // 2. Serve Static Assets or fallback to index.html (SPA Client-Side Routing)
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(DIST_DIR, cleanUrl);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PULSE HMS Production Server running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
  console.log(`Proxying /api to http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
