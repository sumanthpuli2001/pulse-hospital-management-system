package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.Diagnosis;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosisRequest {

    private String icdCode;

    private String diagnosisName;
    private String description; // Alias for compatibility

    public String getDiagnosisName() {
        if (diagnosisName != null && !diagnosisName.isBlank()) {
            return diagnosisName;
        }
        return description != null ? description : "";
    }

    public void setDescription(String description) {
        this.description = description;
        if (this.diagnosisName == null || this.diagnosisName.isBlank()) {
            this.diagnosisName = description;
        }
    }

    @Builder.Default
    private String diagnosisType = "FINAL"; // PROVISIONAL, FINAL

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, RESOLVED, CHRONIC

    private String notes;
}
