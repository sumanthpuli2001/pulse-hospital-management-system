package com.hospital.hms.modules.emr.entity;

import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_signs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VitalSign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_user_id", nullable = false)
    private User recordedByUser;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();

    @Column(precision = 4, scale = 1)
    private BigDecimal temperature; // Celsius e.g. 37.0

    @Column(name = "systolic_bp")
    private Integer systolicBp; // mmHg

    @Column(name = "diastolic_bp")
    private Integer diastolicBp; // mmHg

    @Column(name = "pulse_rate")
    private Integer pulseRate; // bpm

    @Column(name = "respiratory_rate")
    private Integer respiratoryRate; // breaths/min

    @Column(name = "oxygen_saturation")
    private Integer oxygenSaturation; // SpO2 %

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(precision = 4, scale = 1)
    private BigDecimal bmi;

    @Column(length = 255)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.recordedAt == null) {
            this.recordedAt = LocalDateTime.now();
        }
    }
}
