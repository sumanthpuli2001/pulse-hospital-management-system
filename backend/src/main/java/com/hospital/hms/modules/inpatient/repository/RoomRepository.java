package com.hospital.hms.modules.inpatient.repository;

import com.hospital.hms.modules.inpatient.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByWardIdAndIsActiveTrue(Long wardId);

    boolean existsByWardIdAndRoomNumber(Long wardId, String roomNumber);
}
