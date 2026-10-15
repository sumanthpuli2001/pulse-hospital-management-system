package com.hospital.hms.modules.emr.repository;

import com.hospital.hms.modules.emr.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByRecordDateDesc(Long patientId);

    Page<MedicalRecord> findByPatientIdOrderByRecordDateDesc(Long patientId, Pageable pageable);

    List<MedicalRecord> findByDoctorIdOrderByRecordDateDesc(Long doctorId);

    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
}
