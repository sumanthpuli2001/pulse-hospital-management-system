package com.hospital.hms.modules.laboratory.repository;

import com.hospital.hms.modules.laboratory.entity.LabOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {

    Optional<LabOrder> findByOrderNumber(String orderNumber);

    boolean existsByOrderNumber(String orderNumber);

    List<LabOrder> findByPatientIdOrderByOrderDateDesc(Long patientId);

    @Query("SELECT lo FROM LabOrder lo WHERE " +
           "(:patientId IS NULL OR lo.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR lo.doctor.id = :doctorId) AND " +
           "(:status IS NULL OR lo.status = :status)")
    Page<LabOrder> filterOrders(@Param("patientId") Long patientId,
                                @Param("doctorId") Long doctorId,
                                @Param("status") String status,
                                Pageable pageable);

    @Query("SELECT COUNT(lo) FROM LabOrder lo")
    long countTotalOrders();

    long countByStatus(String status);
}
