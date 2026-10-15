package com.hospital.hms.modules.emr.repository;

import com.hospital.hms.modules.emr.entity.Diagnosis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagnosisRepository extends JpaRepository<Diagnosis, Long> {
    List<Diagnosis> findByPatientIdOrderByDiagnosedDateDesc(Long patientId);
    List<Diagnosis> findByMedicalRecordId(Long medicalRecordId);
    List<Diagnosis> findByPatientIdAndStatus(Long patientId, String status);
}
