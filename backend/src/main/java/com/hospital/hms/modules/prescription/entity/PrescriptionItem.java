package com.hospital.hms.modules.prescription.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medicine_id")
    private Long medicineId;

    @Column(name = "medicine_name", nullable = false, length = 100)
    private String medicineName;

    @Column(nullable = false, length = 50)
    private String dosage; // e.g. 500mg

    @Column(nullable = false, length = 50)
    private String frequency; // e.g. 1-0-1 or TID

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String route = "ORAL"; // ORAL, IV, IM, TOPICAL, INHALATION

    @Column(name = "duration_days", nullable = false)
    private int durationDays;

    @Column(nullable = false)
    private int quantity;

    @Column(length = 255)
    private String instructions; // e.g. Take after food

    @Column(name = "is_dispensed", nullable = false)
    @Builder.Default
    private boolean isDispensed = false;

    @Column(name = "dispensed_quantity", nullable = false)
    @Builder.Default
    private int dispensedQuantity = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
