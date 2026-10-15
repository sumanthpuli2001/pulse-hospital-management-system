package com.hospital.hms.modules.pharmacy.entity;

import com.hospital.hms.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private MedicineBatch batch;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // PURCHASE_RECEIPT, DISPENSE, ADJUSTMENT, RETURN, EXPIRED_DISCARD

    @Column(nullable = false)
    private Integer quantity; // positive for addition, negative for deduction

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "reference_id", length = 50)
    private String referenceId; // Prescription #, Purchase Order #, etc.

    @Column(name = "reference_type", length = 50)
    private String referenceType; // PRESCRIPTION, PURCHASE_ORDER, INVENTORY_AUDIT

    @Column(length = 255)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id", nullable = false)
    private User performedByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
