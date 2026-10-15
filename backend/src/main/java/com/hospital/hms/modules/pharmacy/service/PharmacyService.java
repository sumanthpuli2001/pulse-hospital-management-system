package com.hospital.hms.modules.pharmacy.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.pharmacy.dto.*;
import com.hospital.hms.modules.pharmacy.entity.InventoryTransaction;
import com.hospital.hms.modules.pharmacy.entity.Medicine;
import com.hospital.hms.modules.pharmacy.entity.MedicineBatch;
import com.hospital.hms.modules.pharmacy.repository.InventoryTransactionRepository;
import com.hospital.hms.modules.pharmacy.repository.MedicineBatchRepository;
import com.hospital.hms.modules.pharmacy.repository.MedicineRepository;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmacyService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository medicineBatchRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final UserRepository userRepository;

    // --- Medicine Catalog ---
    @Transactional
    public MedicineResponse createMedicine(MedicineRequest request) {
        if (request.getSku() == null || request.getSku().isBlank()) {
            String prefix = (request.getName() != null && request.getName().length() >= 3)
                    ? request.getName().substring(0, 3).toUpperCase()
                    : "DRG";
            request.setSku("MED-" + prefix + "-" + (System.currentTimeMillis() % 1000000));
        }
        if (request.getCostPrice() == null) {
            BigDecimal unit = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
            request.setCostPrice(unit.multiply(new java.math.BigDecimal("0.70")));
        }
        if (request.getUnitOfMeasure() == null || request.getUnitOfMeasure().isBlank()) {
            request.setUnitOfMeasure("TABLET");
        }

        if (medicineRepository.existsBySku(request.getSku().trim().toUpperCase())) {
            throw new BadRequestException("Medicine SKU already exists: " + request.getSku());
        }

        Medicine medicine = Medicine.builder()
                .name(request.getName().trim())
                .genericName(request.getGenericName().trim())
                .sku(request.getSku().trim().toUpperCase())
                .category(request.getCategory().trim().toUpperCase())
                .unitOfMeasure(request.getUnitOfMeasure().trim().toUpperCase())
                .unitPrice(request.getUnitPrice())
                .costPrice(request.getCostPrice())
                .reorderLevel(request.getReorderLevel())
                .requiresPrescription(request.isRequiresPrescription())
                .isActive(request.isActive())
                .build();

        Medicine saved = medicineRepository.save(medicine);
        return MedicineResponse.fromEntity(saved, 0, List.of());
    }

    @Transactional
    public MedicineResponse updateMedicine(Long id, MedicineRequest request) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        if (request.getCostPrice() == null) {
            BigDecimal unit = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
            request.setCostPrice(unit.multiply(new java.math.BigDecimal("0.70")));
        }
        if (request.getUnitOfMeasure() == null || request.getUnitOfMeasure().isBlank()) {
            request.setUnitOfMeasure(medicine.getUnitOfMeasure() != null ? medicine.getUnitOfMeasure() : "TABLET");
        }

        medicine.setName(request.getName().trim());
        medicine.setGenericName(request.getGenericName().trim());
        if (request.getSku() != null && !request.getSku().isBlank()) {
            medicine.setSku(request.getSku().trim().toUpperCase());
        }
        medicine.setCategory(request.getCategory().trim().toUpperCase());
        medicine.setUnitOfMeasure(request.getUnitOfMeasure().trim().toUpperCase());
        medicine.setUnitPrice(request.getUnitPrice());
        medicine.setCostPrice(request.getCostPrice());
        medicine.setReorderLevel(request.getReorderLevel());
        medicine.setRequiresPrescription(request.isRequiresPrescription());
        medicine.setActive(request.isActive());

        Medicine saved = medicineRepository.save(medicine);
        int totalStock = medicineBatchRepository.getTotalStockForMedicine(id);
        return MedicineResponse.fromEntity(saved, totalStock, List.of());
    }

    @Transactional
    public void deleteMedicine(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        medicine.setActive(false);
        medicineRepository.save(medicine);
    }

    @Transactional(readOnly = true)
    public MedicineResponse getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        int totalStock = medicineBatchRepository.getTotalStockForMedicine(id);
        List<MedicineBatchResponse> batches = medicineBatchRepository.findByMedicineIdAndIsActiveTrueOrderByExpiryDateAsc(id)
                .stream()
                .map(MedicineBatchResponse::fromEntity)
                .collect(Collectors.toList());

        return MedicineResponse.fromEntity(medicine, totalStock, batches);
    }

    @Transactional(readOnly = true)
    public PagedResponse<MedicineResponse> searchMedicines(String search, String category, Boolean isActive, Pageable pageable) {
        Page<Medicine> page = medicineRepository.searchMedicines(search, category, isActive, pageable);
        List<MedicineResponse> content = page.getContent().stream().map(m -> {
            int stock = medicineBatchRepository.getTotalStockForMedicine(m.getId());
            return MedicineResponse.fromEntity(m, stock, null);
        }).collect(Collectors.toList());

        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    // --- Batch Receiving & Inventory ---
    @Transactional
    public MedicineBatchResponse receiveBatch(Long medicineId, MedicineBatchRequest request, Long userId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", medicineId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot receive expired medication batch. Expiry date: " + request.getExpiryDate());
        }

        if (medicineBatchRepository.existsByMedicineIdAndBatchNumber(medicineId, request.getBatchNumber().trim().toUpperCase())) {
            throw new BadRequestException("Batch number already exists for this medicine: " + request.getBatchNumber());
        }

        MedicineBatch batch = MedicineBatch.builder()
                .medicine(medicine)
                .batchNumber(request.getBatchNumber().trim().toUpperCase())
                .manufacturingDate(request.getManufacturingDate())
                .expiryDate(request.getExpiryDate())
                .quantityInStock(request.getQuantity())
                .unitCost(request.getUnitCost())
                .supplierName(request.getSupplierName())
                .isActive(true)
                .build();

        MedicineBatch savedBatch = medicineBatchRepository.save(batch);

        // Record stock receipt transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
                .medicine(medicine)
                .batch(savedBatch)
                .transactionType("PURCHASE_RECEIPT")
                .quantity(request.getQuantity())
                .unitPrice(request.getUnitCost())
                .referenceId(request.getPurchaseOrderNumber() != null ? request.getPurchaseOrderNumber() : "RECEIPT-" + savedBatch.getId())
                .referenceType("PURCHASE_ORDER")
                .notes("Received initial batch stock from supplier: " + (request.getSupplierName() != null ? request.getSupplierName() : "N/A"))
                .performedByUser(user)
                .build();
        inventoryTransactionRepository.save(transaction);

        return MedicineBatchResponse.fromEntity(savedBatch);
    }

    // --- Stock Adjustment ---
    @Transactional
    public MedicineBatchResponse adjustStock(Long batchId, StockAdjustmentRequest request, Long userId) {
        MedicineBatch batch = medicineBatchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("MedicineBatch", "id", batchId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getAdjustmentQuantity() == null) {
            throw new BadRequestException("Adjustment quantity is required (positive to add, negative to deduct)");
        }
        if (request.getTransactionType() == null || request.getTransactionType().isBlank()) {
            throw new BadRequestException("Adjustment reason / transaction type is required");
        }

        int newStock = batch.getQuantityInStock() + request.getAdjustmentQuantity();
        if (newStock < 0) {
            throw new BadRequestException("Adjustment exceeds available batch stock. Current: " +
                    batch.getQuantityInStock() + ", Adjustment: " + request.getAdjustmentQuantity());
        }

        batch.setQuantityInStock(newStock);
        MedicineBatch updatedBatch = medicineBatchRepository.save(batch);

        InventoryTransaction transaction = InventoryTransaction.builder()
                .medicine(batch.getMedicine())
                .batch(batch)
                .transactionType(request.getTransactionType().toUpperCase())
                .quantity(request.getAdjustmentQuantity())
                .unitPrice(batch.getUnitCost())
                .referenceId("ADJ-" + batch.getId())
                .referenceType("INVENTORY_AUDIT")
                .notes(request.getNotes())
                .performedByUser(user)
                .build();
        inventoryTransactionRepository.save(transaction);

        return MedicineBatchResponse.fromEntity(updatedBatch);
    }

    // --- Dispense with FEFO (First Expiring, First Out) ---
    @Transactional
    public List<InventoryTransactionResponse> dispenseMedicine(Long medicineId, int requestedQty, String referenceId, Long userId) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", medicineId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        int totalStock = medicineBatchRepository.getTotalStockForMedicine(medicineId);
        if (totalStock < requestedQty) {
            throw new BadRequestException("Insufficient stock for medicine " + medicine.getName() +
                    ". Requested: " + requestedQty + ", Available: " + totalStock);
        }

        List<MedicineBatch> activeBatches = medicineBatchRepository
                .findByMedicineIdAndIsActiveTrueAndQuantityInStockGreaterThanOrderByExpiryDateAsc(medicineId, 0);

        int remainingToDispense = requestedQty;
        List<InventoryTransactionResponse> transactions = new ArrayList<>();

        for (MedicineBatch batch : activeBatches) {
            if (remainingToDispense <= 0) break;

            int deductFromBatch = Math.min(batch.getQuantityInStock(), remainingToDispense);
            batch.setQuantityInStock(batch.getQuantityInStock() - deductFromBatch);
            medicineBatchRepository.save(batch);

            InventoryTransaction transaction = InventoryTransaction.builder()
                .medicine(medicine)
                .batch(batch)
                .transactionType("DISPENSE")
                .quantity(-deductFromBatch)
                .unitPrice(medicine.getUnitPrice())
                .referenceId(referenceId)
                .referenceType("PRESCRIPTION")
                .notes("Dispensed against " + referenceId + " from batch " + batch.getBatchNumber())
                .performedByUser(user)
                .build();

            InventoryTransaction savedTx = inventoryTransactionRepository.save(transaction);
            transactions.add(InventoryTransactionResponse.fromEntity(savedTx));

            remainingToDispense -= deductFromBatch;
        }

        return transactions;
    }

    // --- Alerts and Queries ---
    @Transactional(readOnly = true)
    public List<MedicineResponse> getLowStockMedicines() {
        return medicineRepository.findLowStockMedicines().stream()
                .map(m -> {
                    int stock = medicineBatchRepository.getTotalStockForMedicine(m.getId());
                    return MedicineResponse.fromEntity(m, stock, null);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchResponse> getExpiringBatches(int withinDays) {
        LocalDate threshold = LocalDate.now().plusDays(withinDays);
        return medicineBatchRepository.findBatchesExpiringBefore(threshold).stream()
                .map(MedicineBatchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineBatchResponse> getExpiredBatches() {
        return medicineBatchRepository.findExpiredBatches().stream()
                .map(MedicineBatchResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<InventoryTransactionResponse> filterTransactions(Long medicineId, String transactionType, Pageable pageable) {
        Page<InventoryTransaction> page = inventoryTransactionRepository.filterTransactions(medicineId, transactionType, pageable);
        List<InventoryTransactionResponse> content = page.getContent().stream()
                .map(InventoryTransactionResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
