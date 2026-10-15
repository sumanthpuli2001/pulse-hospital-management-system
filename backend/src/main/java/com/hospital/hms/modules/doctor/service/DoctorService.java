package com.hospital.hms.modules.doctor.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.department.entity.Department;
import com.hospital.hms.modules.department.repository.DepartmentRepository;
import com.hospital.hms.modules.doctor.dto.*;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.entity.DoctorSchedule;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.doctor.repository.DoctorScheduleRepository;
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

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PagedResponse<DoctorResponse> searchDoctors(Long departmentId, String specialization, String search, Pageable pageable) {
        Page<Doctor> page = doctorRepository.searchDoctors(departmentId, specialization, search, pageable);
        List<DoctorResponse> content = page.getContent().stream()
                .map(DoctorResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        return DoctorResponse.fromEntity(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", userId));
        return DoctorResponse.fromEntity(doctor);
    }

    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new BadRequestException("License number already registered: " + request.getLicenseNumber());
        }

        User user = null;
        if (request.getUserId() != null) {
            if (doctorRepository.existsByUserId(request.getUserId())) {
                throw new BadRequestException("Doctor profile already exists for this user account");
            }
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        } else {
            // Auto create doctor user account
            String cleanName = (request.getFirstName() != null ? request.getFirstName().trim().toLowerCase() : "specialist")
                    .replaceAll("[^a-z0-9]", "");
            if (cleanName.isEmpty()) cleanName = "doctor";
            String baseUsername = "dr." + cleanName;
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

            Role doctorRole = roleRepository.findByName("ROLE_DOCTOR")
                    .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_DOCTOR").description("Medical doctor").build()));

            user = User.builder()
                    .username(username)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("Password@123"))
                    .firstName(request.getFirstName() != null ? request.getFirstName().trim() : "Doctor")
                    .lastName(request.getLastName() != null ? request.getLastName().trim() : "Physician")
                    .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                    .isActive(true)
                    .isAccountLocked(false)
                    .roles(Set.of(doctorRole))
                    .build();
            user = userRepository.save(user);
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        Doctor doctor = Doctor.builder()
                .user(user)
                .department(dept)
                .licenseNumber(request.getLicenseNumber().trim())
                .specialization(request.getSpecialization().trim())
                .qualifications(request.getQualifications().trim())
                .consultationFee(request.getConsultationFee())
                .roomNumber(request.getRoomNumber())
                .bio(request.getBio())
                .gender(request.getGender() != null ? request.getGender().toUpperCase() : "MALE")
                .isAvailable(request.isAvailable())
                .isActive(request.isActive())
                .build();

        return DoctorResponse.fromEntity(doctorRepository.save(doctor));
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        doctor.setDepartment(dept);
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setQualifications(request.getQualifications().trim());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setRoomNumber(request.getRoomNumber());
        doctor.setBio(request.getBio());
        if (request.getGender() != null) {
            doctor.setGender(request.getGender().toUpperCase());
        }
        doctor.setAvailable(request.isAvailable());
        doctor.setActive(request.isActive());

        // Update underlying user profile details if provided
        if (doctor.getUser() != null) {
            User u = doctor.getUser();
            if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
                u.setFirstName(request.getFirstName().trim());
            }
            if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
                u.setLastName(request.getLastName().trim());
            }
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                u.setEmail(request.getEmail().trim());
            }
            if (request.getPhoneNumber() != null) {
                u.setPhoneNumber(request.getPhoneNumber().trim());
            }
            userRepository.save(u);
        }

        return DoctorResponse.fromEntity(doctorRepository.save(doctor));
    }

    @Transactional(readOnly = true)
    public List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId) {
        return doctorScheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream()
                .map(DoctorScheduleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorScheduleResponse addDoctorSchedule(Long doctorId, DoctorScheduleRequest request) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Validate schedule conflict: check for duplicate or overlapping active slots on the same day
        List<DoctorSchedule> existingSlots = doctorScheduleRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, request.getDayOfWeek().toUpperCase());
        for (DoctorSchedule existing : existingSlots) {
            if (request.getStartTime().isBefore(existing.getEndTime()) && existing.getStartTime().isBefore(request.getEndTime())) {
                String docName = doctor.getUser() != null ? (doctor.getUser().getFirstName() + " " + doctor.getUser().getLastName()) : "Physician";
                throw new BadRequestException("Schedule Conflict: Dr. " + docName +
                        " already has an active consultation shift on " + request.getDayOfWeek().toUpperCase() +
                        " between " + existing.getStartTime() + " and " + existing.getEndTime() + ". Duplicate or overlapping shifts are not permitted.");
            }
        }

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(request.getDayOfWeek().toUpperCase())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotDurationMinutes(request.getSlotDurationMinutes())
                .maxPatientsPerSlot(request.getMaxPatientsPerSlot())
                .isActive(request.isActive())
                .build();

        return DoctorScheduleResponse.fromEntity(doctorScheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteDoctorSchedule(Long scheduleId) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", scheduleId));
        doctorScheduleRepository.delete(schedule);
    }
}
