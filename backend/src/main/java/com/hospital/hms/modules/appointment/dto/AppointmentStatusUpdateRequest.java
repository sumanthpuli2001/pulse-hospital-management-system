package com.hospital.hms.modules.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatusUpdateRequest {

    @NotBlank(message = "Status is required (e.g. CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW)")
    private String status;

    private String cancellationReason;
    private String notes;
}
