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
public class RevenueReport {

    private BigDecimal totalBilled;
    private BigDecimal totalCollected;
    private BigDecimal outstandingBalance;
    private long totalInvoices;
    private long paidInvoices;
    private long partiallyPaidInvoices;
    private long issuedInvoices;
}
