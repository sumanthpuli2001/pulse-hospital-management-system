package com.hospital.hms.modules.appointment.repository;

import com.hospital.hms.modules.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByAppointmentNumber(String appointmentNumber);

    boolean existsByAppointmentNumber(String appointmentNumber);

    @Query("SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END FROM Appointment a " +
           "WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :appointmentDate " +
           "AND a.status NOT IN :excludedStatuses " +
           "AND ((a.startTime <= :startTime AND a.endTime > :startTime) OR " +
           "     (a.startTime < :endTime AND a.endTime >= :endTime) OR " +
           "     (a.startTime >= :startTime AND a.endTime <= :endTime))")
    boolean hasOverlappingBooking(@Param("doctorId") Long doctorId,
                                  @Param("appointmentDate") LocalDate appointmentDate,
                                  @Param("startTime") LocalTime startTime,
                                  @Param("endTime") LocalTime endTime,
                                  @Param("excludedStatuses") Collection<String> excludedStatuses);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
           "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
           "(:appointmentDate IS NULL OR a.appointmentDate = :appointmentDate) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Appointment> filterAppointments(@Param("doctorId") Long doctorId,
                                         @Param("patientId") Long patientId,
                                         @Param("appointmentDate") LocalDate appointmentDate,
                                         @Param("status") String status,
                                         Pageable pageable);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(Long doctorId, LocalDate appointmentDate);

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);

    @Query("SELECT COUNT(a) FROM Appointment a")
    long countTotalAppointments();

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date")
    long countAppointmentsOnDate(@Param("date") LocalDate date);
}
