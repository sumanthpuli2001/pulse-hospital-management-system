package com.hospital.hms.modules.emr.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.appointment.entity.Appointment;
import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.emr.dto.*;
import com.hospital.hms.modules.emr.entity.Allergy;
import com.hospital.hms.modules.emr.entity.Diagnosis;
import com.hospital.hms.modules.emr.entity.MedicalRecord;
import com.hospital.hms.modules.emr.entity.VitalSign;
import com.hospital.hms.modules.emr.repository.AllergyRepository;
import com.hospital.hms.modules.emr.repository.DiagnosisRepository;
import com.hospital.hms.modules.emr.repository.MedicalRecordRepository;
import com.hospital.hms.modules.emr.repository.VitalSignRepository;
import com.hospital.hms.modules.patient.dto.PatientResponse;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final VitalSignRepository vitalSignRepository;
    private final AllergyRepository allergyRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
            appointment.setStatus("COMPLETED");
            appointmentRepository.save(appointment);
        }

        MedicalRecord record = MedicalRecord.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .recordDate(LocalDateTime.now())
                .chiefComplaint(request.getChiefComplaint().trim())
                .historyOfPresentIllness(request.getHistoryOfPresentIllness())
                .physicalExamination(request.getPhysicalExamination())
                .assessmentAndPlan(request.getAssessmentAndPlan().trim())
                .followUpDate(request.getFollowUpDate())
                .notes(request.getNotes())
                .build();

        MedicalRecord savedRecord = medicalRecordRepository.save(record);

        List<DiagnosisResponse> diagnosisResponses = new ArrayList<>();
        if (request.getDiagnoses() != null && !request.getDiagnoses().isEmpty()) {
            for (DiagnosisRequest diagReq : request.getDiagnoses()) {
                String dName = diagReq.getDiagnosisName();
                if (dName == null || dName.trim().isEmpty()) {
                    dName = diagReq.getNotes() != null && !diagReq.getNotes().trim().isEmpty() ? diagReq.getNotes().trim() : "Clinical Diagnosis";
                } else {
                    dName = dName.trim();
                }

                Diagnosis diag = Diagnosis.builder()
                        .medicalRecord(savedRecord)
                        .patient(patient)
                        .icdCode(diagReq.getIcdCode())
                        .diagnosisName(dName)
                        .diagnosisType(diagReq.getDiagnosisType() != null ? diagReq.getDiagnosisType() : "FINAL")
                        .status(diagReq.getStatus() != null ? diagReq.getStatus() : "ACTIVE")
                        .notes(diagReq.getNotes())
                        .diagnosedDate(LocalDate.now())
                        .build();
                diagnosisResponses.add(DiagnosisResponse.fromEntity(diagnosisRepository.save(diag)));
            }
        }

        MedicalRecordResponse response = MedicalRecordResponse.fromEntity(savedRecord);
        response.setDiagnoses(diagnosisResponses);
        return response;
    }

    @Transactional(readOnly = true)
    public PagedResponse<MedicalRecordResponse> getPatientMedicalRecords(Long patientId, Pageable pageable) {
        Page<MedicalRecord> page = medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId, pageable);
        List<MedicalRecordResponse> content = page.getContent().stream().map(r -> {
            MedicalRecordResponse res = MedicalRecordResponse.fromEntity(r);
            List<DiagnosisResponse> diags = diagnosisRepository.findByMedicalRecordId(r.getId()).stream()
                    .map(DiagnosisResponse::fromEntity).collect(Collectors.toList());
            res.setDiagnoses(diags);
            return res;
        }).collect(Collectors.toList());

        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional
    public VitalSignResponse recordVitalSigns(VitalSignRequest request, Long recordedByUserId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        User recordedBy = userRepository.findById(recordedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recordedByUserId));

        BigDecimal calculatedBmi = null;
        if (request.getWeightKg() != null && request.getHeightCm() != null && request.getHeightCm().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightInMeters = request.getHeightCm().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal heightSquared = heightInMeters.multiply(heightInMeters);
            calculatedBmi = request.getWeightKg().divide(heightSquared, 1, RoundingMode.HALF_UP);
        }

        VitalSign vital = VitalSign.builder()
                .patient(patient)
                .recordedByUser(recordedBy)
                .recordedAt(LocalDateTime.now())
                .temperature(request.getTemperature())
                .systolicBp(request.getSystolicBp())
                .diastolicBp(request.getDiastolicBp())
                .pulseRate(request.getPulseRate())
                .respiratoryRate(request.getRespiratoryRate())
                .oxygenSaturation(request.getOxygenSaturation())
                .weightKg(request.getWeightKg())
                .heightCm(request.getHeightCm())
                .bmi(calculatedBmi)
                .notes(request.getNotes())
                .build();

        return VitalSignResponse.fromEntity(vitalSignRepository.save(vital));
    }

    @Transactional(readOnly = true)
    public List<VitalSignResponse> getPatientVitalSigns(Long patientId) {
        return vitalSignRepository.findByPatientIdOrderByRecordedAtDesc(patientId).stream()
                .map(VitalSignResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AllergyResponse addPatientAllergy(AllergyRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        if (allergyRepository.existsByPatientIdAndAllergenIgnoreCase(request.getPatientId(), request.getAllergen().trim())) {
            throw new BadRequestException("Allergy already recorded for this patient: " + request.getAllergen());
        }

        Allergy allergy = Allergy.builder()
                .patient(patient)
                .allergen(request.getAllergen().trim())
                .allergyType(request.getAllergyType().toUpperCase())
                .severity(request.getSeverity().toUpperCase())
                .reaction(request.getReaction())
                .notes(request.getNotes())
                .recordedAt(LocalDateTime.now())
                .build();

        return AllergyResponse.fromEntity(allergyRepository.save(allergy));
    }

    @Transactional(readOnly = true)
    public List<AllergyResponse> getPatientAllergies(Long patientId) {
        return allergyRepository.findByPatientId(patientId).stream()
                .map(AllergyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PatientEMRSummaryResponse getPatientEMRSummary(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        VitalSignResponse latestVitals = vitalSignRepository.findFirstByPatientIdOrderByRecordedAtDesc(patientId)
                .map(VitalSignResponse::fromEntity).orElse(null);

        List<AllergyResponse> allergies = allergyRepository.findByPatientId(patientId).stream()
                .map(AllergyResponse::fromEntity).collect(Collectors.toList());

        List<DiagnosisResponse> activeDiagnoses = diagnosisRepository.findByPatientIdAndStatus(patientId, "ACTIVE").stream()
                .map(DiagnosisResponse::fromEntity).collect(Collectors.toList());

        List<MedicalRecordResponse> recentConsultations = medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patientId).stream()
                .limit(5)
                .map(r -> {
                    MedicalRecordResponse res = MedicalRecordResponse.fromEntity(r);
                    res.setDiagnoses(diagnosisRepository.findByMedicalRecordId(r.getId()).stream()
                            .map(DiagnosisResponse::fromEntity).collect(Collectors.toList()));
                    return res;
                }).collect(Collectors.toList());

        return PatientEMRSummaryResponse.builder()
                .patient(PatientResponse.fromEntity(patient))
                .latestVitals(latestVitals)
                .allergies(allergies)
                .activeDiagnoses(activeDiagnoses)
                .recentConsultations(recentConsultations)
                .build();
    }
}
