package com.hospital.hms.modules.emr.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.emr.dto.*;
import com.hospital.hms.modules.emr.service.MedicalRecordService;
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
@RequestMapping("/api/v1/emr")
@RequiredArgsConstructor
@Tag(name = "Electronic Medical Records (EMR)", description = "Endpoints for consultation records, vitals, allergies, and ICD diagnoses")
@SecurityRequirement(name = "Bearer Authentication")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final PatientService patientService;

    @PostMapping("/consultations")
    @Operation(summary = "Record clinical consultation notes and diagnoses (Doctor only)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createMedicalRecord(
            @Valid @RequestBody MedicalRecordRequest request) {
        MedicalRecordResponse response = medicalRecordService.createMedicalRecord(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Consultation record saved successfully"));
    }

    @GetMapping({"/patient/{patientId}/consultations", "/patient/{patientId}/records"})
    @Operation(summary = "Get patient consultation history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<PagedResponse<MedicalRecordResponse>>> getPatientConsultations(
            @PathVariable Long patientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("recordDate").descending());
        PagedResponse<MedicalRecordResponse> response = medicalRecordService.getPatientMedicalRecords(patientId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Consultation history retrieved"));
    }

    @PostMapping("/vitals")
    @Operation(summary = "Record patient vital signs (Nurse or Doctor)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<VitalSignResponse>> recordVitals(
            @Valid @RequestBody VitalSignRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        VitalSignResponse response = medicalRecordService.recordVitalSigns(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Vital signs recorded successfully"));
    }

    @GetMapping("/patient/{patientId}/vitals")
    @Operation(summary = "Get historical vital signs for patient")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<VitalSignResponse>>> getPatientVitals(@PathVariable Long patientId) {
        List<VitalSignResponse> list = medicalRecordService.getPatientVitalSigns(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Vital signs retrieved"));
    }

    @PostMapping("/allergies")
    @Operation(summary = "Add patient allergy (Doctor or Nurse)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DOCTOR', 'NURSE')")
    public ResponseEntity<ApiResponse<AllergyResponse>> addAllergy(@Valid @RequestBody AllergyRequest request) {
        AllergyResponse response = medicalRecordService.addPatientAllergy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Allergy recorded successfully"));
    }

    @GetMapping("/patient/{patientId}/allergies")
    @Operation(summary = "Get patient allergies")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<AllergyResponse>>> getPatientAllergies(@PathVariable Long patientId) {
        List<AllergyResponse> list = medicalRecordService.getPatientAllergies(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Allergies retrieved"));
    }

    @GetMapping("/patient/{patientId}/summary")
    @Operation(summary = "Get complete clinical EMR summary chart")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<PatientEMRSummaryResponse>> getPatientEMRSummary(@PathVariable Long patientId) {
        PatientEMRSummaryResponse summary = medicalRecordService.getPatientEMRSummary(patientId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Patient EMR chart retrieved"));
    }
}
