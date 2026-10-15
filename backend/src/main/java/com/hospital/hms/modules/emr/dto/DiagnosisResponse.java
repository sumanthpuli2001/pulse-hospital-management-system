package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.Diagnosis;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisResponse {

    private Long id;
    private Long medicalRecordId;
    private Long patientId;
    private String icdCode;
    private String diagnosisName;
    private String diagnosisType;
    private String status;
    private String notes;
    private LocalDate diagnosedDate;

    public static DiagnosisResponse fromEntity(Diagnosis diag) {
        return DiagnosisResponse.builder()
                .id(diag.getId())
                .medicalRecordId(diag.getMedicalRecord().getId())
                .patientId(diag.getPatient().getId())
                .icdCode(diag.getIcdCode())
                .diagnosisName(diag.getDiagnosisName())
                .diagnosisType(diag.getDiagnosisType())
                .status(diag.getStatus())
                .notes(diag.getNotes())
                .diagnosedDate(diag.getDiagnosedDate())
                .build();
    }
}
