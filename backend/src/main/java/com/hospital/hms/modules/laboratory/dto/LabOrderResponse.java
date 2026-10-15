package com.hospital.hms.modules.laboratory.dto;

import com.hospital.hms.modules.laboratory.entity.LabOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabOrderResponse {

    private Long id;
    private String orderNumber;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long doctorId;
    private String doctorName;
    private Long appointmentId;
    private String status;
    private String clinicalIndications;
    private LocalDateTime orderDate;
    private List<LabOrderItemResponse> items;

    public static LabOrderResponse fromEntity(LabOrder lo) {
        List<LabOrderItemResponse> itemResponses = lo.getItems() != null
                ? lo.getItems().stream().map(LabOrderItemResponse::fromEntity).collect(Collectors.toList())
                : List.of();

        return LabOrderResponse.builder()
                .id(lo.getId())
                .orderNumber(lo.getOrderNumber())
                .patientId(lo.getPatient().getId())
                .patientName(lo.getPatient().getFirstName() + " " + lo.getPatient().getLastName())
                .patientCode(lo.getPatient().getPatientCode())
                .doctorId(lo.getDoctor().getId())
                .doctorName("Dr. " + lo.getDoctor().getUser().getFirstName() + " " + lo.getDoctor().getUser().getLastName())
                .appointmentId(lo.getAppointment() != null ? lo.getAppointment().getId() : null)
                .status(lo.getStatus())
                .clinicalIndications(lo.getClinicalIndications())
                .orderDate(lo.getOrderDate())
                .items(itemResponses)
                .build();
    }
}
