package com.hospital.hms.modules.inpatient.repository;

import com.hospital.hms.modules.inpatient.entity.Bed;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    List<Bed> findByRoomIdAndIsActiveTrue(Long roomId);

    List<Bed> findByStatusAndIsActiveTrue(String status);

    long countByStatusAndIsActiveTrue(String status);

    long countByIsActiveTrue();

    boolean existsByRoomIdAndBedNumber(Long roomId, String bedNumber);

    /**
     * Acquires a pessimistic write lock on the bed record during atomic admission or bed-transfer
     * transactions to strictly prevent concurrent double allocations.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Bed b WHERE b.id = :id")
    Optional<Bed> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT b FROM Bed b JOIN FETCH b.room r JOIN FETCH r.ward w WHERE b.isActive = true ORDER BY w.name, r.roomNumber, b.bedNumber")
    List<Bed> findAllBedsWithHierarchy();
}
