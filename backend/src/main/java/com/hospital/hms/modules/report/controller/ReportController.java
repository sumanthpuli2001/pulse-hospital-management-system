package com.hospital.hms.modules.report.controller;

import com.hospital.hms.common.ApiResponse;
import com.hospital.hms.modules.report.dto.*;
import com.hospital.hms.modules.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reporting & Analytics", description = "Endpoints for enterprise hospital census, financial revenue, bed occupancy, and physician workload analytics")
@SecurityRequirement(name = "Bearer Authentication")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/census")
    @Operation(summary = "Get live hospital operational census and KPI dashboard metrics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<HospitalCensusReport>> getHospitalCensus() {
        HospitalCensusReport report = reportService.getHospitalCensus();
        return ResponseEntity.ok(ApiResponse.success(report, "Hospital operational census retrieved"));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get hospital financial revenue and collection metrics (Accountant or Admin)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<RevenueReport>> getRevenueReport() {
        RevenueReport report = reportService.getRevenueReport();
        return ResponseEntity.ok(ApiResponse.success(report, "Financial revenue report retrieved"));
    }

    @GetMapping("/bed-occupancy")
    @Operation(summary = "Get inpatient bed occupancy statistics and ward breakdown")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<ApiResponse<BedOccupancyReport>> getBedOccupancyReport() {
        BedOccupancyReport report = reportService.getBedOccupancyReport();
        return ResponseEntity.ok(ApiResponse.success(report, "Bed occupancy analytics retrieved"));
    }

    @GetMapping("/doctor-workload")
    @Operation(summary = "Get doctor clinical workload and appointment completion stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorWorkloadReport>>> getDoctorWorkload() {
        List<DoctorWorkloadReport> report = reportService.getDoctorWorkload();
        return ResponseEntity.ok(ApiResponse.success(report, "Doctor workload report retrieved"));
    }
}
