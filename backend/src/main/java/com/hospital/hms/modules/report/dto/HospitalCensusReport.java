package com.hospital.hms.modules.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalCensusReport {

    private long totalPatients;
    private long totalDoctors;
    private long availableDoctors;
    private long todayAppointments;
    private long activeInpatients;
    private long totalBeds;
    private long occupiedBeds;
    private double bedOccupancyPercentage;
    private long pendingLabOrders;
    private long lowStockMedicines;
    private BigDecimal todayRevenue;
    private BigDecimal totalOutstandingBalance;
}
