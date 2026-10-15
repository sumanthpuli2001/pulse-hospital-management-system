package com.hospital.hms.modules.pharmacy.repository;

import com.hospital.hms.modules.pharmacy.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByMedicineIdOrderByCreatedAtDesc(Long medicineId);

    List<InventoryTransaction> findByBatchIdOrderByCreatedAtDesc(Long batchId);

    @Query("SELECT t FROM InventoryTransaction t WHERE " +
           "(:medicineId IS NULL OR t.medicine.id = :medicineId) AND " +
           "(:transactionType IS NULL OR t.transactionType = :transactionType) " +
           "ORDER BY t.createdAt DESC")
    Page<InventoryTransaction> filterTransactions(
            @Param("medicineId") Long medicineId,
            @Param("transactionType") String transactionType,
            Pageable pageable
    );
}
