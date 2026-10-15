package com.hospital.hms.modules.pharmacy.dto;

import com.hospital.hms.modules.pharmacy.entity.InventoryTransaction;
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
public class InventoryTransactionResponse {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private Long batchId;
    private String batchNumber;
    private String transactionType;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String referenceId;
    private String referenceType;
    private String notes;
    private Long performedByUserId;
    private String performedByUserName;
    private LocalDateTime createdAt;

    public static InventoryTransactionResponse fromEntity(InventoryTransaction t) {
        if (t == null) return null;

        return InventoryTransactionResponse.builder()
                .id(t.getId())
                .medicineId(t.getMedicine() != null ? t.getMedicine().getId() : null)
                .medicineName(t.getMedicine() != null ? t.getMedicine().getName() : null)
                .batchId(t.getBatch() != null ? t.getBatch().getId() : null)
                .batchNumber(t.getBatch() != null ? t.getBatch().getBatchNumber() : null)
                .transactionType(t.getTransactionType())
                .quantity(t.getQuantity())
                .unitPrice(t.getUnitPrice())
                .referenceId(t.getReferenceId())
                .referenceType(t.getReferenceType())
                .notes(t.getNotes())
                .performedByUserId(t.getPerformedByUser() != null ? t.getPerformedByUser().getId() : null)
                .performedByUserName(t.getPerformedByUser() != null ?
                        t.getPerformedByUser().getFirstName() + " " + t.getPerformedByUser().getLastName() : null)
                .createdAt(t.getCreatedAt())
                .build();
    }
}
