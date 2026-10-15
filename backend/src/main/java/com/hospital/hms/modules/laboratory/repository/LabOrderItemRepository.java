package com.hospital.hms.modules.laboratory.repository;

import com.hospital.hms.modules.laboratory.entity.LabOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabOrderItemRepository extends JpaRepository<LabOrderItem, Long> {
    List<LabOrderItem> findByOrderId(Long orderId);
    Optional<LabOrderItem> findBySampleBarcode(String sampleBarcode);
}
