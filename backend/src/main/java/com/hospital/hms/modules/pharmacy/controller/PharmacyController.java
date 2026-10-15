package com.hospital.hms.modules.pharmacy.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.modules.pharmacy.dto.*;
import com.hospital.hms.modules.pharmacy.service.PharmacyService;
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
@RequestMapping("/api/v1/pharmacy")
@RequiredArgsConstructor
@Tag(name = "Pharmacy & Inventory Management", description = "Endpoints for medication catalog, batch inventory, FEFO dispensing, and expiry tracking")
@SecurityRequirement(name = "Bearer Authentication")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    @GetMapping("/medicines")
    @Operation(summary = "Search medication catalog")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PagedResponse<MedicineResponse>>> searchMedicines(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        PagedResponse<MedicineResponse> response = pharmacyService.searchMedicines(search, category, isActive, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Medicines retrieved successfully"));
    }

    @PostMapping("/medicines")
    @Operation(summary = "Create medicine in catalog (Pharmacist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineResponse>> createMedicine(@Valid @RequestBody MedicineRequest request) {
        MedicineResponse response = pharmacyService.createMedicine(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Medicine added to catalog"));
    }

    @PutMapping("/medicines/{id}")
    @Operation(summary = "Update medicine details (Pharmacist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody MedicineRequest request) {
        MedicineResponse response = pharmacyService.updateMedicine(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Medicine updated successfully"));
    }

    @DeleteMapping("/medicines/{id}")
    @Operation(summary = "Deactivate/delete medicine (Pharmacist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Long id) {
        pharmacyService.deleteMedicine(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Medicine deactivated successfully"));
    }

    @GetMapping("/medicines/{id}")
    @Operation(summary = "Get medicine details with active batches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineById(@PathVariable Long id) {
        MedicineResponse response = pharmacyService.getMedicineById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Medicine details retrieved"));
    }

    @PostMapping("/medicines/{id}/batches")
    @Operation(summary = "Receive new stock batch from supplier (Pharmacist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineBatchResponse>> receiveBatch(
            @PathVariable Long id,
            @Valid @RequestBody MedicineBatchRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        MedicineBatchResponse response = pharmacyService.receiveBatch(id, request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Medicine batch received and stock added"));
    }

    @PostMapping("/batches/{batchId}/adjust")
    @Operation(summary = "Adjust batch stock (damage, discrepancy, audit) (Pharmacist or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<MedicineBatchResponse>> adjustStock(
            @PathVariable Long batchId,
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        MedicineBatchResponse response = pharmacyService.adjustStock(batchId, request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(response, "Batch stock adjusted"));
    }

    @GetMapping("/alerts/low-stock")
    @Operation(summary = "Get low stock medicines below reorder level")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getLowStockMedicines() {
        List<MedicineResponse> list = pharmacyService.getLowStockMedicines();
        return ResponseEntity.ok(ApiResponse.success(list, "Low stock medicines retrieved"));
    }

    @GetMapping("/batches/expiring")
    @Operation(summary = "Get batches expiring within specified days (default 30)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<MedicineBatchResponse>>> getExpiringBatches(
            @RequestParam(defaultValue = "30") int days) {
        List<MedicineBatchResponse> list = pharmacyService.getExpiringBatches(days);
        return ResponseEntity.ok(ApiResponse.success(list, "Expiring batches retrieved"));
    }

    @GetMapping("/batches/expired")
    @Operation(summary = "Get expired medicine batches")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST')")
    public ResponseEntity<ApiResponse<List<MedicineBatchResponse>>> getExpiredBatches() {
        List<MedicineBatchResponse> list = pharmacyService.getExpiredBatches();
        return ResponseEntity.ok(ApiResponse.success(list, "Expired batches retrieved"));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Filter inventory transaction history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryTransactionResponse>>> filterTransactions(
            @RequestParam(required = false) Long medicineId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<InventoryTransactionResponse> response = pharmacyService.filterTransactions(medicineId, transactionType, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory transactions retrieved"));
    }
}
