package com.hospital.hms.modules.laboratory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTestRequest {

    @com.fasterxml.jackson.annotation.JsonProperty("testCode")
    @com.fasterxml.jackson.annotation.JsonAlias({"code", "testCode"})
    @NotBlank(message = "Test code is required (e.g. CBC, LIPID, FBS)")
    private String testCode;

    @com.fasterxml.jackson.annotation.JsonProperty("testName")
    @com.fasterxml.jackson.annotation.JsonAlias({"name", "testName"})
    @NotBlank(message = "Test name is required")
    private String testName;

    @NotBlank(message = "Category is required (HEMATOLOGY, BIOCHEMISTRY, etc.)")
    private String category;

    private String sampleType;

    @Builder.Default
    private int standardTurnaroundHours = 24;

    @com.fasterxml.jackson.annotation.JsonProperty("cost")
    @com.fasterxml.jackson.annotation.JsonAlias({"price", "cost"})
    @NotNull(message = "Test cost is required")
    @DecimalMin(value = "0.00", message = "Cost cannot be negative")
    private BigDecimal cost;

    @com.fasterxml.jackson.annotation.JsonProperty("referenceRanges")
    @com.fasterxml.jackson.annotation.JsonAlias({"normalRange", "referenceRanges", "referenceRange"})
    private String referenceRanges;

    @Builder.Default
    private boolean active = true;
}
