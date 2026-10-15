package com.hospital.hms.modules.emr.repository;

import com.hospital.hms.modules.emr.entity.VitalSign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {

    List<VitalSign> findByPatientIdOrderByRecordedAtDesc(Long patientId);

    Optional<VitalSign> findFirstByPatientIdOrderByRecordedAtDesc(Long patientId);
}
