package com.hospital.hms.modules.billing.dto;

import com.hospital.hms.modules.billing.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {

    private Long id;
    private String invoiceNumber;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long admissionId;
    private String admissionNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String status; // ISSUED, PARTIALLY_PAID, PAID, CANCELLED
    private String notes;
    private String createdByUserName;
    private List<InvoiceItemResponse> items;
    private List<PaymentResponse> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static InvoiceResponse fromEntity(Invoice inv) {
        if (inv == null) return null;

        List<InvoiceItemResponse> itemResponses = inv.getItems() != null
                ? inv.getItems().stream().map(InvoiceItemResponse::fromEntity).collect(Collectors.toList())
                : List.of();

        List<PaymentResponse> paymentResponses = inv.getPayments() != null
                ? inv.getPayments().stream().map(PaymentResponse::fromEntity).collect(Collectors.toList())
                : List.of();

        return InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .patientId(inv.getPatient() != null ? inv.getPatient().getId() : null)
                .patientName(inv.getPatient() != null ?
                        inv.getPatient().getFirstName() + " " + inv.getPatient().getLastName() : null)
                .patientCode(inv.getPatient() != null ? inv.getPatient().getPatientCode() : null)
                .admissionId(inv.getAdmission() != null ? inv.getAdmission().getId() : null)
                .admissionNumber(inv.getAdmission() != null ? inv.getAdmission().getAdmissionNumber() : null)
                .invoiceDate(inv.getInvoiceDate())
                .dueDate(inv.getDueDate())
                .subtotal(inv.getSubtotal())
                .taxAmount(inv.getTaxAmount())
                .discountAmount(inv.getDiscountAmount())
                .totalAmount(inv.getTotalAmount())
                .paidAmount(inv.getPaidAmount())
                .balanceAmount(inv.getBalanceAmount())
                .status(inv.getStatus())
                .notes(inv.getNotes())
                .createdByUserName(inv.getCreatedByUser() != null ?
                        inv.getCreatedByUser().getFirstName() + " " + inv.getCreatedByUser().getLastName() : null)
                .items(itemResponses)
                .payments(paymentResponses)
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
