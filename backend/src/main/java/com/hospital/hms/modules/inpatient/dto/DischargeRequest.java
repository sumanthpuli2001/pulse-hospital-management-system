package com.hospital.hms.modules.inpatient.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DischargeRequest {

    @NotBlank(message = "Clinical discharge summary is required")
    @JsonAlias({"summary", "notes"})
    private String dischargeSummary;
}
