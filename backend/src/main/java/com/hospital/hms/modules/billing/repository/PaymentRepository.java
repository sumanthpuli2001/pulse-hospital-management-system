package com.hospital.hms.modules.billing.repository;

import com.hospital.hms.modules.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentNumber(String paymentNumber);

    boolean existsByPaymentNumber(String paymentNumber);

    List<Payment> findByInvoiceIdOrderByPaymentDateDesc(Long invoiceId);

    List<Payment> findByPatientIdOrderByPaymentDateDesc(Long patientId);

    @Query("SELECT COUNT(p) FROM Payment p")
    long countTotalPayments();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paymentDate >= :start AND p.paymentDate <= :end")
    BigDecimal sumPaymentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
