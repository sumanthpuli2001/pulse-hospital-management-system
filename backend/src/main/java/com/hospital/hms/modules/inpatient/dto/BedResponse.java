package com.hospital.hms.modules.inpatient.dto;

import com.hospital.hms.modules.inpatient.entity.Bed;
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
public class BedResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private Long wardId;
    private String wardName;
    private String wardType;
    private Integer floorNumber;
    private BigDecimal dailyRate;
    private String bedNumber;
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED
    private boolean isActive;
    private LocalDateTime createdAt;

    public static BedResponse fromEntity(Bed bed) {
        if (bed == null) return null;

        return BedResponse.builder()
                .id(bed.getId())
                .roomId(bed.getRoom() != null ? bed.getRoom().getId() : null)
                .roomNumber(bed.getRoom() != null ? bed.getRoom().getRoomNumber() : null)
                .roomType(bed.getRoom() != null ? bed.getRoom().getRoomType() : null)
                .dailyRate(bed.getRoom() != null ? bed.getRoom().getDailyRate() : BigDecimal.ZERO)
                .wardId(bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getId() : null)
                .wardName(bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getName() : null)
                .wardType(bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getWardType() : null)
                .floorNumber(bed.getRoom() != null && bed.getRoom().getWard() != null ? bed.getRoom().getWard().getFloorNumber() : null)
                .bedNumber(bed.getBedNumber())
                .status(bed.getStatus())
                .isActive(bed.isActive())
                .createdAt(bed.getCreatedAt())
                .build();
    }
}
