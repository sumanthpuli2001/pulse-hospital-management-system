package com.hospital.hms.modules.patient.repository;

import com.hospital.hms.modules.patient.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientCode(String patientCode);

    Optional<Patient> findByUserId(Long userId);

    boolean existsByPatientCode(String patientCode);

    boolean existsByPhoneNumber(String phoneNumber);

    @Query("SELECT p FROM Patient p WHERE p.isActive = true AND " +
           "(:query IS NULL OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.patientCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR p.phoneNumber LIKE CONCAT('%', :query, '%'))")
    Page<Patient> searchPatients(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Patient p")
    long countTotalPatients();
}
