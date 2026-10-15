package com.hospital.hms.modules.laboratory.repository;

import com.hospital.hms.modules.laboratory.entity.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, Long> {
    Optional<LabTest> findByTestCode(String testCode);
    boolean existsByTestCode(String testCode);
    List<LabTest> findByIsActiveTrue();
    List<LabTest> findByCategoryAndIsActiveTrue(String category);
}
