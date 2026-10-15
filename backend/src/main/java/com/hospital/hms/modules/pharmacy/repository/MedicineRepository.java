package com.hospital.hms.modules.pharmacy.repository;

import com.hospital.hms.modules.pharmacy.entity.Medicine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Medicine> findByIsActiveTrue();

    @Query("SELECT m FROM Medicine m WHERE " +
           "(:search IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(m.genericName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(m.sku) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR m.category = :category) AND " +
           "(:isActive IS NULL OR m.isActive = :isActive)")
    Page<Medicine> searchMedicines(
            @Param("search") String search,
            @Param("category") String category,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query("SELECT m FROM Medicine m WHERE m.isActive = true AND " +
           "(SELECT COALESCE(SUM(b.quantityInStock), 0) FROM MedicineBatch b WHERE b.medicine.id = m.id AND b.isActive = true) <= m.reorderLevel")
    List<Medicine> findLowStockMedicines();

    @Query("SELECT COUNT(m) FROM Medicine m WHERE m.isActive = true")
    long countActiveMedicines();
}
