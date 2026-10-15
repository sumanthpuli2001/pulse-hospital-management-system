const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log(' ENTERPRISE HMS BACKEND & API VALIDATION TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`, details !== undefined ? details : '');
      failed++;
    }
  }

  // 1. Auth Test
  console.log('--- 1. Authentication & RBAC Verification ---');
  let authRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { usernameOrEmail: 'superadmin', password: 'Password@123' });

  assert('Superadmin Login succeeds with 200', authRes.status === 200, authRes);
  const token = authRes.data?.data?.accessToken || authRes.data?.data?.token || authRes.data?.accessToken;
  assert('JWT Access Token returned in response', !!token, authRes.data);

  // Test invalid login
  let badAuth = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { usernameOrEmail: 'superadmin', password: 'WrongPassword' });
  assert('Invalid password rejected with 401 or 400', badAuth.status === 401 || badAuth.status === 400, badAuth.status);

  // Test all seeded roles login
  const testRoles = [
    { user: 'admin', role: 'Hospital Admin' },
    { user: 'dr.rajesh', role: 'Specialist Doctor' },
    { user: 'nurse', role: 'Nurse' },
    { user: 'pharmacist', role: 'Pharmacist' },
    { user: 'labtech', role: 'Lab Technician' },
    { user: 'accountant', role: 'Accountant' },
    { user: 'receptionist', role: 'Receptionist' },
    { user: 'patient1', role: 'Patient' }
  ];
  for (const r of testRoles) {
    let rAuth = await request({
      hostname: 'localhost',
      port: 8085,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { usernameOrEmail: r.user, password: 'Password@123' });
    assert(`${r.role} (${r.user}) login succeeds (200)`, rAuth.status === 200, rAuth.data);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Hospital Census & Telemetry
  console.log('\n--- 2. Clinical Census & Telemetry ---');
  let censusRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/reports/census',
    method: 'GET',
    headers: authHeaders
  });
  const census = censusRes.data?.data || censusRes.data;
  assert('Census endpoint returns 200', censusRes.status === 200, censusRes.status);
  assert('Census has totalPatients and totalDoctors', census?.totalPatients !== undefined && census?.totalDoctors !== undefined, census);

  // 3. Departments
  console.log('\n--- 3. Clinical Departments ---');
  let deptRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/departments',
    method: 'GET',
    headers: authHeaders
  });
  assert('Departments endpoint returns 200', deptRes.status === 200, deptRes.status);
  const deptData = deptRes.data?.data || deptRes.data;
  const departments = Array.isArray(deptData) ? deptData : deptData?.content || [];
  assert('At least 1 department exists', departments.length > 0, departments.length);

  // 4. Patients
  console.log('\n--- 4. Patient Intake & Validation ---');
  let patRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/patients',
    method: 'GET',
    headers: authHeaders
  });
  assert('Patient list returns 200', patRes.status === 200, patRes.status);
  const patData = patRes.data?.data || patRes.data;
  const patients = Array.isArray(patData) ? patData : patData?.content || [];
  assert('Patients exist in database', patients.length > 0, patients.length);

  // Test Patient validation: empty required fields
  let badPat = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/patients',
    method: 'POST',
    headers: authHeaders
  }, { firstName: '', lastName: '', gender: 'INVALID' });
  assert('Invalid patient creation rejected with 400 Bad Request', badPat.status === 400, badPat.status);

  // Verify existing patient record
  const createdPatientId = patients[0]?.id;
  assert('Patient record available for clinical workflows', !!createdPatientId, `Patient ID: ${createdPatientId}`);

  // 5. Doctors
  console.log('\n--- 5. Doctor Specialist Registry ---');
  let docRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/doctors',
    method: 'GET',
    headers: authHeaders
  });
  assert('Doctor list returns 200', docRes.status === 200, docRes.status);
  const docData = docRes.data?.data || docRes.data;
  const doctors = Array.isArray(docData) ? docData : docData?.content || [];
  assert('Specialist doctors exist', doctors.length > 0, doctors.length);
  const sampleDoctor = doctors[0];

  // 6. Appointments
  console.log('\n--- 6. Appointment Scheduling & Check-In ---');
  let apptRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/appointments',
    method: 'GET',
    headers: authHeaders
  });
  assert('Appointment list returns 200', apptRes.status === 200, apptRes.status);

  // Book appointment with a unique future time slot to respect doctor conflict rules
  const randHour = 9 + Math.floor(Math.random() * 8);
  const randMin = (Math.floor(Math.random() * 4) * 15).toString().padStart(2, '0');
  const futureDay = 2 + Math.floor(Math.random() * 20);
  let newAppt = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/appointments',
    method: 'POST',
    headers: authHeaders
  }, {
    patientId: createdPatientId || patients[0]?.id,
    doctorId: sampleDoctor?.id,
    appointmentDate: new Date(Date.now() + futureDay * 86400000).toISOString().split('T')[0],
    startTime: `${randHour.toString().padStart(2, '0')}:${randMin}:00`,
    durationMinutes: 15,
    reasonForVisit: 'Executive health evaluation and ECG analysis'
  });
  assert('New appointment booked successfully (200 or 201)', newAppt.status === 200 || newAppt.status === 201, newAppt.data);

  // 7. Prescriptions
  console.log('\n--- 7. Clinical Prescriptions & Pharmacotherapy ---');
  let rxRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/prescriptions',
    method: 'GET',
    headers: authHeaders
  });
  assert('Prescription list returns 200', rxRes.status === 200, rxRes.status);

  // 8. Laboratory
  console.log('\n--- 8. Diagnostic Laboratory Orders & Pathology ---');
  let labRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/laboratory/orders',
    method: 'GET',
    headers: authHeaders
  });
  assert('Lab orders list returns 200', labRes.status === 200, labRes.status);

  // 9. Pharmacy & Formulary
  console.log('\n--- 9. Central Pharmacy & Formulary Inventory ---');
  let pharmRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/pharmacy/medicines',
    method: 'GET',
    headers: authHeaders
  });
  assert('Pharmacy medicines list returns 200', pharmRes.status === 200, pharmRes.status);

  // 10. Inpatient Bed Board
  console.log('\n--- 10. Inpatient Bed Board & Ward Telemetry ---');
  let bedRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/inpatient/bed-board',
    method: 'GET',
    headers: authHeaders
  });
  assert('Bed board returns 200', bedRes.status === 200, bedRes.status);
  const bedData = bedRes.data?.data || bedRes.data;
  const beds = Array.isArray(bedData) ? bedData : bedData?.content || [];
  assert('Beds are configured in hospital', beds.length > 0, beds.length);

  // 11. Billing, Invoices & Payments (₹)
  console.log('\n--- 11. Financial Billing, Ledger & Payment Clearance in ₹ ---');
  let invRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/billing/invoices',
    method: 'GET',
    headers: authHeaders
  });
  assert('Invoices list returns 200', invRes.status === 200, invRes.status);

  // Test creating new invoice
  let newInv = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/billing/invoices',
    method: 'POST',
    headers: authHeaders
  }, {
    patientId: createdPatientId || patients[0]?.id,
    dueDate: '2026-10-30',
    items: [
      { itemType: 'CONSULTATION', description: 'Executive Specialist Consultation', quantity: 1, unitPrice: 150.0 },
      { itemType: 'LAB_TEST', description: 'Comprehensive Metabolic Panel (CMP)', quantity: 1, unitPrice: 120.0 },
      { itemType: 'PHARMACY', description: 'Antibiotic & Analgesic Formulation', quantity: 1, unitPrice: 50.0 }
    ]
  });
  assert('Invoice generated successfully (200 or 201)', newInv.status === 200 || newInv.status === 201, newInv.data);
  const invoiceObj = newInv.data?.data || newInv.data;
  const invoiceId = invoiceObj?.id;
  const invoiceTotal = invoiceObj?.totalAmount || 320.0;

  if (invoiceId) {
    // Record payment for invoice using correct endpoint: POST /api/v1/billing/invoices/{id}/payments
    let payRes = await request({
      hostname: 'localhost',
      port: 8085,
      path: `/api/v1/billing/invoices/${invoiceId}/payments`,
      method: 'POST',
      headers: authHeaders
    }, {
      amount: invoiceTotal,
      paymentMethod: 'CARD',
      transactionReference: `TXN-${Date.now()}`
    });
    assert('Payment recorded successfully (200 or 201)', payRes.status === 200 || payRes.status === 201, payRes.data);
    const payData = payRes.data?.data || payRes.data;
    assert('Invoice status updated or payment recorded', payData?.status === 'SUCCESS' || payData?.id !== undefined, payData);
  }

  // 12. Audit Logs
  console.log('\n--- 12. HIPAA Audit Logs ---');
  let auditRes = await request({
    hostname: 'localhost',
    port: 8085,
    path: '/api/v1/audit/logs',
    method: 'GET',
    headers: authHeaders
  });
  assert('Audit trail returns 200', auditRes.status === 200, auditRes.status);

  console.log('\n========================================================');
  console.log(` FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');
}

runTests().catch(console.error);
