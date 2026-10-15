package com.hospital.hms.modules.prescription.dto;

import com.hospital.hms.modules.prescription.entity.PrescriptionItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItemResponse {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private String dosage;
    private String frequency;
    private String route;
    private int durationDays;
    private int quantity;
    private String instructions;
    private boolean isDispensed;
    private int dispensedQuantity;

    public static PrescriptionItemResponse fromEntity(PrescriptionItem item) {
        return PrescriptionItemResponse.builder()
                .id(item.getId())
                .medicineId(item.getMedicineId())
                .medicineName(item.getMedicineName())
                .dosage(item.getDosage())
                .frequency(item.getFrequency())
                .route(item.getRoute())
                .durationDays(item.getDurationDays())
                .quantity(item.getQuantity())
                .instructions(item.getInstructions())
                .isDispensed(item.isDispensed())
                .dispensedQuantity(item.getDispensedQuantity())
                .build();
    }
}
