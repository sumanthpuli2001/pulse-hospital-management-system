# Pulse Hospital Management System (HMS)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-teal.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%20%2F%205.5-blue.svg)](https://www.mysql.com/)

An enterprise-grade, full-stack Hospital Management System designed to emulate top-tier hospital administrative and clinical systems (Epic Systems, Cerner, AthenaHealth).

---

## 1. System Architecture

```
                       [ Web Browser Clients ]
                                  │
                                  ▼
      [ Vite Dev Server / Nginx Reverse Proxy (Port 5173 / 80) ]
       ├── Static React 18 SPA (Tailwind CSS, Lucide, Recharts)
       └── Reverse Proxy (/api/*)
                                  │
                                  ▼
              [ Spring Boot 3.4.x Backend (Port 8085) ]
       ├── Spring Security 6 (Stateless JWT Filter & Lockout)
       ├── 9 RBAC Authorization Guards (@PreAuthorize)
       ├── Decimal Precision Financial Engine (DECIMAL(12,2))
       ├── Concurrency Control (Pessimistic Bed Locking)
       └── Flyway Database Migrations
                                  │
                                  ▼
         [ MySQL Relational Database (Port 3306) ]
         └── 36 Normalized Tables (Schema: hospital_management)
```

---

## 2. Core Clinical & Administrative Modules

1. **Authentication & User Management**:
   - Secure stateless JWT access tokens (15-min) and refresh tokens (7-day rotation).
   - Progressive account lockout (5 failed attempts locks account for 15 minutes).
   - Forensic HIPAA-compliant security audit logging with IP and user-agent capture.

2. **Patient Administration & Master Patient Index (MPI)**:
   - Unique patient identifier generation (`PAT-2026-XXXX`).
   - Demographic registry, emergency contacts, blood group, and calculated age.

3. **Physician Roster & Scheduling**:
   - Department assignment, specialty licensing, and shift schedules.
   - Outpatient consultation booking with overlap conflict rejection.

4. **Electronic Medical Records (EMR)**:
   - Longitudinal clinical encounters, ICD-10 coded diagnoses, and allergy registries.
   - Standard vital sign tracking (Blood Pressure, Heart Rate, SpO2, BMI).

5. **e-Prescriptions & Pharmacy**:
   - Physician prescription authoring (`RX-2026-XXXX`).
   - Pharmacist dispensing workflow with batch inventory deduction (FEFO).
   - Low-stock threshold alerts and expiring medication quarantine.

6. **Diagnostic Laboratory**:
   - Standard pathology test catalog and automated turnaround time estimation.
   - Barcode-tracked specimen lifecycle (`PENDING` → `COLLECTED` → `IN_ANALYSIS` → `COMPLETED`).
   - Out-of-bounds abnormal result flagging.

7. **Inpatient & Real-Time Bed Board**:
   - Visual ward matrix with live occupancy percentages.
   - `PESSIMISTIC_WRITE` locking preventing concurrent double bed allocation.
   - Admission, ward transfer, and clinical discharge releasing beds.

8. **Billing & Payments**:
   - Consolidated outpatient & auto-generated inpatient discharge bills.
   - `DECIMAL(12,2)` precision (no floating-point rounding errors).
   - Multi-tender receipts (`CARD`, `CASH`, `UPI`, `INSURANCE`).

9. **Reports & Analytics**:
   - Real-time institutional census and operational KPIs.
   - Financial collections vs outstanding receivables (Recharts SVG charts).
   - One-click CSV exports for medical audits.

10. **Patient Self-Service Portal**:
    - Dedicated patient view with strict object-level authorization (IDOR/BOLA prevention).
    - Self-booking, medication schedules, lab results, and statements.

---

## 3. Pre-Seeded RBAC Role Credentials

All accounts are pre-configured with the default password: `Password@123`

| Role | Username | Display Name | Clinical / Admin Scope |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin` | Systems Administrator | Full system & user configuration |
| **HOSPITAL_ADMIN** | `admin` | Operations Director | Departments, beds, staff & reports |
| **DOCTOR** | `dr.rajesh` | Dr. Rajesh Sharma | Consultations, EMR, e-Rx, lab orders |
| **RECEPTIONIST** | `receptionist` | Front Desk Reception | Patient intake & appointment booking |
| **NURSE** | `nurse` | Staff Nurse | Vital signs, inpatient bed monitoring |
| **PHARMACIST** | `pharmacist` | Chief Pharmacist | Medication inventory & e-Rx dispensing |
| **LAB_TECHNICIAN** | `labtech` | Lead Lab Tech | Specimen barcodes & pathology results |
| **ACCOUNTANT** | `accountant` | Revenue Officer | Invoices, payment receipts, balance audit |
| **PATIENT** | `patient1` | John Doe | Personal health portal, appointments, bills |

---

## 4. Running Locally

### Prerequisites
- Java 21 or Java 17
- MySQL running on `localhost:3306` with database `hospital_management`
- Node.js 20+

### Backend Setup
```bash
cd backend
mvn clean spring-boot:run
```
- API Base URL: `http://localhost:8085`
- Swagger UI Documentation: `http://localhost:8085/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8085/v3/api-docs`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Portal URL: `http://localhost:5173`

---

## 5. Docker Production Deployment

To run the entire system in multi-container production mode:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and start containers
docker compose up -d --build

# 3. Check container status
docker compose ps
```

Services exposed:
- Web Application: `http://localhost`
- Backend API: `http://localhost:8085`
- MySQL Database: `localhost:3306`

---

## 6. Automated Test Suite

Run backend unit and integration tests:
```bash
cd backend
mvn test
```
All 13 automated test suites verify authentication, slot conflict detection, inpatient pessimistic locking, and decimal billing calculations with zero failures.
