package com.hospital.hms.modules.doctor.dto;

import com.hospital.hms.modules.doctor.entity.DoctorSchedule;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorScheduleRequest {

    @NotBlank(message = "Day of week is required (e.g. MONDAY)")
    private String dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Builder.Default
    private int slotDurationMinutes = 15;

    @Builder.Default
    private int maxPatientsPerSlot = 1;

    @Builder.Default
    private boolean active = true;
}
