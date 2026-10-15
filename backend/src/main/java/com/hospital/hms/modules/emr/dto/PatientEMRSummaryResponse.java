package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.patient.dto.PatientResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientEMRSummaryResponse {

    private PatientResponse patient;
    private VitalSignResponse latestVitals;
    private List<AllergyResponse> allergies;
    private List<DiagnosisResponse> activeDiagnoses;
    private List<MedicalRecordResponse> recentConsultations;
}
