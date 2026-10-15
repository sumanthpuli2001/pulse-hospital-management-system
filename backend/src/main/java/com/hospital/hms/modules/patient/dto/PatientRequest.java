package com.hospital.hms.modules.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    private Long userId; // Optional linking to user portal account

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required (MALE, FEMALE, OTHER)")
    private String gender;

    private String bloodGroup;
    private String maritalStatus;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private String email;
    private String address;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    @Builder.Default
    private boolean active = true;
}
