package com.hospital.hms.modules.pharmacy.dto;

import com.hospital.hms.modules.pharmacy.entity.Medicine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineResponse {

    private Long id;
    private String name;
    private String genericName;
    private String sku;
    private String category;
    private String unitOfMeasure;
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private Integer reorderLevel;
    private Integer totalStock;
    private boolean isLowStock;
    private boolean requiresPrescription;
    private boolean isActive;
    private List<MedicineBatchResponse> batches;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MedicineResponse fromEntity(Medicine medicine, int totalStock, List<MedicineBatchResponse> batches) {
        if (medicine == null) return null;

        return MedicineResponse.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .sku(medicine.getSku())
                .category(medicine.getCategory())
                .unitOfMeasure(medicine.getUnitOfMeasure())
                .unitPrice(medicine.getUnitPrice())
                .costPrice(medicine.getCostPrice())
                .reorderLevel(medicine.getReorderLevel())
                .totalStock(totalStock)
                .isLowStock(totalStock <= medicine.getReorderLevel())
                .requiresPrescription(medicine.isRequiresPrescription())
                .isActive(medicine.isActive())
                .batches(batches)
                .createdAt(medicine.getCreatedAt())
                .updatedAt(medicine.getUpdatedAt())
                .build();
    }
}
