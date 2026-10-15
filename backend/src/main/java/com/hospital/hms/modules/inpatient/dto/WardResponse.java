package com.hospital.hms.modules.inpatient.dto;

import com.hospital.hms.modules.inpatient.entity.Ward;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WardResponse {

    private Long id;
    private String name;
    private String wardType;
    private Long departmentId;
    private String departmentName;
    private Integer floorNumber;
    private Integer capacity;
    private boolean isActive;
    private LocalDateTime createdAt;

    public static WardResponse fromEntity(Ward ward) {
        if (ward == null) return null;

        return WardResponse.builder()
                .id(ward.getId())
                .name(ward.getName())
                .wardType(ward.getWardType())
                .departmentId(ward.getDepartment() != null ? ward.getDepartment().getId() : null)
                .departmentName(ward.getDepartment() != null ? ward.getDepartment().getName() : null)
                .floorNumber(ward.getFloorNumber())
                .capacity(ward.getCapacity())
                .isActive(ward.isActive())
                .createdAt(ward.getCreatedAt())
                .build();
    }
}
