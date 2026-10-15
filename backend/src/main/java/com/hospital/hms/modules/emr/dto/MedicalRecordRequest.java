package com.hospital.hms.modules.emr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    private Long appointmentId;

    @NotBlank(message = "Chief complaint is required")
    private String chiefComplaint;

    private String historyOfPresentIllness;
    private String physicalExamination;

    @NotBlank(message = "Assessment and plan is required")
    private String assessmentAndPlan;

    private LocalDate followUpDate;
    private String notes;

    private List<DiagnosisRequest> diagnoses;
}
