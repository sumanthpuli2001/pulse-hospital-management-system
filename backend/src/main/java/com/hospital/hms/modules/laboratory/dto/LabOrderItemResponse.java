package com.hospital.hms.modules.laboratory.dto;

import com.hospital.hms.modules.laboratory.entity.LabOrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabOrderItemResponse {

    private Long id;
    private Long testId;
    private String testCode;
    private String testName;
    private String category;
    private String sampleType;
    private String status;
    private String sampleBarcode;
    private LocalDateTime collectedAt;
    private String collectedByUserName;
    private BigDecimal price;
    private List<LabResultResponse> results;

    public static LabOrderItemResponse fromEntity(LabOrderItem item) {
        List<LabResultResponse> resultList = item.getResults() != null
                ? item.getResults().stream().map(LabResultResponse::fromEntity).collect(Collectors.toList())
                : List.of();

        return LabOrderItemResponse.builder()
                .id(item.getId())
                .testId(item.getTest().getId())
                .testCode(item.getTest().getTestCode())
                .testName(item.getTest().getTestName())
                .category(item.getTest().getCategory())
                .sampleType(item.getTest().getSampleType())
                .status(item.getStatus())
                .sampleBarcode(item.getSampleBarcode())
                .collectedAt(item.getCollectedAt())
                .collectedByUserName(item.getCollectedByUser() != null ? item.getCollectedByUser().getFirstName() + " " + item.getCollectedByUser().getLastName() : null)
                .price(item.getPrice())
                .results(resultList)
                .build();
    }
}
