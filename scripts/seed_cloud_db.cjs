const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('Connecting to TiDB Cloud (pulse_hospital)...');
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'HVtbf3tQkyxXK4C.root',
    password: 'LACrrRIQSQxK1tDU',
    database: 'pulse_hospital',
    multipleStatements: true,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectTimeout: 15000
  });

  console.log('Connected! Disabling foreign key checks for clean bulk seed...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

  const dumpPath = path.join(__dirname, '..', 'exact_mysql_dump.json');
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // 1. Roles
  const roles = [
    [1, 'ROLE_SUPER_ADMIN', 'System Super Administrator'],
    [2, 'ROLE_HOSPITAL_ADMIN', 'Hospital Operations Administrator'],
    [3, 'ROLE_DOCTOR', 'Consulting Physician'],
    [4, 'ROLE_RECEPTIONIST', 'Patient Intake & Receptionist'],
    [5, 'ROLE_NURSE', 'Nursing Staff'],
    [6, 'ROLE_PHARMACIST', 'Pharmacy Dispenser'],
    [7, 'ROLE_LAB_TECHNICIAN', 'Laboratory Tech'],
    [8, 'ROLE_ACCOUNTANT', 'Billing Accountant'],
    [9, 'ROLE_PATIENT', 'Patient Portal Self-Service']
  ];
  for (const r of roles) {
    await conn.query('INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name);', r);
  }
  console.log('✔ Seeded roles');

  // 2. Users (BCrypt for Password@123)
  const passHash = '$2a$12$uEdpZ233XM9IG4bpcGvnSuzmCkfwkR3iEyX8eAL2og5IOeT6ahS0G';
  const users = [
    [1, 'superadmin', 'superadmin@hospital.com', passHash, 'System', 'SuperAdmin', '+91 99999 00001', 1, 0],
    [2, 'admin', 'admin@hospital.com', passHash, 'Hospital', 'Administrator', '+91 99999 00002', 1, 0],
    [3, 'dr.rajesh', 'rajesh.varma@hospital.com', passHash, 'Rajesh', 'Varma', '+91 99999 00003', 1, 0],
    [4, 'nurse', 'nurse@hospital.com', passHash, 'Staff', 'Nurse', '+91 99999 00004', 1, 0],
    [5, 'accountant', 'accountant@hospital.com', passHash, 'Senior', 'Accountant', '+91 99999 00005', 1, 0],
    [6, 'pharmacist', 'pharmacist@hospital.com', passHash, 'Chief', 'Pharmacist', '+91 99999 00006', 1, 0],
    [7, 'receptionist', 'receptionist@hospital.com', passHash, 'Front', 'Desk', '+91 99999 00007', 1, 0],
    [10, 'sumanth.puli', 'sumanth@gmail.com', passHash, 'sumanth', 'puli', '+91 98765 43210', 1, 0]
  ];
  for (const u of users) {
    await conn.query('INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone_number, is_active, is_account_locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username);', u);
  }
  console.log('✔ Seeded users');

  // User roles
  const userRoles = [
    [1, 1], [2, 2], [3, 3], [4, 5], [5, 8], [6, 6], [7, 4], [10, 9]
  ];
  for (const ur of userRoles) {
    await conn.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?);', ur);
  }
  console.log('✔ Seeded user_roles');

  // 3. Departments
  if (Array.isArray(dump.departments)) {
    for (const d of dump.departments) {
      await conn.query('INSERT INTO departments (id, name, code, description, is_active) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name);',
        [d.id, d.name, d.code || d.name.substring(0, 4).toUpperCase(), d.description || '', d.isActive !== false ? 1 : 0]);
    }
    console.log(`✔ Seeded ${dump.departments.length} departments`);
  }

  // 4. Doctors
  if (Array.isArray(dump.doctors)) {
    for (const d of dump.doctors) {
      await conn.query('INSERT INTO doctors (id, user_id, department_id, license_number, specialization, qualifications, consultation_fee, room_number, bio, gender, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE specialization=VALUES(specialization);',
        [d.id, d.userId || 3, d.departmentId || 2, d.licenseNumber || 'DOC-' + d.id, d.specialization || 'General', d.qualifications || 'MBBS', d.consultationFee || 100, d.roomNumber || '101', d.bio || '', d.gender || 'MALE', d.available !== false ? 1 : 0]);
    }
    console.log(`✔ Seeded ${dump.doctors.length} doctors`);
  }

  // 5. Patients
  if (Array.isArray(dump.patients)) {
    for (const p of dump.patients) {
      await conn.query('INSERT INTO patients (id, user_id, patient_code, first_name, last_name, date_of_birth, gender, blood_group, marital_status, phone_number, email, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE patient_code=VALUES(patient_code);',
        [p.id, p.userId || null, p.patientCode || 'PAT-' + p.id, p.firstName, p.lastName, p.dateOfBirth || '1990-01-01', p.gender || 'OTHER', p.bloodGroup || 'O_POSITIVE', p.maritalStatus || 'SINGLE', p.phoneNumber || p.phone || '', p.email || '', p.address || '', p.emergencyContactName || '', p.emergencyContactPhone || '', p.emergencyContactRelationship || '', p.active !== false ? 1 : 0]);
    }
    console.log(`✔ Seeded ${dump.patients.length} patients`);
  }

  // 6. Appointments
  if (Array.isArray(dump.appointments)) {
    for (const a of dump.appointments) {
      await conn.query('INSERT INTO appointments (id, appointment_number, patient_id, doctor_id, appointment_date, start_time, end_time, reason_for_visit, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE appointment_number=VALUES(appointment_number);',
        [a.id, a.appointmentNumber || 'APT-' + a.id, a.patientId, a.doctorId, a.appointmentDate || '2026-10-26', a.startTime || '09:00:00', a.endTime || '09:30:00', a.reasonForVisit || 'Checkup', a.status || 'CONFIRMED', a.notes || '']);
    }
    console.log(`✔ Seeded ${dump.appointments.length} appointments`);
  }

  // 7. Medicines
  if (Array.isArray(dump.medicines)) {
    for (const m of dump.medicines) {
      await conn.query('INSERT INTO medicines (id, name, generic_name, sku, category, unit_of_measure, unit_price, cost_price, reorder_level, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name);',
        [m.id, m.name, m.genericName || m.name, m.sku || 'MED-' + m.id, m.category || 'TABLET', m.unitOfMeasure || 'TABLET', m.unitPrice || 10, m.costPrice || 5, m.reorderLevel || 10, m.active !== false ? 1 : 0]);
    }
    console.log(`✔ Seeded ${dump.medicines.length} medicines`);
  }

  // 8. Invoices
  if (Array.isArray(dump.invoices)) {
    for (const inv of dump.invoices) {
      await conn.query('INSERT INTO invoices (id, invoice_number, patient_id, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE invoice_number=VALUES(invoice_number);',
        [inv.id, inv.invoiceNumber || 'INV-' + inv.id, inv.patientId, inv.invoiceDate || '2026-10-26', inv.dueDate || '2026-11-26', inv.subtotal || 0, inv.taxAmount || 0, inv.discountAmount || 0, inv.totalAmount || 0, inv.paidAmount || 0, inv.balanceAmount || 0, inv.status || 'PAID', inv.notes || '']);
    }
    console.log(`✔ Seeded ${dump.invoices.length} invoices`);
  }

  // 9. Wards
  if (Array.isArray(dump.wards)) {
    for (const w of dump.wards) {
      await conn.query('INSERT INTO wards (id, name, ward_type, department_id, floor_number, capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name);',
        [w.id, w.name, w.wardType || 'GENERAL', w.departmentId || 2, w.floorNumber || 1, w.capacity || 20, w.active !== false ? 1 : 0]);
    }
    console.log(`✔ Seeded ${dump.wards.length} wards`);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
  await conn.end();
  console.log('========================================================');
  console.log(' ALL DATA MIGRATED AND SYNCED TO TIDB CLOUD SUCCESSFULLY!');
  console.log('========================================================');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
