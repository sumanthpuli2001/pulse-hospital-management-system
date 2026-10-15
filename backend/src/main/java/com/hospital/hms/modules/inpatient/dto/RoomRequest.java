package com.hospital.hms.modules.inpatient.dto;

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
public class RoomRequest {

    @NotNull(message = "Ward ID is required")
    private Long wardId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Room type is required (PRIVATE, SEMI_PRIVATE, GENERAL_WARD, DELUXE, ICU_ISOLATION)")
    private String roomType;

    @NotNull(message = "Daily rate is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Daily rate must be non-negative")
    private BigDecimal dailyRate;
}
