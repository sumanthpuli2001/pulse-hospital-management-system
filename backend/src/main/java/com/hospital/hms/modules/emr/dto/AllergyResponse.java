package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.Allergy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergyResponse {

    private Long id;
    private Long patientId;
    private String allergen;
    private String allergyType;
    private String severity;
    private String reaction;
    private String notes;
    private LocalDateTime recordedAt;

    public static AllergyResponse fromEntity(Allergy a) {
        return AllergyResponse.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .allergen(a.getAllergen())
                .allergyType(a.getAllergyType())
                .severity(a.getSeverity())
                .reaction(a.getReaction())
                .notes(a.getNotes())
                .recordedAt(a.getRecordedAt())
                .build();
    }
}
