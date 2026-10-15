package com.hospital.hms.modules.report.service;

import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.billing.repository.InvoiceRepository;
import com.hospital.hms.modules.billing.repository.PaymentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.inpatient.entity.Bed;
import com.hospital.hms.modules.inpatient.repository.AdmissionRepository;
import com.hospital.hms.modules.inpatient.repository.BedRepository;
import com.hospital.hms.modules.laboratory.repository.LabOrderRepository;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.pharmacy.repository.MedicineRepository;
import com.hospital.hms.modules.report.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AdmissionRepository admissionRepository;
    private final BedRepository bedRepository;
    private final LabOrderRepository labOrderRepository;
    private final MedicineRepository medicineRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public HospitalCensusReport getHospitalCensus() {
        long totalPatients = patientRepository.countTotalPatients();
        long totalDoctors = doctorRepository.countByIsActiveTrue();
        long availableDoctors = doctorRepository.findByIsAvailableTrueAndIsActiveTrue().size();
        long todayApts = appointmentRepository.countAppointmentsOnDate(LocalDate.now());
        long activeInpatients = admissionRepository.countByStatus("ADMITTED");
        long totalBeds = bedRepository.countByIsActiveTrue();
        long occupiedBeds = bedRepository.countByStatusAndIsActiveTrue("OCCUPIED");
        double occupancyPct = totalBeds > 0 ? ((double) occupiedBeds / totalBeds) * 100.0 : 0.0;
        long pendingLab = labOrderRepository.countByStatus("ORDERED") + labOrderRepository.countByStatus("SAMPLE_COLLECTED");
        long lowStockMeds = medicineRepository.findLowStockMedicines().size();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        BigDecimal todayRevenue = paymentRepository.sumPaymentsBetween(startOfDay, endOfDay);
        BigDecimal outstandingBalance = invoiceRepository.sumOutstandingBalance();

        return HospitalCensusReport.builder()
                .totalPatients(totalPatients)
                .totalDoctors(totalDoctors)
                .availableDoctors(availableDoctors)
                .todayAppointments(todayApts)
                .activeInpatients(activeInpatients)
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .bedOccupancyPercentage(Math.round(occupancyPct * 100.0) / 100.0)
                .pendingLabOrders(pendingLab)
                .lowStockMedicines(lowStockMeds)
                .todayRevenue(todayRevenue)
                .totalOutstandingBalance(outstandingBalance)
                .build();
    }

    @Transactional(readOnly = true)
    public RevenueReport getRevenueReport() {
        BigDecimal totalBilled = invoiceRepository.sumTotalBilled();
        BigDecimal totalCollected = invoiceRepository.sumTotalPaidRevenue();
        BigDecimal outstandingBalance = invoiceRepository.sumOutstandingBalance();

        long totalInvoices = invoiceRepository.countTotalInvoices();
        long paidInvoices = invoiceRepository.countByStatus("PAID");
        long partiallyPaidInvoices = invoiceRepository.countByStatus("PARTIALLY_PAID");
        long issuedInvoices = invoiceRepository.countByStatus("ISSUED");

        return RevenueReport.builder()
                .totalBilled(totalBilled)
                .totalCollected(totalCollected)
                .outstandingBalance(outstandingBalance)
                .totalInvoices(totalInvoices)
                .paidInvoices(paidInvoices)
                .partiallyPaidInvoices(partiallyPaidInvoices)
                .issuedInvoices(issuedInvoices)
                .build();
    }

    @Transactional(readOnly = true)
    public BedOccupancyReport getBedOccupancyReport() {
        List<Bed> allBeds = bedRepository.findAllBedsWithHierarchy();
        long totalBeds = allBeds.size();
        long occupiedBeds = allBeds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
        long availableBeds = allBeds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();
        long maintenanceBeds = allBeds.stream().filter(b -> "MAINTENANCE".equalsIgnoreCase(b.getStatus())).count();
        double occupancyPct = totalBeds > 0 ? ((double) occupiedBeds / totalBeds) * 100.0 : 0.0;

        Map<String, Long> bedsByWard = new HashMap<>();
        Map<String, Long> occupiedByWard = new HashMap<>();

        for (Bed b : allBeds) {
            String wardName = b.getRoom().getWard().getName();
            bedsByWard.put(wardName, bedsByWard.getOrDefault(wardName, 0L) + 1);
            if ("OCCUPIED".equalsIgnoreCase(b.getStatus())) {
                occupiedByWard.put(wardName, occupiedByWard.getOrDefault(wardName, 0L) + 1);
            }
        }

        return BedOccupancyReport.builder()
                .totalBeds(totalBeds)
                .availableBeds(availableBeds)
                .occupiedBeds(occupiedBeds)
                .maintenanceBeds(maintenanceBeds)
                .occupancyRatePercentage(Math.round(occupancyPct * 100.0) / 100.0)
                .bedsByWard(bedsByWard)
                .occupiedBedsByWard(occupiedByWard)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DoctorWorkloadReport> getDoctorWorkload() {
        List<Doctor> doctors = doctorRepository.findAll();
        return doctors.stream().map(doc -> {
            long totalApts = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(doc.getId(), LocalDate.now()).size();
            long completedApts = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(doc.getId(), LocalDate.now())
                    .stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();

            return DoctorWorkloadReport.builder()
                    .doctorId(doc.getId())
                    .doctorName("Dr. " + doc.getUser().getFirstName() + " " + doc.getUser().getLastName())
                    .departmentName(doc.getDepartment().getName())
                    .totalAppointments(totalApts)
                    .completedAppointments(completedApts)
                    .activeInpatients(0)
                    .build();
        }).collect(Collectors.toList());
    }
}
