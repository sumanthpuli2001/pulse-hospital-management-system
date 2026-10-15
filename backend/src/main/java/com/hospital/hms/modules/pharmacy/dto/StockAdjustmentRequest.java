package com.hospital.hms.modules.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentRequest {

    private Integer adjustmentQuantity;
    private Integer quantityChange;

    private String transactionType; // ADJUSTMENT, EXPIRED_DISCARD, RETURN, DAMAGED
    private String adjustmentType;

    @NotBlank(message = "Notes/justification required for audit compliance")
    private String notes;

    public Integer getAdjustmentQuantity() {
        return adjustmentQuantity != null ? adjustmentQuantity : quantityChange;
    }

    public void setAdjustmentQuantity(Integer adjustmentQuantity) {
        this.adjustmentQuantity = adjustmentQuantity;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
        if (this.adjustmentQuantity == null) {
            this.adjustmentQuantity = quantityChange;
        }
    }

    public String getTransactionType() {
        if (transactionType != null && !transactionType.isBlank()) {
            return transactionType;
        }
        return adjustmentType != null && !adjustmentType.isBlank() ? adjustmentType : "ADJUSTMENT";
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public void setAdjustmentType(String adjustmentType) {
        this.adjustmentType = adjustmentType;
        if (this.transactionType == null || this.transactionType.isBlank()) {
            this.transactionType = adjustmentType;
        }
    }
}
