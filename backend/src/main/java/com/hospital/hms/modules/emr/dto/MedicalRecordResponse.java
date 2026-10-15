package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.MedicalRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordResponse {

    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private String departmentName;
    private Long appointmentId;
    private LocalDateTime recordDate;
    private String chiefComplaint;
    private String historyOfPresentIllness;
    private String physicalExamination;
    private String assessmentAndPlan;
    private LocalDate followUpDate;
    private String notes;
    private List<DiagnosisResponse> diagnoses;

    public static MedicalRecordResponse fromEntity(MedicalRecord record) {
        return MedicalRecordResponse.builder()
                .id(record.getId())
                .patientId(record.getPatient().getId())
                .patientName(record.getPatient().getFirstName() + " " + record.getPatient().getLastName())
                .doctorId(record.getDoctor().getId())
                .doctorName("Dr. " + record.getDoctor().getUser().getFirstName() + " " + record.getDoctor().getUser().getLastName())
                .departmentName(record.getDoctor().getDepartment().getName())
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .recordDate(record.getRecordDate())
                .chiefComplaint(record.getChiefComplaint())
                .historyOfPresentIllness(record.getHistoryOfPresentIllness())
                .physicalExamination(record.getPhysicalExamination())
                .assessmentAndPlan(record.getAssessmentAndPlan())
                .followUpDate(record.getFollowUpDate())
                .notes(record.getNotes())
                .build();
    }
}
