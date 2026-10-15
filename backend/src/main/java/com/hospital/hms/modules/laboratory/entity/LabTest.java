package com.hospital.hms.modules.laboratory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "lab_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_code", nullable = false, unique = true, length = 30)
    private String testCode; // e.g. CBC, LIPID, FBS, RFT

    @Column(name = "test_name", nullable = false, length = 100)
    private String testName;

    @Column(nullable = false, length = 50)
    private String category; // HEMATOLOGY, BIOCHEMISTRY, MICROBIOLOGY, RADIOLOGY, PATHOLOGY

    @Column(name = "sample_type", length = 50)
    private String sampleType; // BLOOD, URINE, SERUM, SWAB, TISSUE

    @Column(name = "standard_turnaround_hours", nullable = false)
    @Builder.Default
    private int standardTurnaroundHours = 24;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "reference_ranges", columnDefinition = "TEXT")
    private String referenceRanges;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
