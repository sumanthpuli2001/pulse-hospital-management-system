package com.hospital.hms.modules.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultEntryRequest {

    @NotBlank(message = "Parameter name is required (e.g. Hemoglobin)")
    private String parameterName;

    @NotBlank(message = "Result value is required")
    private String resultValue;

    private String referenceRange;
    private String unit;
    private boolean abnormal;
    private String remarks;
}
