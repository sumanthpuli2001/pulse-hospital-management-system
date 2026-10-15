package com.hospital.hms.appointment;

import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.modules.appointment.dto.AppointmentBookingRequest;
import com.hospital.hms.modules.appointment.dto.AppointmentResponse;
import com.hospital.hms.modules.appointment.entity.Appointment;
import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.appointment.service.AppointmentService;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Patient patient;
    private Doctor doctor;
    private User doctorUser;

    @BeforeEach
    void setUp() {
        patient = Patient.builder()
                .id(1L)
                .patientCode("PAT-2026-0001")
                .firstName("Alice")
                .lastName("Smith")
                .isActive(true)
                .build();

        User doctorUser = User.builder()
                .id(2L)
                .firstName("Rajesh")
                .lastName("Sharma")
                .build();

        com.hospital.hms.modules.department.entity.Department dept = com.hospital.hms.modules.department.entity.Department.builder()
                .id(1L)
                .name("Cardiology")
                .code("CARD")
                .build();

        doctor = Doctor.builder()
                .id(1L)
                .user(doctorUser)
                .department(dept)
                .specialization("Cardiology")
                .consultationFee(new BigDecimal("75.00"))
                .isAvailable(true)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Should book appointment when doctor is available and slot is open")
    void testBookAppointmentSuccess() {
        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setDurationMinutes(30);
        request.setReasonForVisit("Annual cardiac check");

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.hasOverlappingBooking(eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any()))
                .thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(100L);
            return a;
        });

        AppointmentResponse response = appointmentService.bookAppointment(request, 1L);

        assertNotNull(response);
        assertEquals("SCHEDULED", response.getStatus());
        assertEquals("Alice Smith", response.getPatientName());
        assertEquals("Dr. Rajesh Sharma", response.getDoctorName());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should reject appointment booking when doctor slot overlaps existing visit")
    void testBookAppointmentOverlapRejection() {
        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setDurationMinutes(30);

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(appointmentRepository.hasOverlappingBooking(eq(1L), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any()))
                .thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            appointmentService.bookAppointment(request, 1L);
        });

        assertTrue(ex.getMessage().contains("already has a scheduled appointment overlapping"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should reject appointment booking when doctor is inactive or on leave")
    void testBookAppointmentDoctorUnavailableRejection() {
        doctor.setAvailable(false);

        AppointmentBookingRequest request = new AppointmentBookingRequest();
        request.setPatientId(1L);
        request.setDoctorId(1L);
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            appointmentService.bookAppointment(request, 1L);
        });

        assertTrue(ex.getMessage().contains("not available for bookings"));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }
}
