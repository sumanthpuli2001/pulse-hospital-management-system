package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.VitalSign;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private Long recordedByUserId;
    private String recordedByUserName;
    private LocalDateTime recordedAt;
    private BigDecimal temperature;
    private Integer systolicBp;
    private Integer diastolicBp;
    private String bloodPressureFormatted; // e.g. 120/80 mmHg
    private Integer pulseRate;
    private Integer respiratoryRate;
    private Integer oxygenSaturation;
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal bmi;
    private String notes;

    public static VitalSignResponse fromEntity(VitalSign v) {
        String bp = (v.getSystolicBp() != null && v.getDiastolicBp() != null)
                ? v.getSystolicBp() + "/" + v.getDiastolicBp() + " mmHg"
                : null;

        return VitalSignResponse.builder()
                .id(v.getId())
                .patientId(v.getPatient().getId())
                .patientName(v.getPatient().getFirstName() + " " + v.getPatient().getLastName())
                .recordedByUserId(v.getRecordedByUser().getId())
                .recordedByUserName(v.getRecordedByUser().getFirstName() + " " + v.getRecordedByUser().getLastName())
                .recordedAt(v.getRecordedAt())
                .temperature(v.getTemperature())
                .systolicBp(v.getSystolicBp())
                .diastolicBp(v.getDiastolicBp())
                .bloodPressureFormatted(bp)
                .pulseRate(v.getPulseRate())
                .respiratoryRate(v.getRespiratoryRate())
                .oxygenSaturation(v.getOxygenSaturation())
                .weightKg(v.getWeightKg())
                .heightCm(v.getHeightCm())
                .bmi(v.getBmi())
                .notes(v.getNotes())
                .build();
    }
}
