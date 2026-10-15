package com.hospital.hms.modules.patient.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.patient.dto.PatientRequest;
import com.hospital.hms.modules.patient.dto.PatientResponse;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.Role;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.RoleRepository;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PagedResponse<PatientResponse> searchPatients(String query, Pageable pageable) {
        Page<Patient> page = patientRepository.searchPatients(query, pageable);
        List<PatientResponse> content = page.getContent().stream()
                .map(PatientResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));
        return PatientResponse.fromEntity(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientByCode(String code) {
        Patient patient = patientRepository.findByPatientCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "code", code));
        return PatientResponse.fromEntity(patient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientByUserId(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "userId", userId));
        return PatientResponse.fromEntity(patient);
    }

    @Transactional
    public PatientResponse registerPatient(PatientRequest request) {
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            String rawPhone = request.getPhoneNumber().trim();
            String digits = rawPhone.replaceAll("[^0-9]", "");
            if (patientRepository.existsByPhoneNumber(rawPhone) || 
                (digits.length() >= 10 && (patientRepository.existsByPhoneNumber(digits) || 
                 patientRepository.existsByPhoneNumber("+91 " + digits.substring(digits.length() - 10)) || 
                 patientRepository.existsByPhoneNumber("+91" + digits.substring(digits.length() - 10))))) {
                throw new BadRequestException("Duplicate data is not allowed: A patient with phone number " + rawPhone + " is already registered.");
            }
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String email = request.getEmail().trim().toLowerCase();
            if (userRepository.existsByEmail(email)) {
                throw new BadRequestException("Duplicate data is not allowed: A patient with email " + email + " is already registered.");
            }
        }

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
            if (patientRepository.findByUserId(request.getUserId()).isPresent()) {
                throw new BadRequestException("A patient profile is already linked to this user account");
            }
        }

        if (user == null) {
            String baseUsername = (request.getFirstName().trim().toLowerCase() + "." + request.getLastName().trim().toLowerCase()).replaceAll("[^a-z0-9.]", "");
            if (baseUsername.isEmpty() || baseUsername.equals(".")) {
                baseUsername = "patient";
            }
            String username = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + counter++;
            }

            String email = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                    ? request.getEmail().trim().toLowerCase()
                    : username + "@hospital.com";
            if (userRepository.existsByEmail(email)) {
                email = username + (System.currentTimeMillis() % 10000) + "@hospital.com";
            }

            Role patientRole = roleRepository.findByName("ROLE_PATIENT")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_PATIENT").description("Patient portal user").build()));

            user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("Password@123"))
                    .firstName(request.getFirstName().trim())
                    .lastName(request.getLastName().trim())
                    .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                    .isActive(true)
                    .isAccountLocked(false)
                    .roles(Set.of(patientRole))
                    .build();
            user = userRepository.save(user);
        }

        String patientCode = generatePatientCode();

        Patient patient = Patient.builder()
                .user(user)
                .patientCode(patientCode)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender().toUpperCase())
                .bloodGroup(request.getBloodGroup())
                .maritalStatus(request.getMaritalStatus())
                .phoneNumber(request.getPhoneNumber().trim())
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .address(request.getAddress())
                .emergencyContactName(request.getEmergencyContactName())
                .emergencyContactPhone(request.getEmergencyContactPhone())
                .emergencyContactRelationship(request.getEmergencyContactRelationship())
                .isActive(request.isActive())
                .build();

        return PatientResponse.fromEntity(patientRepository.save(patient));
    }

    @Transactional
    public PatientResponse updatePatient(Long id, PatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", id));

        patient.setFirstName(request.getFirstName().trim());
        patient.setLastName(request.getLastName().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().toUpperCase());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setMaritalStatus(request.getMaritalStatus());
        patient.setPhoneNumber(request.getPhoneNumber().trim());
        patient.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        patient.setAddress(request.getAddress());
        patient.setEmergencyContactName(request.getEmergencyContactName());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone());
        patient.setEmergencyContactRelationship(request.getEmergencyContactRelationship());
        patient.setActive(request.isActive());

        return PatientResponse.fromEntity(patientRepository.save(patient));
    }

    private synchronized String generatePatientCode() {
        long count = patientRepository.countTotalPatients() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("PAT-%s-%04d", year, count);
        while (patientRepository.existsByPatientCode(code)) {
            count++;
            code = String.format("PAT-%s-%04d", year, count);
        }
        return code;
    }
}
