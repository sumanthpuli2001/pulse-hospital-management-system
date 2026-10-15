package com.hospital.hms.modules.inpatient.dto;

import com.hospital.hms.modules.inpatient.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {

    private Long id;
    private Long wardId;
    private String wardName;
    private String roomNumber;
    private String roomType;
    private BigDecimal dailyRate;
    private boolean isActive;
    private LocalDateTime createdAt;

    public static RoomResponse fromEntity(Room room) {
        if (room == null) return null;

        return RoomResponse.builder()
                .id(room.getId())
                .wardId(room.getWard() != null ? room.getWard().getId() : null)
                .wardName(room.getWard() != null ? room.getWard().getName() : null)
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .dailyRate(room.getDailyRate())
                .isActive(room.isActive())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
