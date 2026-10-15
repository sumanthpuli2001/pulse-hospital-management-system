package com.hospital.hms.modules.inpatient.repository;

import com.hospital.hms.modules.inpatient.entity.BedAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedAllocationRepository extends JpaRepository<BedAllocation, Long> {

    List<BedAllocation> findByAdmissionIdOrderByAllocatedFromDesc(Long admissionId);

    Optional<BedAllocation> findFirstByAdmissionIdAndStatus(Long admissionId, String status);

    Optional<BedAllocation> findFirstByBedIdAndStatus(Long bedId, String status);

    boolean existsByBedIdAndStatus(Long bedId, String status);
}
