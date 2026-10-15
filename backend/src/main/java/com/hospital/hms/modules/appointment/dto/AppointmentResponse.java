package com.hospital.hms.modules.appointment.dto;

import com.hospital.hms.modules.appointment.entity.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private String appointmentNumber;
    private Long patientId;
    private String patientCode;
    private String patientName;
    private String patientPhone;
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String departmentName;
    private String roomNumber;
    private BigDecimal consultationFee;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reasonForVisit;
    private String status;
    private String cancellationReason;
    private String notes;
    private LocalDateTime createdAt;

    public static AppointmentResponse fromEntity(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .appointmentNumber(appointment.getAppointmentNumber())
                .patientId(appointment.getPatient().getId())
                .patientCode(appointment.getPatient().getPatientCode())
                .patientName(appointment.getPatient().getFirstName() + " " + appointment.getPatient().getLastName())
                .patientPhone(appointment.getPatient().getPhoneNumber())
                .doctorId(appointment.getDoctor().getId())
                .doctorName("Dr. " + appointment.getDoctor().getUser().getFirstName() + " " + appointment.getDoctor().getUser().getLastName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .departmentName(appointment.getDoctor().getDepartment().getName())
                .roomNumber(appointment.getDoctor().getRoomNumber())
                .consultationFee(appointment.getDoctor().getConsultationFee())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .reasonForVisit(appointment.getReasonForVisit())
                .status(appointment.getStatus())
                .cancellationReason(appointment.getCancellationReason())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
