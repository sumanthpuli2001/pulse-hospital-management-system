package com.hospital.hms.modules.laboratory.dto;

import com.hospital.hms.modules.laboratory.entity.LabResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabResultResponse {

    private Long id;
    private Long orderItemId;
    private Long testId;
    private String testName;
    private String performedByUserName;
    private String verifiedByUserName;
    private String parameterName;
    private String resultValue;
    private String referenceRange;
    private String unit;
    private boolean abnormal;
    private String remarks;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;

    public static LabResultResponse fromEntity(LabResult r) {
        return LabResultResponse.builder()
                .id(r.getId())
                .orderItemId(r.getOrderItem().getId())
                .testId(r.getTest().getId())
                .testName(r.getTest().getTestName())
                .performedByUserName(r.getPerformedByUser().getFirstName() + " " + r.getPerformedByUser().getLastName())
                .verifiedByUserName(r.getVerifiedByUser() != null ? r.getVerifiedByUser().getFirstName() + " " + r.getVerifiedByUser().getLastName() : null)
                .parameterName(r.getParameterName())
                .resultValue(r.getResultValue())
                .referenceRange(r.getReferenceRange())
                .unit(r.getUnit())
                .abnormal(r.isAbnormal())
                .remarks(r.getRemarks())
                .verifiedAt(r.getVerifiedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
