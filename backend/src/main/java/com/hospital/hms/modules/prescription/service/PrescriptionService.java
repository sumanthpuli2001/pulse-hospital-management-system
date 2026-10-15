package com.hospital.hms.modules.prescription.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.emr.entity.MedicalRecord;
import com.hospital.hms.modules.emr.repository.MedicalRecordRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.prescription.dto.*;
import com.hospital.hms.modules.prescription.entity.Prescription;
import com.hospital.hms.modules.prescription.entity.PrescriptionItem;
import com.hospital.hms.modules.prescription.repository.PrescriptionItemRepository;
import com.hospital.hms.modules.prescription.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        MedicalRecord record = null;
        if (request.getMedicalRecordId() != null) {
            record = medicalRecordRepository.findById(request.getMedicalRecordId())
                    .orElseThrow(() -> new ResourceNotFoundException("MedicalRecord", "id", request.getMedicalRecordId()));
        }

        Prescription prescription = Prescription.builder()
                .prescriptionNumber(generatePrescriptionNumber())
                .patient(patient)
                .doctor(doctor)
                .medicalRecord(record)
                .issueDate(LocalDate.now())
                .status("ACTIVE")
                .clinicalNotes(request.getClinicalNotes())
                .items(new ArrayList<>())
                .build();

        for (PrescriptionItemRequest itemReq : request.getItems()) {
            PrescriptionItem item = PrescriptionItem.builder()
                    .prescription(prescription)
                    .medicineId(itemReq.getMedicineId())
                    .medicineName(itemReq.getMedicineName().trim())
                    .dosage(itemReq.getDosage().trim())
                    .frequency(itemReq.getFrequency().trim())
                    .route(itemReq.getRoute().toUpperCase())
                    .durationDays(itemReq.getDurationDays())
                    .quantity(itemReq.getQuantity())
                    .instructions(itemReq.getInstructions())
                    .isDispensed(false)
                    .dispensedQuantity(0)
                    .build();
            prescription.getItems().add(item);
        }

        return PrescriptionResponse.fromEntity(prescriptionRepository.save(prescription));
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        return PrescriptionResponse.fromEntity(p);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PrescriptionResponse> filterPrescriptions(Long patientId, Long doctorId, String status, Pageable pageable) {
        Page<Prescription> page = prescriptionRepository.filterPrescriptions(patientId, doctorId, status, pageable);
        List<PrescriptionResponse> content = page.getContent().stream()
                .map(PrescriptionResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByIssueDateDesc(patientId).stream()
                .map(PrescriptionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PrescriptionResponse fulfillPrescription(Long prescriptionId, List<Long> dispensedItemIds) {
        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", prescriptionId));

        if ("CANCELLED".equals(prescription.getStatus())) {
            throw new BadRequestException("Cannot fulfill a cancelled prescription");
        }

        boolean allDispensed = true;
        for (PrescriptionItem item : prescription.getItems()) {
            if (dispensedItemIds.contains(item.getId())) {
                item.setDispensed(true);
                item.setDispensedQuantity(item.getQuantity());
            }
            if (!item.isDispensed()) {
                allDispensed = false;
            }
        }

        prescription.setStatus(allDispensed ? "DISPENSED" : "PARTIALLY_DISPENSED");
        return PrescriptionResponse.fromEntity(prescriptionRepository.save(prescription));
    }

    private synchronized String generatePrescriptionNumber() {
        long count = prescriptionRepository.countTotalPrescriptions() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("RX-%s-%04d", year, count);
        while (prescriptionRepository.existsByPrescriptionNumber(code)) {
            count++;
            code = String.format("RX-%s-%04d", year, count);
        }
        return code;
    }
}
