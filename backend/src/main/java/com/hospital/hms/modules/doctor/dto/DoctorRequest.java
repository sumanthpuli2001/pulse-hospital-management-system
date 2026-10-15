package com.hospital.hms.modules.doctor.dto;

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
public class DoctorRequest {

    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String gender;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotBlank(message = "Medical license number is required")
    private String licenseNumber;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Qualifications are required")
    private String qualifications;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.00", message = "Fee cannot be negative")
    private BigDecimal consultationFee;

    private String roomNumber;
    private String bio;

    @Builder.Default
    private boolean available = true;

    @Builder.Default
    private boolean active = true;
}
