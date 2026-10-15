package com.hospital.hms.modules.laboratory.repository;

import com.hospital.hms.modules.laboratory.entity.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabResultRepository extends JpaRepository<LabResult, Long> {
    List<LabResult> findByOrderItemId(Long orderItemId);
}
