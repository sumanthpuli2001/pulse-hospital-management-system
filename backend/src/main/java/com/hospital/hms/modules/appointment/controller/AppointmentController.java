package com.hospital.hms.modules.appointment.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.appointment.dto.*;
import com.hospital.hms.modules.appointment.service.AppointmentService;
import com.hospital.hms.modules.patient.dto.PatientResponse;
import com.hospital.hms.modules.patient.service.PatientService;
import com.hospital.hms.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments & Scheduling", description = "Endpoints for booking, calendar schedules, check-in, and conflict-free rescheduling")
@SecurityRequirement(name = "Bearer Authentication")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final PatientService patientService;

    @GetMapping
    @Operation(summary = "Filter appointments (Staff or Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ACCOUNTANT') or hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<AppointmentResponse>>> filterAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        // If caller is a patient, strictly restrict to their own patient ID
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            PatientResponse myProfile = patientService.getPatientByUserId(userDetails.getId());
            patientId = myProfile.getId();
        }

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PagedResponse<AppointmentResponse> response = appointmentService.filterAppointments(doctorId, patientId, date, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointments retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment details by ID")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(@appointmentService.getAppointmentById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment retrieved"));
    }

    @GetMapping("/doctor/{doctorId}/daily")
    @Operation(summary = "Get daily appointment schedule for doctor")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorDailySchedule(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<AppointmentResponse> list = appointmentService.getDoctorDailyAppointments(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success(list, "Doctor daily schedule retrieved"));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get appointment history for patient")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(@PathVariable Long patientId) {
        List<AppointmentResponse> list = appointmentService.getPatientAppointments(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Patient appointments retrieved"));
    }

    @PostMapping
    @Operation(summary = "Book appointment (Staff or Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST') or (hasRole('PATIENT') and @patientService.getPatientById(#request.patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AppointmentResponse response = appointmentService.bookAppointment(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Appointment booked successfully"));
    }

    @PutMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule appointment with conflict validation")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST') or (hasRole('PATIENT') and @patientService.getPatientById(@appointmentService.getAppointmentById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRescheduleRequest request) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment rescheduled successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status (Check-in, Complete, Cancel)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody(required = false) AppointmentStatusUpdateRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String notes) {
        if (request == null) {
            request = new AppointmentStatusUpdateRequest();
            request.setStatus(status != null ? status : "CHECKED_IN");
            request.setNotes(notes);
        } else if (request.getStatus() == null && status != null) {
            request.setStatus(status);
            if (request.getNotes() == null) {
                request.setNotes(notes);
            }
        }
        AppointmentResponse response = appointmentService.updateAppointmentStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Appointment status updated"));
    }
}
