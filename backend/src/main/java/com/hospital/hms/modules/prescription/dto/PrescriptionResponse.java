package com.hospital.hms.modules.prescription.dto;

import com.hospital.hms.modules.prescription.entity.Prescription;
import com.hospital.hms.modules.prescription.entity.PrescriptionItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionResponse {

    private Long id;
    private String prescriptionNumber;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long doctorId;
    private String doctorName;
    private String departmentName;
    private Long medicalRecordId;
    private LocalDate issueDate;
    private String status;
    private String clinicalNotes;
    private List<PrescriptionItemResponse> items;
    private LocalDateTime createdAt;

    public static PrescriptionResponse fromEntity(Prescription p) {
        List<PrescriptionItemResponse> itemResponses = p.getItems() != null
                ? p.getItems().stream().map(PrescriptionItemResponse::fromEntity).collect(Collectors.toList())
                : List.of();

        return PrescriptionResponse.builder()
                .id(p.getId())
                .prescriptionNumber(p.getPrescriptionNumber())
                .patientId(p.getPatient().getId())
                .patientName(p.getPatient().getFirstName() + " " + p.getPatient().getLastName())
                .patientCode(p.getPatient().getPatientCode())
                .doctorId(p.getDoctor().getId())
                .doctorName("Dr. " + p.getDoctor().getUser().getFirstName() + " " + p.getDoctor().getUser().getLastName())
                .departmentName(p.getDoctor().getDepartment().getName())
                .medicalRecordId(p.getMedicalRecord() != null ? p.getMedicalRecord().getId() : null)
                .issueDate(p.getIssueDate())
                .status(p.getStatus())
                .clinicalNotes(p.getClinicalNotes())
                .items(itemResponses)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
