package com.hospital.hms.modules.pharmacy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineRequest {

    @NotBlank(message = "Medicine brand name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Generic name is required")
    @Size(max = 100, message = "Generic name must not exceed 100 characters")
    private String genericName;

    @com.fasterxml.jackson.annotation.JsonProperty("sku")
    @Size(max = 50, message = "SKU must not exceed 50 characters")
    private String sku;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category; // ANTIBIOTIC, ANALGESIC, ANTIHYPERTENSIVE, etc.

    @com.fasterxml.jackson.annotation.JsonProperty("unitOfMeasure")
    @com.fasterxml.jackson.annotation.JsonAlias({"dosageForm", "unitOfMeasure"})
    @Size(max = 20, message = "Unit of measure must not exceed 20 characters")
    private String unitOfMeasure; // TABLET, CAPSULE, VIAL, SYRUP_ML

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @com.fasterxml.jackson.annotation.JsonProperty("costPrice")
    @com.fasterxml.jackson.annotation.JsonAlias({"cost", "costPrice"})
    private BigDecimal costPrice;

    @NotNull(message = "Reorder level is required")
    private Integer reorderLevel;

    @Builder.Default
    private boolean requiresPrescription = true;

    @Builder.Default
    private boolean isActive = true;
}
