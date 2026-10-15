package com.hospital.hms.modules.inpatient.dto;

import com.hospital.hms.modules.inpatient.entity.BedAllocation;
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
public class BedAllocationResponse {

    private Long id;
    private Long admissionId;
    private Long bedId;
    private String bedNumber;
    private String roomNumber;
    private String wardName;
    private LocalDateTime allocatedFrom;
    private LocalDateTime allocatedTo;
    private BigDecimal dailyCharge;
    private String status;
    private String notes;
    private LocalDateTime createdAt;

    public static BedAllocationResponse fromEntity(BedAllocation ba) {
        if (ba == null) return null;

        return BedAllocationResponse.builder()
                .id(ba.getId())
                .admissionId(ba.getAdmission() != null ? ba.getAdmission().getId() : null)
                .bedId(ba.getBed() != null ? ba.getBed().getId() : null)
                .bedNumber(ba.getBed() != null ? ba.getBed().getBedNumber() : null)
                .roomNumber(ba.getBed() != null && ba.getBed().getRoom() != null ? ba.getBed().getRoom().getRoomNumber() : null)
                .wardName(ba.getBed() != null && ba.getBed().getRoom() != null && ba.getBed().getRoom().getWard() != null ?
                        ba.getBed().getRoom().getWard().getName() : null)
                .allocatedFrom(ba.getAllocatedFrom())
                .allocatedTo(ba.getAllocatedTo())
                .dailyCharge(ba.getDailyCharge())
                .status(ba.getStatus())
                .notes(ba.getNotes())
                .createdAt(ba.getCreatedAt())
                .build();
    }
}
