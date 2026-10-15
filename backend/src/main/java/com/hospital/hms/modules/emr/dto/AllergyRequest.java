package com.hospital.hms.modules.emr.dto;

import com.hospital.hms.modules.emr.entity.Allergy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllergyRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    @NotBlank(message = "Allergen is required (e.g. Penicillin, Peanuts)")
    private String allergen;

    @NotBlank(message = "Allergy type is required (DRUG, FOOD, ENVIRONMENTAL, OTHER)")
    private String allergyType;

    @NotBlank(message = "Severity is required (MILD, MODERATE, SEVERE, LIFE_THREATENING)")
    private String severity;

    private String reaction;
    private String notes;
}
