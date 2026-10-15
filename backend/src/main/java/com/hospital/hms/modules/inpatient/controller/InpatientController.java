package com.hospital.hms.modules.inpatient.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.inpatient.dto.*;
import com.hospital.hms.modules.inpatient.service.InpatientService;
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
@RequestMapping("/api/v1/inpatient")
@RequiredArgsConstructor
@Tag(name = "Inpatient & Bed Management", description = "Endpoints for IPD admissions, wards, rooms, real-time bed board, transfers, and discharges")
@SecurityRequirement(name = "Bearer Authentication")
public class InpatientController {

    private final InpatientService inpatientService;
    private final PatientService patientService;

    // --- Ward & Room Setup ---
    @GetMapping("/wards")
    @Operation(summary = "Get list of active wards")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<WardResponse>>> getActiveWards() {
        List<WardResponse> list = inpatientService.getActiveWards();
        return ResponseEntity.ok(ApiResponse.success(list, "Active wards retrieved"));
    }

    @PostMapping("/wards")
    @Operation(summary = "Create new ward (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<WardResponse>> createWard(@Valid @RequestBody WardRequest request) {
        WardResponse response = inpatientService.createWard(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Ward created successfully"));
    }

    @PutMapping("/wards/{id}")
    @Operation(summary = "Update ward details (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<WardResponse>> updateWard(@PathVariable Long id, @Valid @RequestBody WardRequest request) {
        WardResponse response = inpatientService.updateWard(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Ward updated successfully"));
    }

    @DeleteMapping("/wards/{id}")
    @Operation(summary = "Deactivate/delete ward (Admin only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteWard(@PathVariable Long id) {
        inpatientService.deleteWard(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Ward deactivated successfully"));
    }

    @PostMapping("/rooms")
    @Operation(summary = "Create new room in ward (Admin, Nurse, Doctor)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'NURSE', 'DOCTOR')")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomResponse response = inpatientService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Room created successfully"));
    }

    @PostMapping("/beds")
    @Operation(summary = "Add bed to room (Admin, Nurse, Doctor)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'NURSE', 'DOCTOR')")
    public ResponseEntity<ApiResponse<BedResponse>> createBed(@Valid @RequestBody BedRequest request) {
        BedResponse response = inpatientService.createBed(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Bed added successfully"));
    }

    // --- Live Bed Board ---
    @GetMapping({"/bed-board", "/beds"})
    @Operation(summary = "Get live bed availability matrix / bed board")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<List<BedBoardItemResponse>>> getBedBoard() {
        List<BedBoardItemResponse> list = inpatientService.getBedBoard();
        return ResponseEntity.ok(ApiResponse.success(list, "Live bed board retrieved successfully"));
    }

    // --- Admissions ---
    @PostMapping("/admissions")
    @Operation(summary = "Admit patient and allocate bed (Doctor, Nurse, Receptionist, Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> admitPatient(@Valid @RequestBody AdmissionRequest request) {
        AdmissionResponse response = inpatientService.admitPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Patient admitted and bed allocated successfully"));
    }

    @GetMapping("/admissions")
    @Operation(summary = "Filter inpatient admissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT') or hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<AdmissionResponse>>> filterAdmissions(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            patientId = patientService.getPatientByUserId(userDetails.getId()).getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("admissionDate").descending());
        PagedResponse<AdmissionResponse> response = inpatientService.filterAdmissions(patientId, doctorId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Admissions retrieved successfully"));
    }

    @GetMapping("/admissions/{id}")
    @Operation(summary = "Get admission details with bed history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(@inpatientService.getAdmissionById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<AdmissionResponse>> getAdmissionById(@PathVariable Long id) {
        AdmissionResponse response = inpatientService.getAdmissionById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Admission retrieved"));
    }

    @PostMapping("/admissions/{id}/transfer-bed")
    @Operation(summary = "Transfer admitted patient to another bed (Doctor, Nurse, Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> transferBed(
            @PathVariable Long id,
            @Valid @RequestBody BedTransferRequest request) {
        AdmissionResponse response = inpatientService.transferBed(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient transferred to new bed successfully"));
    }

    @PostMapping("/admissions/{id}/discharge")
    @Operation(summary = "Discharge admitted patient and release bed (Doctor, Nurse, Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<AdmissionResponse>> dischargePatient(
            @PathVariable Long id,
            @Valid @RequestBody DischargeRequest request) {
        AdmissionResponse response = inpatientService.dischargePatient(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Patient discharged and bed released successfully"));
    }
}
