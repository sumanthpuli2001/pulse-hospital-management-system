package com.hospital.hms.modules.pharmacy.dto;

import com.hospital.hms.modules.pharmacy.entity.MedicineBatch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineBatchResponse {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private String batchNumber;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private Integer quantityInStock;
    private BigDecimal unitCost;
    private String supplierName;
    private boolean isActive;
    private boolean isExpired;
    private boolean isExpiringSoon; // within 30 days
    private LocalDateTime createdAt;

    public static MedicineBatchResponse fromEntity(MedicineBatch batch) {
        if (batch == null) return null;

        LocalDate now = LocalDate.now();
        boolean expired = batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(now);
        boolean expiringSoon = batch.getExpiryDate() != null &&
                !batch.getExpiryDate().isBefore(now) &&
                batch.getExpiryDate().isBefore(now.plusDays(30));

        return MedicineBatchResponse.builder()
                .id(batch.getId())
                .medicineId(batch.getMedicine() != null ? batch.getMedicine().getId() : null)
                .medicineName(batch.getMedicine() != null ? batch.getMedicine().getName() : null)
                .batchNumber(batch.getBatchNumber())
                .manufacturingDate(batch.getManufacturingDate())
                .expiryDate(batch.getExpiryDate())
                .quantityInStock(batch.getQuantityInStock())
                .unitCost(batch.getUnitCost())
                .supplierName(batch.getSupplierName())
                .isActive(batch.isActive())
                .isExpired(expired)
                .isExpiringSoon(expiringSoon)
                .createdAt(batch.getCreatedAt())
                .build();
    }
}
