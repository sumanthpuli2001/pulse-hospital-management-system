package com.hospital.hms.modules.laboratory.dto;

import com.hospital.hms.modules.laboratory.entity.LabTest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabTestResponse {

    private Long id;
    private String testCode;
    private String testName;
    private String category;
    private String sampleType;
    private int standardTurnaroundHours;
    private BigDecimal cost;
    private String referenceRanges;
    private boolean active;

    @com.fasterxml.jackson.annotation.JsonProperty("code")
    public String getCode() {
        return testCode;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("name")
    public String getName() {
        return testName;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("price")
    public BigDecimal getPrice() {
        return cost;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("normalRange")
    public String getNormalRange() {
        return referenceRanges;
    }

    public static LabTestResponse fromEntity(LabTest t) {
        return LabTestResponse.builder()
                .id(t.getId())
                .testCode(t.getTestCode())
                .testName(t.getTestName())
                .category(t.getCategory())
                .sampleType(t.getSampleType())
                .standardTurnaroundHours(t.getStandardTurnaroundHours())
                .cost(t.getCost())
                .referenceRanges(t.getReferenceRanges())
                .active(t.isActive())
                .build();
    }
}
