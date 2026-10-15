package com.hospital.hms.modules.doctor.dto;

import com.hospital.hms.modules.doctor.entity.Doctor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private Long id;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Long departmentId;
    private String departmentName;
    private String licenseNumber;
    private String specialization;
    private String qualifications;
    private BigDecimal consultationFee;
    private String roomNumber;
    private String bio;
    private String gender;
    private boolean available;
    private boolean active;

    public static DoctorResponse fromEntity(Doctor doctor) {
        String fName = doctor.getUser() != null ? doctor.getUser().getFirstName() : "";
        String lName = doctor.getUser() != null ? doctor.getUser().getLastName() : "";
        return DoctorResponse.builder()
                .id(doctor.getId())
                .userId(doctor.getUser() != null ? doctor.getUser().getId() : null)
                .username(doctor.getUser() != null ? doctor.getUser().getUsername() : null)
                .firstName(fName)
                .lastName(lName)
                .fullName("Dr. " + fName + " " + lName)
                .email(doctor.getUser().getEmail())
                .phoneNumber(doctor.getUser().getPhoneNumber())
                .gender(doctor.getGender() != null ? doctor.getGender() : "MALE")
                .departmentId(doctor.getDepartment().getId())
                .departmentName(doctor.getDepartment().getName())
                .licenseNumber(doctor.getLicenseNumber())
                .specialization(doctor.getSpecialization())
                .qualifications(doctor.getQualifications())
                .consultationFee(doctor.getConsultationFee())
                .roomNumber(doctor.getRoomNumber())
                .bio(doctor.getBio())
                .available(doctor.isAvailable())
                .active(doctor.isActive())
                .build();
    }
}
