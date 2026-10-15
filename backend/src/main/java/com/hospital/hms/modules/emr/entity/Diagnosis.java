package com.hospital.hms.modules.emr.entity;

import com.hospital.hms.modules.patient.entity.Patient;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "diagnoses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "icd_code", length = 20)
    private String icdCode; // e.g. I10 for Hypertension

    @Column(name = "diagnosis_name", nullable = false, length = 255)
    private String diagnosisName;

    @Column(name = "diagnosis_type", nullable = false, length = 30)
    @Builder.Default
    private String diagnosisType = "FINAL"; // PROVISIONAL, FINAL

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, RESOLVED, CHRONIC

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "diagnosed_date", nullable = false)
    @Builder.Default
    private LocalDate diagnosedDate = LocalDate.now();
}
