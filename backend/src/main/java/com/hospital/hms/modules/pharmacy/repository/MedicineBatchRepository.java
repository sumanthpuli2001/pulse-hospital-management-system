package com.hospital.hms.modules.pharmacy.repository;

import com.hospital.hms.modules.pharmacy.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, Long> {

    List<MedicineBatch> findByMedicineIdAndIsActiveTrueOrderByExpiryDateAsc(Long medicineId);

    List<MedicineBatch> findByMedicineIdAndIsActiveTrueAndQuantityInStockGreaterThanOrderByExpiryDateAsc(Long medicineId, Integer minStock);

    Optional<MedicineBatch> findByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);

    boolean existsByMedicineIdAndBatchNumber(Long medicineId, String batchNumber);

    @Query("SELECT b FROM MedicineBatch b WHERE b.isActive = true AND b.quantityInStock > 0 AND b.expiryDate <= :thresholdDate ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findBatchesExpiringBefore(@Param("thresholdDate") LocalDate thresholdDate);

    @Query("SELECT b FROM MedicineBatch b WHERE b.isActive = true AND b.quantityInStock > 0 AND b.expiryDate < CURRENT_DATE")
    List<MedicineBatch> findExpiredBatches();

    @Query("SELECT COALESCE(SUM(b.quantityInStock), 0) FROM MedicineBatch b WHERE b.medicine.id = :medicineId AND b.isActive = true")
    int getTotalStockForMedicine(@Param("medicineId") Long medicineId);
}
