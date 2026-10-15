package com.hospital.hms.modules.laboratory.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.laboratory.dto.*;
import com.hospital.hms.modules.laboratory.service.LaboratoryService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/laboratory")
@RequiredArgsConstructor
@Tag(name = "Laboratory Management", description = "Endpoints for diagnostic test catalog, orders, barcode specimen tracking, and results entry")
@SecurityRequirement(name = "Bearer Authentication")
public class LaboratoryController {

    private final LaboratoryService laboratoryService;
    private final PatientService patientService;

    // --- Catalog ---
    @GetMapping("/tests")
    @Operation(summary = "Get active laboratory test catalog")
    public ResponseEntity<ApiResponse<List<LabTestResponse>>> getActiveTests() {
        List<LabTestResponse> list = laboratoryService.getActiveTests();
        return ResponseEntity.ok(ApiResponse.success(list, "Lab test catalog retrieved"));
    }

    @PostMapping("/tests")
    @Operation(summary = "Create lab test in catalog (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> createLabTest(@Valid @RequestBody LabTestRequest request) {
        LabTestResponse response = laboratoryService.createLabTest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Lab test added to catalog"));
    }

    @PutMapping("/tests/{id}")
    @Operation(summary = "Update lab test in catalog (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<LabTestResponse>> updateLabTest(@PathVariable Long id, @Valid @RequestBody LabTestRequest request) {
        LabTestResponse response = laboratoryService.updateLabTest(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Lab test updated successfully"));
    }

    @DeleteMapping("/tests/{id}")
    @Operation(summary = "Deactivate/delete lab test (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLabTest(@PathVariable Long id) {
        laboratoryService.deleteLabTest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Lab test deactivated successfully"));
    }

    // --- Orders ---
    @PostMapping("/orders")
    @Operation(summary = "Create laboratory order (Doctor only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<LabOrderResponse>> createLabOrder(@Valid @RequestBody LabOrderRequest request) {
        LabOrderResponse response = laboratoryService.createLabOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Laboratory order placed successfully"));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Get lab order by ID")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN') or (hasRole('PATIENT') and @patientService.getPatientById(@laboratoryService.getLabOrderById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<LabOrderResponse>> getLabOrderById(@PathVariable Long id) {
        LabOrderResponse response = laboratoryService.getLabOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lab order retrieved"));
    }

    @GetMapping("/orders")
    @Operation(summary = "Filter laboratory orders (Staff or Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'ACCOUNTANT') or hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<LabOrderResponse>>> filterLabOrders(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            patientId = patientService.getPatientByUserId(userDetails.getId()).getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("orderDate").descending());
        PagedResponse<LabOrderResponse> response = laboratoryService.filterLabOrders(patientId, doctorId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lab orders retrieved successfully"));
    }

    @GetMapping("/patient/{patientId}/orders")
    @Operation(summary = "Get lab order history for patient")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<LabOrderResponse>>> getPatientLabOrders(@PathVariable Long patientId) {
        List<LabOrderResponse> list = laboratoryService.getPatientLabOrders(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Patient lab history retrieved"));
    }

    // --- Specimen Collection & Results ---
    @PatchMapping("/order-items/{orderItemId}/collect-sample")
    @Operation(summary = "Record specimen collection and assign barcode (Lab Tech, Nurse, Doctor, Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'NURSE')")
    public ResponseEntity<ApiResponse<LabOrderItemResponse>> collectSpecimen(
            @PathVariable Long orderItemId,
            @RequestBody(required = false) SpecimenCollectionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LabOrderItemResponse response = laboratoryService.collectSpecimen(orderItemId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Specimen collected and barcode assigned"));
    }

    @PostMapping("/order-items/{orderItemId}/results")
    @Operation(summary = "Enter and verify laboratory test results (Lab Tech, Doctor, Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'LAB_TECHNICIAN')")
    public ResponseEntity<ApiResponse<LabResultResponse>> enterResult(
            @PathVariable Long orderItemId,
            @Valid @RequestBody LabResultEntryRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        LabResultResponse response = laboratoryService.enterResult(orderItemId, request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Test result recorded successfully"));
    }
}
