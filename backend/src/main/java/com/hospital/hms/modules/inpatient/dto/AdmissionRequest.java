package com.hospital.hms.modules.inpatient.dto;

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
public class AdmissionRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private Long admittingDoctorId;
    private Long doctorId;

    @NotNull(message = "Bed ID for immediate allocation is required")
    private Long bedId;

    @NotBlank(message = "Reason for admission is required")
    private String admissionReason;

    private String notes;

    public Long getAdmittingDoctorId() {
        return this.admittingDoctorId != null ? this.admittingDoctorId : this.doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
        if (this.admittingDoctorId == null) {
            this.admittingDoctorId = doctorId;
        }
    }
}
