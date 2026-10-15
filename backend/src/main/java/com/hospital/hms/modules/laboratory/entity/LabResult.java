package com.hospital.hms.modules.laboratory.entity;

import com.hospital.hms.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private LabOrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private LabTest test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", nullable = false)
    private User performedByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_user_id")
    private User verifiedByUser;

    @Column(name = "parameter_name", nullable = false, length = 100)
    private String parameterName; // e.g. Hemoglobin, Fasting Blood Sugar

    @Column(name = "result_value", nullable = false, length = 100)
    private String resultValue; // e.g. 14.2, 95

    @Column(name = "reference_range", length = 100)
    private String referenceRange; // e.g. 13.0 - 17.0

    @Column(length = 30)
    private String unit; // e.g. g/dL, mg/dL

    @Column(name = "is_abnormal", nullable = false)
    @Builder.Default
    private boolean isAbnormal = false;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

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
