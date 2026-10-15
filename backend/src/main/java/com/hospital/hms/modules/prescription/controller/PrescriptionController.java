package com.hospital.hms.modules.prescription.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.patient.service.PatientService;
import com.hospital.hms.modules.prescription.dto.PrescriptionFulfillmentRequest;
import com.hospital.hms.modules.prescription.dto.PrescriptionRequest;
import com.hospital.hms.modules.prescription.dto.PrescriptionResponse;
import com.hospital.hms.modules.prescription.service.PrescriptionService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescription Management", description = "Endpoints for doctor-created electronic prescriptions and pharmacy fulfillment")
@SecurityRequirement(name = "Bearer Authentication")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PatientService patientService;

    @PostMapping
    @Operation(summary = "Create electronic prescription (Doctor only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @Valid @RequestBody PrescriptionRequest request) {
        PrescriptionResponse response = prescriptionService.createPrescription(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Prescription created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get prescription by ID")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(@prescriptionService.getPrescriptionById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getPrescriptionById(@PathVariable Long id) {
        PrescriptionResponse response = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescription retrieved"));
    }

    @GetMapping
    @Operation(summary = "Filter prescriptions (Clinical Staff or Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'ACCOUNTANT') or hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<PrescriptionResponse>>> filterPrescriptions(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            patientId = patientService.getPatientByUserId(userDetails.getId()).getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("issueDate").descending());
        PagedResponse<PrescriptionResponse> response = prescriptionService.filterPrescriptions(patientId, doctorId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescriptions retrieved successfully"));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get prescriptions for patient")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPatientPrescriptions(@PathVariable Long patientId) {
        List<PrescriptionResponse> list = prescriptionService.getPatientPrescriptions(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Patient prescriptions retrieved"));
    }

    @PatchMapping("/{id}/fulfill")
    @Operation(summary = "Dispense prescription medications (Pharmacist only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> fulfillPrescription(
            @PathVariable Long id,
            @RequestBody PrescriptionFulfillmentRequest request) {
        List<Long> dispensedItemIds = (request != null && request.getDispensedItemIds() != null)
                ? request.getDispensedItemIds()
                : List.of();
        PrescriptionResponse response = prescriptionService.fulfillPrescription(id, dispensedItemIds);
        return ResponseEntity.ok(ApiResponse.success(response, "Prescription fulfillment status updated"));
    }
}
