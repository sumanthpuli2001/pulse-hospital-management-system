package com.hospital.hms.modules.emr.entity;

import com.hospital.hms.modules.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "allergies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 100)
    private String allergen;

    @Column(name = "allergy_type", nullable = false, length = 30)
    private String allergyType; // DRUG, FOOD, ENVIRONMENTAL, OTHER

    @Column(nullable = false, length = 30)
    private String severity; // MILD, MODERATE, SEVERE, LIFE_THREATENING

    @Column(length = 255)
    private String reaction;

    @Column(length = 255)
    private String notes;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.recordedAt == null) {
            this.recordedAt = LocalDateTime.now();
        }
    }
}
