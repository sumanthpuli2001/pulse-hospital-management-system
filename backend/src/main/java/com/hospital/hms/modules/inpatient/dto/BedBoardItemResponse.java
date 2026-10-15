package com.hospital.hms.modules.inpatient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedBoardItemResponse {

    private Long bedId;
    private String bedNumber;
    private String status; // AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED
    private Long roomId;
    private String roomNumber;
    private String roomType;
    private BigDecimal dailyRate;
    private Long wardId;
    private String wardName;
    private String wardType;
    private Integer floorNumber;
    private Long currentAdmissionId;
    private String currentAdmissionNumber;
    private Long currentPatientId;
    private String currentPatientName;
    private String currentPatientCode;
}
