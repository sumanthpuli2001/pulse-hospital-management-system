package com.hospital.hms.modules.doctor.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.doctor.dto.*;
import com.hospital.hms.modules.doctor.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors & Rosters", description = "Endpoints for doctor registration, specializations, consultation fees, and schedule rosters")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @Operation(summary = "Search and filter hospital doctors")
    public ResponseEntity<ApiResponse<PagedResponse<DoctorResponse>>> searchDoctors(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PagedResponse<DoctorResponse> response = doctorService.searchDoctors(departmentId, specialization, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctors retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor profile by ID")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse response = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor profile retrieved"));
    }

    @GetMapping("/{id}/schedules")
    @Operation(summary = "Get weekly availability schedules for doctor")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getDoctorSchedules(@PathVariable Long id) {
        List<DoctorScheduleResponse> schedules = doctorService.getDoctorSchedules(id);
        return ResponseEntity.ok(ApiResponse.success(schedules, "Doctor schedules retrieved"));
    }

    @PostMapping
    @Operation(summary = "Register new doctor (Hospital Admin only)", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Doctor registered successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update doctor profile (Admin or Self)", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN') or (hasRole('DOCTOR') and @doctorService.getDoctorById(#id).userId == principal.id)")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(@PathVariable Long id,
                                                                    @Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor updated successfully"));
    }

    @PostMapping("/{id}/schedules")
    @Operation(summary = "Add schedule slot for doctor (Admin or Doctor)", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> addDoctorSchedule(
            @PathVariable Long id,
            @Valid @RequestBody DoctorScheduleRequest request) {
        DoctorScheduleResponse response = doctorService.addDoctorSchedule(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Schedule slot created successfully"));
    }

    @DeleteMapping("/schedules/{scheduleId}")
    @Operation(summary = "Delete doctor schedule slot (Admin or Doctor)", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteDoctorSchedule(@PathVariable Long scheduleId) {
        doctorService.deleteDoctorSchedule(scheduleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Schedule slot removed successfully"));
    }
}
