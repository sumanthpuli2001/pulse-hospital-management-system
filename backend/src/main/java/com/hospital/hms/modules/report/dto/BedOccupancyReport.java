package com.hospital.hms.modules.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedOccupancyReport {

    private long totalBeds;
    private long availableBeds;
    private long occupiedBeds;
    private long maintenanceBeds;
    private double occupancyRatePercentage;
    private Map<String, Long> bedsByWard;
    private Map<String, Long> occupiedBedsByWard;
}
