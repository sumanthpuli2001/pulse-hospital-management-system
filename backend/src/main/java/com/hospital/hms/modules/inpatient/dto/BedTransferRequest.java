package com.hospital.hms.modules.inpatient.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedTransferRequest {

    @NotNull(message = "Target Bed ID is required")
    @JsonAlias({"newBedId", "bedId"})
    private Long targetBedId;

    @JsonAlias({"reason", "notes"})
    private String transferReason;
}
