package com.hospital.hms.modules.emr.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private BigDecimal temperature;
    private Integer systolicBp;
    private Integer diastolicBp;
    private Integer pulseRate;
    private Integer respiratoryRate;
    private Integer oxygenSaturation;
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private String notes;
}
