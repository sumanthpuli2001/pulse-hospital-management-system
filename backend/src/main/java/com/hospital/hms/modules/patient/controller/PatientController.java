package com.hospital.hms.modules.patient.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.UnauthorizedException;
import com.hospital.hms.modules.patient.dto.PatientRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients")
@RequiredArgsConstructor
@Tag(name = "Patients & Registry", description = "Endpoints for patient intake, registration, medical summary, and demographic profiles")
@SecurityRequirement(name = "Bearer Authentication")
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @Operation(summary = "Search and filter hospital patients")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PagedResponse<PatientResponse>>> searchPatients(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PagedResponse<PatientResponse> response = patientService.searchPatients(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Patients retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient record by ID (Clinical Staff or Owning Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(#id).userId == principal.id)")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientById(@PathVariable Long id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient details retrieved"));
    }

    @GetMapping("/code/{patientCode}")
    @Operation(summary = "Get patient by Unique Patient Code")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatientByCode(@PathVariable String patientCode) {
        PatientResponse response = patientService.getPatientByCode(patientCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient details retrieved"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated patient's own profile (Patient Portal)")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientResponse>> getMyPatientProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        PatientResponse response = patientService.getPatientByUserId(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Own patient profile retrieved"));
    }

    @PostMapping
    @Operation(summary = "Register new patient (Receptionist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<PatientResponse>> registerPatient(@Valid @RequestBody PatientRequest request) {
        PatientResponse response = patientService.registerPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Patient registered successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update patient record (Staff or Owning Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST') or (hasRole('PATIENT') and @patientService.getPatientById(#id).userId == principal.id)")
    public ResponseEntity<ApiResponse<PatientResponse>> updatePatient(@PathVariable Long id,
                                                                      @Valid @RequestBody PatientRequest request,
                                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        // Enforce ownership: patient role cannot change another patient's profile
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            PatientResponse existing = patientService.getPatientById(id);
            if (existing.getUserId() == null || !existing.getUserId().equals(userDetails.getId())) {
                throw new UnauthorizedException("You are not authorized to update another patient's record");
            }
        }

        PatientResponse response = patientService.updatePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient record updated successfully"));
    }
}
