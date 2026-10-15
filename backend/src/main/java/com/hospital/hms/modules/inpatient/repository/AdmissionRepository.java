package com.hospital.hms.modules.inpatient.repository;

import com.hospital.hms.modules.inpatient.entity.Admission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {

    Optional<Admission> findByAdmissionNumber(String admissionNumber);

    boolean existsByAdmissionNumber(String admissionNumber);

    List<Admission> findByPatientIdOrderByAdmissionDateDesc(Long patientId);

    Optional<Admission> findFirstByPatientIdAndStatus(Long patientId, String status);

    @Query("SELECT a FROM Admission a WHERE " +
           "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
           "(:doctorId IS NULL OR a.admittingDoctor.id = :doctorId) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Admission> filterAdmissions(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM Admission a")
    long countTotalAdmissions();

    long countByStatus(String status);
}
