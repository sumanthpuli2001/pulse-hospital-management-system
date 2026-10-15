package com.hospital.hms.inpatient;

import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.inpatient.dto.AdmissionRequest;
import com.hospital.hms.modules.inpatient.dto.AdmissionResponse;
import com.hospital.hms.modules.inpatient.dto.DischargeRequest;
import com.hospital.hms.modules.inpatient.entity.Admission;
import com.hospital.hms.modules.inpatient.entity.Bed;
import com.hospital.hms.modules.inpatient.entity.BedAllocation;
import com.hospital.hms.modules.inpatient.entity.Room;
import com.hospital.hms.modules.inpatient.entity.Ward;
import com.hospital.hms.modules.inpatient.repository.AdmissionRepository;
import com.hospital.hms.modules.inpatient.repository.BedAllocationRepository;
import com.hospital.hms.modules.inpatient.repository.BedRepository;
import com.hospital.hms.modules.inpatient.service.InpatientService;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InpatientServiceTest {

    @Mock
    private BedRepository bedRepository;

    @Mock
    private AdmissionRepository admissionRepository;

    @Mock
    private BedAllocationRepository bedAllocationRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private InpatientService inpatientService;

    private Patient patient;
    private Doctor doctor;
    private Room room;
    private Bed bed;

    @BeforeEach
    void setUp() {
        patient = Patient.builder()
                .id(1L)
                .patientCode("PAT-2026-0001")
                .firstName("Robert")
                .lastName("Johnson")
                .isActive(true)
                .build();

        User docUser = User.builder().id(2L).firstName("Rajesh").lastName("Sharma").build();
        doctor = Doctor.builder().id(1L).user(docUser).isActive(true).build();

        Ward ward = Ward.builder().id(1L).name("General Ward").build();
        room = Room.builder().id(1L).ward(ward).roomNumber("101").dailyRate(new BigDecimal("150.00")).build();

        bed = Bed.builder()
                .id(10L)
                .room(room)
                .bedNumber("B-101-A")
                .status("AVAILABLE")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should successfully admit patient and transition bed to OCCUPIED")
    void testAdmitPatientSuccess() {
        AdmissionRequest request = new AdmissionRequest();
        request.setPatientId(1L);
        request.setAdmittingDoctorId(1L);
        request.setBedId(10L);
        request.setAdmissionReason("Acute Bronchitis observation");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(admissionRepository.findFirstByPatientIdAndStatus(1L, "ADMITTED")).thenReturn(Optional.empty());
        when(bedRepository.findByIdWithLock(10L)).thenReturn(Optional.of(bed));

        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> {
            Admission a = i.getArgument(0);
            a.setId(101L);
            return a;
        });

        when(bedAllocationRepository.save(any(BedAllocation.class))).thenAnswer(i -> {
            BedAllocation ba = i.getArgument(0);
            ba.setId(501L);
            return ba;
        });

        AdmissionResponse response = inpatientService.admitPatient(request);

        assertNotNull(response);
        assertEquals("ADMITTED", response.getStatus());
        assertEquals("OCCUPIED", bed.getStatus());
        verify(bedRepository).save(bed);
        verify(admissionRepository).save(any(Admission.class));
    }

    @Test
    @DisplayName("Should reject admission when selected bed is already occupied")
    void testAdmitPatientBedOccupiedRejection() {
        bed.setStatus("OCCUPIED");

        AdmissionRequest request = new AdmissionRequest();
        request.setPatientId(1L);
        request.setAdmittingDoctorId(1L);
        request.setBedId(10L);
        request.setAdmissionReason("Observation");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(admissionRepository.findFirstByPatientIdAndStatus(1L, "ADMITTED")).thenReturn(Optional.empty());
        when(bedRepository.findByIdWithLock(10L)).thenReturn(Optional.of(bed));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            inpatientService.admitPatient(request);
        });

        assertTrue(ex.getMessage().contains("already occupied or under maintenance"));
        verify(admissionRepository, never()).save(any(Admission.class));
    }

    @Test
    @DisplayName("Should discharge patient and release bed back to AVAILABLE")
    void testDischargePatientReleasesBed() {
        bed.setStatus("OCCUPIED");

        Admission admission = Admission.builder()
                .id(200L)
                .admissionNumber("ADM-2026-0001")
                .patient(patient)
                .admittingDoctor(doctor)
                .admissionDate(LocalDateTime.now().minusDays(3))
                .status("ADMITTED")
                .bedAllocations(new ArrayList<>())
                .build();

        BedAllocation allocation = BedAllocation.builder()
                .id(300L)
                .admission(admission)
                .bed(bed)
                .allocatedFrom(LocalDateTime.now().minusDays(3))
                .dailyCharge(new BigDecimal("150.00"))
                .status("ACTIVE")
                .build();

        admission.getBedAllocations().add(allocation);

        DischargeRequest dischargeRequest = new DischargeRequest();
        dischargeRequest.setDischargeSummary("Patient recovered and clinically stable.");

        when(admissionRepository.findById(200L)).thenReturn(Optional.of(admission));
        when(bedAllocationRepository.findFirstByAdmissionIdAndStatus(200L, "ACTIVE")).thenReturn(Optional.of(allocation));
        when(admissionRepository.save(any(Admission.class))).thenAnswer(i -> i.getArgument(0));

        AdmissionResponse response = inpatientService.dischargePatient(200L, dischargeRequest);

        assertNotNull(response);
        assertEquals("DISCHARGED", response.getStatus());
        assertEquals("AVAILABLE", bed.getStatus());
        assertEquals("RELEASED", allocation.getStatus());
        verify(bedRepository).save(bed);
    }
}
