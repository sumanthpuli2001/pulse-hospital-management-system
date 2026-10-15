package com.hospital.hms.modules.prescription.repository;

import com.hospital.hms.modules.prescription.entity.Prescription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Optional<Prescription> findByPrescriptionNumber(String prescriptionNumber);

    boolean existsByPrescriptionNumber(String prescriptionNumber);

    List<Prescription> findByPatientIdOrderByIssueDateDesc(Long patientId);

    Page<Prescription> findByPatientIdOrderByIssueDateDesc(Long patientId, Pageable pageable);

    @Query("SELECT p FROM Prescription p WHERE " +
           "(:patientId IS NULL OR p.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR p.doctor.id = :doctorId) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Prescription> filterPrescriptions(@Param("patientId") Long patientId,
                                           @Param("doctorId") Long doctorId,
                                           @Param("status") String status,
                                           Pageable pageable);

    @Query("SELECT COUNT(p) FROM Prescription p")
    long countTotalPrescriptions();
}
