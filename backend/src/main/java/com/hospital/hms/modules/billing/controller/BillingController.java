package com.hospital.hms.modules.billing.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.billing.dto.*;
import com.hospital.hms.modules.billing.service.BillingService;
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
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing & Payments Management", description = "Endpoints for invoices, line items, decimal-safe payment processing, and patient accounts")
@SecurityRequirement(name = "Bearer Authentication")
public class BillingController {

    private final BillingService billingService;
    private final PatientService patientService;

    @PostMapping("/invoices")
    @Operation(summary = "Generate new invoice (Accountant or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody InvoiceCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        InvoiceResponse response = billingService.createInvoice(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Invoice generated successfully"));
    }

    @PostMapping("/invoices/admission/{admissionId}")
    @Operation(summary = "Auto-generate consolidated discharge invoice (Accountant or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateAdmissionInvoice(
            @PathVariable Long admissionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        InvoiceResponse response = billingService.generateAdmissionInvoice(admissionId, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Inpatient discharge bill generated successfully"));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get invoice details by ID")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(@billingService.getInvoiceById(#id).patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) {
        InvoiceResponse response = billingService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoice retrieved successfully"));
    }

    @GetMapping("/invoices")
    @Operation(summary = "Filter invoices (Accountant, Admin, or Patient)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT') or hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PagedResponse<InvoiceResponse>>> filterInvoices(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
            patientId = patientService.getPatientByUserId(userDetails.getId()).getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("invoiceDate").descending());
        PagedResponse<InvoiceResponse> response = billingService.filterInvoices(patientId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoices retrieved successfully"));
    }

    @PostMapping("/invoices/{id}/payments")
    @Operation(summary = "Record payment against invoice (Accountant or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        PaymentResponse response = billingService.recordPayment(id, request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Payment recorded successfully"));
    }

    @GetMapping("/invoices/patient/{patientId}")
    @Operation(summary = "Get invoices for patient")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT') or (hasRole('PATIENT') and @patientService.getPatientById(#patientId).userId == principal.id)")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getPatientInvoices(@PathVariable Long patientId) {
        List<InvoiceResponse> list = billingService.getPatientInvoices(patientId);
        return ResponseEntity.ok(ApiResponse.success(list, "Patient invoices retrieved successfully"));
    }
}
