package com.hospital.hms.modules.inpatient.dto;

import jakarta.validation.constraints.Min;
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
public class WardRequest {

    @NotBlank(message = "Ward name is required")
    private String name;

    @NotBlank(message = "Ward type is required (GENERAL, ICU, CCU, MATERNITY, PEDIATRIC, POST_OP, ISOLATION)")
    private String wardType;

    private Long departmentId;

    @NotNull(message = "Floor number is required")
    private Integer floorNumber;

    @NotNull(message = "Ward capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Builder.Default
    private Integer capacity = 20;

    @Builder.Default
    private Boolean isActive = true;
}
