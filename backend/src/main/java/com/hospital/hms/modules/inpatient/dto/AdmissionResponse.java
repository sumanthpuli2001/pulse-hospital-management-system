package com.hospital.hms.modules.inpatient.dto;

import com.hospital.hms.modules.inpatient.entity.Admission;
import com.hospital.hms.modules.inpatient.entity.BedAllocation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdmissionResponse {

    private Long id;
    private String admissionNumber;
    private Long patientId;
    private String patientName;
    private String patientCode;
    private Long admittingDoctorId;
    private String doctorName;
    private String departmentName;
    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;
    private String admissionReason;
    private String status; // ADMITTED, DISCHARGED, CANCELLED
    private String dischargeSummary;
    private BedResponse currentBed;
    private List<BedAllocationResponse> bedAllocations;
    private LocalDateTime createdAt;

    public static AdmissionResponse fromEntity(Admission admission) {
        if (admission == null) return null;

        List<BedAllocationResponse> allocationResponses = admission.getBedAllocations() != null
                ? admission.getBedAllocations().stream()
                .sorted(Comparator.comparing(BedAllocation::getAllocatedFrom).reversed())
                .map(BedAllocationResponse::fromEntity)
                .collect(Collectors.toList())
                : List.of();

        BedResponse currentBedResponse = null;
        if (admission.getBedAllocations() != null) {
            currentBedResponse = admission.getBedAllocations().stream()
                    .filter(ba -> "ACTIVE".equals(ba.getStatus()))
                    .findFirst()
                    .map(ba -> BedResponse.fromEntity(ba.getBed()))
                    .orElse(null);
        }

        return AdmissionResponse.builder()
                .id(admission.getId())
                .admissionNumber(admission.getAdmissionNumber())
                .patientId(admission.getPatient() != null ? admission.getPatient().getId() : null)
                .patientName(admission.getPatient() != null ?
                        admission.getPatient().getFirstName() + " " + admission.getPatient().getLastName() : null)
                .patientCode(admission.getPatient() != null ? admission.getPatient().getPatientCode() : null)
                .admittingDoctorId(admission.getAdmittingDoctor() != null ? admission.getAdmittingDoctor().getId() : null)
                .doctorName(admission.getAdmittingDoctor() != null && admission.getAdmittingDoctor().getUser() != null ?
                        "Dr. " + admission.getAdmittingDoctor().getUser().getFirstName() + " " + admission.getAdmittingDoctor().getUser().getLastName() : null)
                .departmentName(admission.getAdmittingDoctor() != null && admission.getAdmittingDoctor().getDepartment() != null ?
                        admission.getAdmittingDoctor().getDepartment().getName() : null)
                .admissionDate(admission.getAdmissionDate())
                .dischargeDate(admission.getDischargeDate())
                .admissionReason(admission.getAdmissionReason())
                .status(admission.getStatus())
                .dischargeSummary(admission.getDischargeSummary())
                .currentBed(currentBedResponse)
                .bedAllocations(allocationResponses)
                .createdAt(admission.getCreatedAt())
                .build();
    }
}
