package com.hospital.hms.modules.doctor.repository;

import com.hospital.hms.modules.doctor.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    boolean existsByLicenseNumber(String licenseNumber);

    boolean existsByUserId(Long userId);

    List<Doctor> findByDepartmentIdAndIsActiveTrue(Long departmentId);

    List<Doctor> findByIsAvailableTrueAndIsActiveTrue();

    @Query("SELECT d FROM Doctor d WHERE d.isActive = true AND " +
           "(:departmentId IS NULL OR d.department.id = :departmentId) AND " +
           "(:specialization IS NULL OR LOWER(d.specialization) LIKE LOWER(CONCAT('%', :specialization, '%'))) AND " +
           "(:search IS NULL OR LOWER(d.user.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.user.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Doctor> searchDoctors(@Param("departmentId") Long departmentId,
                              @Param("specialization") String specialization,
                              @Param("search") String search,
                              Pageable pageable);

    long countByIsActiveTrue();
}
