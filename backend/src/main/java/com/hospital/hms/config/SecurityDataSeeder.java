package com.hospital.hms.config;

import com.hospital.hms.modules.appointment.entity.Appointment;
import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.department.entity.Department;
import com.hospital.hms.modules.department.repository.DepartmentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.entity.DoctorSchedule;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.doctor.repository.DoctorScheduleRepository;
import com.hospital.hms.modules.emr.entity.Allergy;
import com.hospital.hms.modules.emr.entity.MedicalRecord;
import com.hospital.hms.modules.emr.entity.VitalSign;
import com.hospital.hms.modules.emr.repository.AllergyRepository;
import com.hospital.hms.modules.emr.repository.DiagnosisRepository;
import com.hospital.hms.modules.emr.repository.MedicalRecordRepository;
import com.hospital.hms.modules.emr.repository.VitalSignRepository;
import com.hospital.hms.modules.laboratory.entity.LabOrder;
import com.hospital.hms.modules.laboratory.entity.LabOrderItem;
import com.hospital.hms.modules.laboratory.entity.LabTest;
import com.hospital.hms.modules.laboratory.repository.LabOrderItemRepository;
import com.hospital.hms.modules.laboratory.repository.LabOrderRepository;
import com.hospital.hms.modules.laboratory.repository.LabTestRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.prescription.entity.Prescription;
import com.hospital.hms.modules.prescription.entity.PrescriptionItem;
import com.hospital.hms.modules.prescription.repository.PrescriptionRepository;
import com.hospital.hms.modules.pharmacy.entity.Medicine;
import com.hospital.hms.modules.pharmacy.entity.MedicineBatch;
import com.hospital.hms.modules.pharmacy.repository.MedicineBatchRepository;
import com.hospital.hms.modules.pharmacy.repository.MedicineRepository;
import com.hospital.hms.modules.inpatient.entity.Bed;
import com.hospital.hms.modules.inpatient.entity.Room;
import com.hospital.hms.modules.inpatient.entity.Ward;
import com.hospital.hms.modules.inpatient.repository.BedRepository;
import com.hospital.hms.modules.inpatient.repository.RoomRepository;
import com.hospital.hms.modules.inpatient.repository.WardRepository;
import com.hospital.hms.modules.billing.entity.Invoice;
import com.hospital.hms.modules.billing.entity.InvoiceItem;
import com.hospital.hms.modules.billing.entity.Payment;
import com.hospital.hms.modules.billing.repository.InvoiceRepository;
import com.hospital.hms.modules.billing.repository.PaymentRepository;
import com.hospital.hms.modules.user.entity.Role;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.PermissionRepository;
import com.hospital.hms.modules.user.repository.RoleRepository;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class SecurityDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SecurityDataSeeder.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final VitalSignRepository vitalSignRepository;
    private final AllergyRepository allergyRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final LabTestRepository labTestRepository;
    private final LabOrderRepository labOrderRepository;
    private final LabOrderItemRepository labOrderItemRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final WardRepository wardRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting security, clinical, and patient baseline seeding...");

        // 1. Seed Roles
        Role superAdminRole = findOrCreateRole("ROLE_SUPER_ADMIN", "System Super Administrator with unrestricted access");
        Role hospitalAdminRole = findOrCreateRole("ROLE_HOSPITAL_ADMIN", "Hospital Operations Administrator");
        Role doctorRole = findOrCreateRole("ROLE_DOCTOR", "Medical Specialist & Consulting Physician");
        Role receptionistRole = findOrCreateRole("ROLE_RECEPTIONIST", "Patient Intake & Appointment Coordinator");
        Role nurseRole = findOrCreateRole("ROLE_NURSE", "Nursing Staff & Inpatient Caretaker");
        Role pharmacistRole = findOrCreateRole("ROLE_PHARMACIST", "Pharmacy Inventory & Medication Dispenser");
        Role labTechRole = findOrCreateRole("ROLE_LAB_TECHNICIAN", "Diagnostic Laboratory Technician");
        Role accountantRole = findOrCreateRole("ROLE_ACCOUNTANT", "Hospital Billing & Ledger Accountant");
        Role patientRole = findOrCreateRole("ROLE_PATIENT", "Patient Portal Self-Service User");

        // 2. Seed Bootstrap Users with 'Password@123'
        User superAdmin = seedUser("superadmin", "superadmin@hospital.com", "System", "Administrator", "+91 99999 00001", Set.of(superAdminRole));
        User admin = seedUser("admin", "admin@hospital.com", "Hospital", "Administrator", "+91 99999 00002", Set.of(hospitalAdminRole));
        User docUser = seedUser("dr.rajesh", "rajesh.varma@hospital.com", "Rajesh", "Varma", "+91 99999 00003", Set.of(doctorRole));
        User recUser = seedUser("receptionist", "reception@hospital.com", "Anita", "Roy", "+91 99999 00004", Set.of(receptionistRole));
        User nurseUser = seedUser("nurse", "nurse@hospital.com", "Sister", "Mary", "+91 99999 00005", Set.of(nurseRole));
        User pharmUser = seedUser("pharmacist", "pharmacy@hospital.com", "Kiran", "Kumar", "+91 99999 00006", Set.of(pharmacistRole));
        User labUser = seedUser("labtech", "lab@hospital.com", "Sunil", "Mehta", "+91 99999 00007", Set.of(labTechRole));
        User acctUser = seedUser("accountant", "accounts@hospital.com", "Ramesh", "Joshi", "+91 99999 00008", Set.of(accountantRole));
        User patientUser = seedUser("patient1", "arjun.sharma@example.com", "Arjun", "Sharma", "+91 98765 43210", Set.of(patientRole));

        // 3. Ensure Core Departments
        Department cardiology = departmentRepository.findByCode("CARD").orElseGet(() ->
                departmentRepository.save(Department.builder()
                        .name("Cardiology")
                        .code("CARD")
                        .description("Heart and cardiovascular medicine")
                        .isActive(true)
                        .build())
        );

        Department generalMed = departmentRepository.findByCode("GMED").orElseGet(() ->
                departmentRepository.save(Department.builder()
                        .name("General Medicine")
                        .code("GMED")
                        .description("Primary adult care and internal medicine")
                        .isActive(true)
                        .build())
        );

        // 4. Seed Doctor Profile for dr.rajesh
        Doctor doctor = doctorRepository.findByUserId(docUser.getId()).orElseGet(() -> {
            Doctor doc = Doctor.builder()
                    .user(docUser)
                    .department(cardiology)
                    .licenseNumber("MCI-CARD-4491")
                    .specialization("Cardiology")
                    .qualifications("MBBS, MD (Medicine), DM (Cardiology)")
                    .consultationFee(new BigDecimal("120.00"))
                    .roomNumber("204")
                    .bio("Senior Consultant Interventional Cardiologist with 14+ years experience.")
                    .isAvailable(true)
                    .isActive(true)
                    .build();
            return doctorRepository.save(doc);
        });

        // 5. Seed Doctor Schedules
        if (doctorScheduleRepository.findByDoctorIdAndIsActiveTrue(doctor.getId()).isEmpty()) {
            for (String day : new String[]{"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}) {
                doctorScheduleRepository.save(DoctorSchedule.builder()
                        .doctor(doctor)
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(14, 0))
                        .slotDurationMinutes(15)
                        .maxPatientsPerSlot(1)
                        .isActive(true)
                        .build());
            }
            log.info("Initialized weekly schedule roster for Dr. Rajesh Varma.");
        }

        // 6. Seed Patient Profile for patient1 (Arjun Sharma)
        Patient patient = patientRepository.findByUserId(patientUser.getId()).orElseGet(() -> {
            String pCode = "PAT-2026-0001";
            if (patientRepository.existsByPatientCode(pCode)) {
                pCode = "PAT-2026-0099";
            }
            if (patientRepository.existsByPatientCode(pCode)) {
                return patientRepository.findByPatientCode(pCode).orElse(null);
            }
            Patient p = Patient.builder()
                    .user(patientUser)
                    .patientCode(pCode)
                    .firstName("Arjun")
                    .lastName("Sharma")
                    .dateOfBirth(LocalDate.of(1990, 5, 15))
                    .gender("MALE")
                    .bloodGroup("O+")
                    .maritalStatus("MARRIED")
                    .phoneNumber("+91 98765 43210")
                    .email("arjun.sharma@example.com")
                    .address("Flat 402, Green Valley Apartments, Hyderabad")
                    .emergencyContactName("Sunita Sharma")
                    .emergencyContactPhone("+91 98765 43211")
                    .emergencyContactRelationship("Spouse")
                    .isActive(true)
                    .build();
            return patientRepository.save(p);
        });

        // 7. Seed Sample Appointment
        if (appointmentRepository.countTotalAppointments() == 0) {
            Appointment apt = Appointment.builder()
                    .appointmentNumber("APT-2026-0001")
                    .patient(patient)
                    .doctor(doctor)
                    .appointmentDate(LocalDate.now().plusDays(1))
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(10, 15))
                    .reasonForVisit("Routine blood pressure checkup and cardiac evaluation")
                    .status("SCHEDULED")
                    .notes("Patient requested morning appointment slot")
                    .createdBy(recUser)
                    .build();
            appointmentRepository.save(apt);
            log.info("Created baseline appointment APT-2026-0001 for patient Arjun Sharma.");
        }

        // 8. Seed Clinical Vitals & Allergy for Arjun Sharma
        if (vitalSignRepository.findByPatientIdOrderByRecordedAtDesc(patient.getId()).isEmpty()) {
            vitalSignRepository.save(VitalSign.builder()
                    .patient(patient)
                    .recordedByUser(nurseUser)
                    .recordedAt(LocalDateTime.now().minusHours(2))
                    .temperature(new BigDecimal("36.8"))
                    .systolicBp(120)
                    .diastolicBp(80)
                    .pulseRate(72)
                    .respiratoryRate(16)
                    .oxygenSaturation(98)
                    .weightKg(new BigDecimal("74.00"))
                    .heightCm(new BigDecimal("175.00"))
                    .bmi(new BigDecimal("24.2"))
                    .notes("Normal resting vitals observed by triage nurse.")
                    .build());
        }

        if (allergyRepository.findByPatientId(patient.getId()).isEmpty()) {
            allergyRepository.save(Allergy.builder()
                    .patient(patient)
                    .allergen("Penicillin")
                    .allergyType("DRUG")
                    .severity("SEVERE")
                    .reaction("Severe anaphylactoid reaction and bronchospasm")
                    .notes("Verified with patient in 2024. Do not administer beta-lactam antibiotics.")
                    .recordedAt(LocalDateTime.now().minusMonths(6))
                    .build());
        }

        // 9. Seed Lab Test Catalog
        seedLabTest("CBC", "Complete Blood Count", "HEMATOLOGY", "BLOOD", 12, new BigDecimal("25.00"), "WBC: 4.5-11.0, RBC: 4.3-5.9, Hb: 13.5-17.5 g/dL");
        seedLabTest("LIPID", "Lipid Profile Panel", "BIOCHEMISTRY", "SERUM", 24, new BigDecimal("45.00"), "Cholesterol: <200 mg/dL, HDL: >40 mg/dL, LDL: <100 mg/dL, Triglycerides: <150 mg/dL");
        seedLabTest("FBS", "Fasting Blood Glucose", "BIOCHEMISTRY", "PLASMA", 8, new BigDecimal("15.00"), "Normal: 70-99 mg/dL");
        seedLabTest("RFT", "Renal Function Test", "BIOCHEMISTRY", "SERUM", 24, new BigDecimal("50.00"), "Creatinine: 0.7-1.3 mg/dL, Blood Urea Nitrogen: 7-20 mg/dL");

        // 10. Seed Baseline Prescription
        if (prescriptionRepository.countTotalPrescriptions() == 0) {
            Prescription rx = Prescription.builder()
                    .prescriptionNumber("RX-2026-0001")
                    .patient(patient)
                    .doctor(doctor)
                    .issueDate(LocalDate.now())
                    .status("ACTIVE")
                    .clinicalNotes("Maintain low-sodium diet and monitor morning BP daily.")
                    .items(new ArrayList<>())
                    .build();

            rx.getItems().add(PrescriptionItem.builder()
                    .prescription(rx)
                    .medicineName("Atorvastatin 20mg")
                    .dosage("20mg")
                    .frequency("1-0-0 (Night)")
                    .route("ORAL")
                    .durationDays(30)
                    .quantity(30)
                    .instructions("Take once daily after dinner")
                    .isDispensed(false)
                    .build());

            rx.getItems().add(PrescriptionItem.builder()
                    .prescription(rx)
                    .medicineName("Metoprolol Succinate 25mg")
                    .dosage("25mg")
                    .frequency("1-0-1 (BID)")
                    .route("ORAL")
                    .durationDays(30)
                    .quantity(60)
                    .instructions("Take with or immediately after food")
                    .isDispensed(false)
                    .build());

            prescriptionRepository.save(rx);
            log.info("Created baseline prescription RX-2026-0001 for Arjun Sharma.");
        }

        // 11. Seed Baseline Lab Order
        if (labOrderRepository.countTotalOrders() == 0) {
            LabTest lipidTest = labTestRepository.findByTestCode("LIPID").orElse(null);
            if (lipidTest != null) {
                LabOrder labOrder = LabOrder.builder()
                        .orderNumber("LAB-2026-0001")
                        .patient(patient)
                        .doctor(doctor)
                        .status("SAMPLE_COLLECTED")
                        .clinicalIndications("Routine cardiac risk assessment and statin titration evaluation")
                        .orderDate(LocalDateTime.now().minusDays(1))
                        .items(new ArrayList<>())
                        .build();

                LabOrderItem orderItem = LabOrderItem.builder()
                        .order(labOrder)
                        .test(lipidTest)
                        .status("SAMPLE_COLLECTED")
                        .sampleBarcode("BC-LIPID-8841")
                        .collectedAt(LocalDateTime.now().minusHours(4))
                        .collectedByUser(nurseUser)
                        .price(lipidTest.getCost())
                        .build();

                labOrder.getItems().add(orderItem);
                labOrderRepository.save(labOrder);
                log.info("Created baseline lab order LAB-2026-0001 with barcode BC-LIPID-8841.");
            }
        }

        // 12. Seed Baseline Medicines & Batches
        if (medicineRepository.countActiveMedicines() == 0) {
            Medicine atorvastatin = medicineRepository.save(Medicine.builder()
                    .name("Atorvastatin 20mg")
                    .genericName("Atorvastatin Calcium")
                    .sku("MED-ATOR-20")
                    .category("CARDIOLOGY")
                    .unitOfMeasure("TABLET")
                    .unitPrice(new BigDecimal("1.50"))
                    .costPrice(new BigDecimal("0.80"))
                    .reorderLevel(50)
                    .requiresPrescription(true)
                    .isActive(true)
                    .build());

            medicineBatchRepository.save(MedicineBatch.builder()
                    .medicine(atorvastatin)
                    .batchNumber("BAT-2026-001")
                    .manufacturingDate(LocalDate.now().minusMonths(2))
                    .expiryDate(LocalDate.now().plusYears(2))
                    .quantityInStock(500)
                    .unitCost(new BigDecimal("0.80"))
                    .supplierName("Pfizer Global Supply")
                    .isActive(true)
                    .build());

            Medicine amoxicillin = medicineRepository.save(Medicine.builder()
                    .name("Amoxicillin 500mg")
                    .genericName("Amoxicillin Trihydrate")
                    .sku("MED-AMOX-500")
                    .category("ANTIBIOTIC")
                    .unitOfMeasure("CAPSULE")
                    .unitPrice(new BigDecimal("0.75"))
                    .costPrice(new BigDecimal("0.40"))
                    .reorderLevel(100)
                    .requiresPrescription(true)
                    .isActive(true)
                    .build());

            // Low stock batch (40 <= 100)
            medicineBatchRepository.save(MedicineBatch.builder()
                    .medicine(amoxicillin)
                    .batchNumber("BAT-2026-002")
                    .manufacturingDate(LocalDate.now().minusMonths(6))
                    .expiryDate(LocalDate.now().plusMonths(3))
                    .quantityInStock(40)
                    .unitCost(new BigDecimal("0.40"))
                    .supplierName("GSK Pharmaceuticals")
                    .isActive(true)
                    .build());

            log.info("Initialized baseline medications and inventory batches.");
        }

        // 13. Seed Baseline Inpatient Wards, Rooms, and Beds
        if (wardRepository.count() == 0) {
            Ward cardioWard = wardRepository.save(Ward.builder()
                    .name("Cardiology Inpatient Ward")
                    .wardType("POST_OP")
                    .department(cardiology)
                    .floorNumber(2)
                    .capacity(10)
                    .isActive(true)
                    .build());

            Room icuRoom = roomRepository.save(Room.builder()
                    .ward(cardioWard)
                    .roomNumber("ICU-101")
                    .roomType("ICU_ISOLATION")
                    .dailyRate(new BigDecimal("250.00"))
                    .isActive(true)
                    .build());

            bedRepository.save(Bed.builder()
                    .room(icuRoom)
                    .bedNumber("B-101-A")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build());

            bedRepository.save(Bed.builder()
                    .room(icuRoom)
                    .bedNumber("B-101-B")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build());

            Room pvtRoom = roomRepository.save(Room.builder()
                    .ward(cardioWard)
                    .roomNumber("PVT-102")
                    .roomType("PRIVATE")
                    .dailyRate(new BigDecimal("150.00"))
                    .isActive(true)
                    .build());

            bedRepository.save(Bed.builder()
                    .room(pvtRoom)
                    .bedNumber("B-102-A")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build());

            Ward genWard = wardRepository.save(Ward.builder()
                    .name("General Medicine Ward")
                    .wardType("GENERAL")
                    .floorNumber(3)
                    .capacity(20)
                    .isActive(true)
                    .build());

            Room genRoom = roomRepository.save(Room.builder()
                    .ward(genWard)
                    .roomNumber("GEN-201")
                    .roomType("GENERAL_WARD")
                    .dailyRate(new BigDecimal("60.00"))
                    .isActive(true)
                    .build());

            bedRepository.save(Bed.builder()
                    .room(genRoom)
                    .bedNumber("B-201-A")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build());

            bedRepository.save(Bed.builder()
                    .room(genRoom)
                    .bedNumber("B-201-B")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build());

            log.info("Initialized baseline wards, rooms, and beds.");
        }

        // 14. Seed Baseline Invoice & Payment for Arjun Sharma
        if (invoiceRepository.countTotalInvoices() == 0) {
            Invoice inv = Invoice.builder()
                    .invoiceNumber("INV-2026-0001")
                    .patient(patient)
                    .invoiceDate(LocalDate.now())
                    .dueDate(LocalDate.now().plusDays(15))
                    .subtotal(new BigDecimal("165.00"))
                    .taxAmount(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("165.00"))
                    .paidAmount(new BigDecimal("100.00"))
                    .balanceAmount(new BigDecimal("65.00"))
                    .status("PARTIALLY_PAID")
                    .notes("Outpatient Cardiology Consultation and Diagnostic Workup")
                    .createdByUser(admin)
                    .items(new ArrayList<>())
                    .payments(new ArrayList<>())
                    .build();

            inv.getItems().add(InvoiceItem.builder()
                    .invoice(inv)
                    .itemType("CONSULTATION")
                    .itemReferenceId("DOC-1")
                    .description("Specialist Cardiology Consultation - Dr. Rajesh Varma")
                    .quantity(1)
                    .unitPrice(new BigDecimal("120.00"))
                    .totalPrice(new BigDecimal("120.00"))
                    .build());

            inv.getItems().add(InvoiceItem.builder()
                    .invoice(inv)
                    .itemType("LAB_TEST")
                    .itemReferenceId("LAB-2026-0001")
                    .description("Lipid Profile Panel (LIPID)")
                    .quantity(1)
                    .unitPrice(new BigDecimal("45.00"))
                    .totalPrice(new BigDecimal("45.00"))
                    .build());

            Invoice savedInv = invoiceRepository.save(inv);

            Payment payment = Payment.builder()
                    .paymentNumber("PAY-2026-0001")
                    .invoice(savedInv)
                    .patient(patient)
                    .amount(new BigDecimal("100.00"))
                    .paymentMethod("UPI")
                    .paymentDate(LocalDateTime.now())
                    .transactionReference("UPI-AXIS-99218274")
                    .notes("Partial payment via UPI")
                    .receivedByUser(acctUser)
                    .status("COMPLETED")
                    .build();

            paymentRepository.save(payment);
            savedInv.getPayments().add(payment);
            invoiceRepository.save(savedInv);

            log.info("Initialized baseline invoice INV-2026-0001 with partial payment PAY-2026-0001.");
        }

        log.info("Clinical, prescription, laboratory, pharmacy, inpatient, and billing baseline data initialized successfully.");
    }

    private void seedLabTest(String code, String name, String category, String sampleType, int hours, BigDecimal cost, String ranges) {
        if (!labTestRepository.existsByTestCode(code)) {
            labTestRepository.save(LabTest.builder()
                    .testCode(code)
                    .testName(name)
                    .category(category)
                    .sampleType(sampleType)
                    .standardTurnaroundHours(hours)
                    .cost(cost)
                    .referenceRanges(ranges)
                    .isActive(true)
                    .build());
        }
    }

    private Role findOrCreateRole(String roleName, String description) {
        return roleRepository.findByName(roleName).orElseGet(() -> {
            Role role = Role.builder()
                    .name(roleName)
                    .description(description)
                    .build();
            return roleRepository.save(role);
        });
    }

    private User seedUser(String username, String email, String firstName, String lastName, String phone, Set<Role> roles) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("Password@123"))
                    .firstName(firstName)
                    .lastName(lastName)
                    .phoneNumber(phone)
                    .isActive(true)
                    .isAccountLocked(false)
                    .roles(roles)
                    .build();
            log.info("Bootstrapped default user: '{}' [{}]", username, email);
            return userRepository.save(user);
        });
    }
}
