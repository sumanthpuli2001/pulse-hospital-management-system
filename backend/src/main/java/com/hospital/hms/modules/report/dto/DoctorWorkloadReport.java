package com.hospital.hms.modules.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorWorkloadReport {

    private Long doctorId;
    private String doctorName;
    private String departmentName;
    private long totalAppointments;
    private long completedAppointments;
    private long activeInpatients;
}
