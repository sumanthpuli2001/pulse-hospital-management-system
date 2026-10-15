package com.hospital.hms.modules.billing.dto;

import com.hospital.hms.modules.billing.entity.Payment;
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
public class PaymentResponse {

    private Long id;
    private String paymentNumber;
    private Long invoiceId;
    private String invoiceNumber;
    private Long patientId;
    private String patientName;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDateTime paymentDate;
    private String transactionReference;
    private String notes;
    private String receivedByUserName;
    private String status;
    private LocalDateTime createdAt;

    public static PaymentResponse fromEntity(Payment p) {
        if (p == null) return null;

        return PaymentResponse.builder()
                .id(p.getId())
                .paymentNumber(p.getPaymentNumber())
                .invoiceId(p.getInvoice() != null ? p.getInvoice().getId() : null)
                .invoiceNumber(p.getInvoice() != null ? p.getInvoice().getInvoiceNumber() : null)
                .patientId(p.getPatient() != null ? p.getPatient().getId() : null)
                .patientName(p.getPatient() != null ?
                        p.getPatient().getFirstName() + " " + p.getPatient().getLastName() : null)
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDate(p.getPaymentDate())
                .transactionReference(p.getTransactionReference())
                .notes(p.getNotes())
                .receivedByUserName(p.getReceivedByUser() != null ?
                        p.getReceivedByUser().getFirstName() + " " + p.getReceivedByUser().getLastName() : null)
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
