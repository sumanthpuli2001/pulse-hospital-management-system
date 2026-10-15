package com.hospital.hms.modules.inpatient.repository;

import com.hospital.hms.modules.inpatient.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {

    List<Ward> findByIsActiveTrue();

    Optional<Ward> findByName(String name);

    boolean existsByName(String name);
}
