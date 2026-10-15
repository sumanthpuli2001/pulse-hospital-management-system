package com.hospital.hms.modules.appointment.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.appointment.dto.*;
import com.hospital.hms.modules.appointment.entity.Appointment;
import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    private static final Set<String> INACTIVE_STATUSES = Set.of("CANCELLED", "NO_SHOW");

    @Transactional(readOnly = true)
    public PagedResponse<AppointmentResponse> filterAppointments(Long doctorId, Long patientId, LocalDate date, String status, Pageable pageable) {
        Page<Appointment> page = appointmentRepository.filterAppointments(doctorId, patientId, date, status, pageable);
        List<AppointmentResponse> content = page.getContent().stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment apt = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));
        return AppointmentResponse.fromEntity(apt);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getDoctorDailyAppointments(Long doctorId, LocalDate date) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(doctorId, date).stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId).stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public AppointmentResponse bookAppointment(AppointmentBookingRequest request, Long createdByUserId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        if (!patient.isActive()) {
            throw new BadRequestException("Cannot book appointment for inactive patient record");
        }

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));
        if (!doctor.isActive() || !doctor.isAvailable()) {
            throw new BadRequestException("Doctor is currently not available for bookings");
        }

        int duration = request.getDurationMinutes() != null && request.getDurationMinutes() > 0 
                ? request.getDurationMinutes() : 15;
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        // Transactional Double-Booking Prevention Check
        boolean hasConflict = appointmentRepository.hasOverlappingBooking(
                doctor.getId(),
                request.getAppointmentDate(),
                startTime,
                endTime,
                INACTIVE_STATUSES
        );

        if (hasConflict) {
            throw new BadRequestException(String.format(
                    "Doctor %s already has a scheduled appointment overlapping %s - %s on %s. Please select an alternate slot.",
                    doctor.getUser().getFirstName() + " " + doctor.getUser().getLastName(),
                    startTime,
                    endTime,
                    request.getAppointmentDate()
            ));
        }

        User creator = null;
        if (createdByUserId != null) {
            creator = userRepository.findById(createdByUserId).orElse(null);
        }

        Appointment appointment = Appointment.builder()
                .appointmentNumber(generateAppointmentNumber())
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .startTime(startTime)
                .endTime(endTime)
                .reasonForVisit(request.getReasonForVisit())
                .status("SCHEDULED")
                .notes(request.getNotes())
                .createdBy(creator)
                .build();

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public AppointmentResponse rescheduleAppointment(Long id, AppointmentRescheduleRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        if ("COMPLETED".equals(appointment.getStatus()) || "CANCELLED".equals(appointment.getStatus())) {
            throw new BadRequestException("Cannot reschedule appointment with status: " + appointment.getStatus());
        }

        int duration = request.getDurationMinutes() != null && request.getDurationMinutes() > 0 
                ? request.getDurationMinutes() 
                : (int) java.time.Duration.between(appointment.getStartTime(), appointment.getEndTime()).toMinutes();
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        boolean hasConflict = appointmentRepository.hasOverlappingBooking(
                appointment.getDoctor().getId(),
                request.getAppointmentDate(),
                startTime,
                endTime,
                INACTIVE_STATUSES
        );

        if (hasConflict) {
            throw new BadRequestException("Doctor has a conflicting appointment during the newly requested time slot.");
        }

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        if (request.getReason() != null) {
            appointment.setNotes((appointment.getNotes() != null ? appointment.getNotes() + " | " : "") + "Rescheduled: " + request.getReason());
        }

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long id, AppointmentStatusUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", id));

        String newStatus = request.getStatus().toUpperCase();
        appointment.setStatus(newStatus);

        if ("CANCELLED".equals(newStatus) && request.getCancellationReason() != null) {
            appointment.setCancellationReason(request.getCancellationReason());
        }
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes());
        }

        return AppointmentResponse.fromEntity(appointmentRepository.save(appointment));
    }

    private synchronized String generateAppointmentNumber() {
        long count = appointmentRepository.countTotalAppointments() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("APT-%s-%04d", year, count);
        while (appointmentRepository.existsByAppointmentNumber(code)) {
            count++;
            code = String.format("APT-%s-%04d", year, count);
        }
        return code;
    }
}
