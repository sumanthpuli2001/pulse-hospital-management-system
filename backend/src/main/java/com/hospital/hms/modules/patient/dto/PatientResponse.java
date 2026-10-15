package com.hospital.hms.modules.patient.dto;

import com.hospital.hms.modules.patient.entity.Patient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.Period;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {

    private Long id;
    private Long userId;
    private String patientCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private LocalDate dateOfBirth;
    private int age;
    private String gender;
    private String bloodGroup;
    private String maritalStatus;
    private String phoneNumber;
    private String email;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    private boolean active;
    private String portalUsername;

    public static PatientResponse fromEntity(Patient patient) {
        int calculatedAge = patient.getDateOfBirth() != null 
                ? Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears() 
                : 0;

        return PatientResponse.builder()
                .id(patient.getId())
                .userId(patient.getUser() != null ? patient.getUser().getId() : null)
                .portalUsername(patient.getUser() != null ? patient.getUser().getUsername() : null)
                .patientCode(patient.getPatientCode())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .fullName(patient.getFirstName() + " " + patient.getLastName())
                .dateOfBirth(patient.getDateOfBirth())
                .age(calculatedAge)
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .maritalStatus(patient.getMaritalStatus())
                .phoneNumber(patient.getPhoneNumber())
                .email(patient.getEmail())
                .address(patient.getAddress())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .emergencyContactRelationship(patient.getEmergencyContactRelationship())
                .active(patient.isActive())
                .build();
    }
}
