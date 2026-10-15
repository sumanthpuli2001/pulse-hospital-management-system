package com.hospital.hms.modules.billing.dto;

import com.hospital.hms.modules.billing.entity.InvoiceItem;
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
public class InvoiceItemResponse {

    private Long id;
    private Long invoiceId;
    private String itemType;
    private String itemReferenceId;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;

    public static InvoiceItemResponse fromEntity(InvoiceItem item) {
        if (item == null) return null;

        return InvoiceItemResponse.builder()
                .id(item.getId())
                .invoiceId(item.getInvoice() != null ? item.getInvoice().getId() : null)
                .itemType(item.getItemType())
                .itemReferenceId(item.getItemReferenceId())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
