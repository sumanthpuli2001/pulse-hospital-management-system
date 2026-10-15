package com.hospital.hms.billing;

import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.modules.billing.dto.InvoiceCreateRequest;
import com.hospital.hms.modules.billing.dto.InvoiceItemRequest;
import com.hospital.hms.modules.billing.dto.InvoiceResponse;
import com.hospital.hms.modules.billing.dto.PaymentRequest;
import com.hospital.hms.modules.billing.dto.PaymentResponse;
import com.hospital.hms.modules.billing.entity.Invoice;
import com.hospital.hms.modules.billing.entity.InvoiceItem;
import com.hospital.hms.modules.billing.entity.Payment;
import com.hospital.hms.modules.billing.repository.InvoiceItemRepository;
import com.hospital.hms.modules.billing.repository.InvoiceRepository;
import com.hospital.hms.modules.billing.repository.PaymentRepository;
import com.hospital.hms.modules.billing.service.BillingService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private InvoiceItemRepository invoiceItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BillingService billingService;

    private Patient patient;
    private User cashier;
    private Invoice invoice;

    @BeforeEach
    void setUp() {
        patient = Patient.builder()
                .id(1L)
                .patientCode("PAT-2026-0001")
                .firstName("Eleanor")
                .lastName("Rigby")
                .build();

        cashier = User.builder()
                .id(5L)
                .username("accountant")
                .build();

        invoice = Invoice.builder()
                .id(10L)
                .invoiceNumber("INV-2026-0001")
                .patient(patient)
                .subtotal(new BigDecimal("100.00"))
                .taxAmount(new BigDecimal("5.00"))
                .discountAmount(new BigDecimal("0.00"))
                .totalAmount(new BigDecimal("105.00"))
                .paidAmount(new BigDecimal("0.00"))
                .balanceAmount(new BigDecimal("105.00"))
                .status("ISSUED")
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should create invoice with decimal-safe calculations")
    void testCreateInvoiceCalculations() {
        InvoiceCreateRequest request = new InvoiceCreateRequest();
        request.setPatientId(1L);
        request.setDueDate(LocalDate.now().plusDays(7));
        request.setTaxAmount(new BigDecimal("10.00"));
        request.setDiscountAmount(new BigDecimal("5.00"));

        InvoiceItemRequest item1 = InvoiceItemRequest.builder()
                .itemType("CONSULTATION")
                .description("Cardiology Consultation")
                .quantity(1)
                .unitPrice(new BigDecimal("75.00"))
                .build();

        InvoiceItemRequest item2 = InvoiceItemRequest.builder()
                .itemType("LABORATORY")
                .description("Lipid Panel")
                .quantity(2)
                .unitPrice(new BigDecimal("25.00"))
                .build();

        request.setItems(List.of(item1, item2));

        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(5L)).thenReturn(Optional.of(cashier));

        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> {
            Invoice inv = i.getArgument(0);
            inv.setId(50L);
            return inv;
        });

        InvoiceResponse response = billingService.createInvoice(request, 5L);

        assertNotNull(response);
        // Subtotal = 75 + 50 = 125.00
        assertEquals(new BigDecimal("125.00"), response.getSubtotal());
        // Total = 125 + 10 (tax) - 5 (discount) = 130.00
        assertEquals(new BigDecimal("130.00"), response.getTotalAmount());
        assertEquals(new BigDecimal("130.00"), response.getBalanceAmount());
        assertEquals("ISSUED", response.getStatus());
    }

    @Test
    @DisplayName("Should record partial payment and transition status to PARTIALLY_PAID")
    void testPartialPaymentRecording() {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("50.00"));
        request.setPaymentMethod("CARD");
        request.setTransactionReference("AUTH-12345");

        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoice));
        when(userRepository.findById(5L)).thenReturn(Optional.of(cashier));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(99L);
            return p;
        });

        PaymentResponse response = billingService.recordPayment(10L, request, 5L);

        assertNotNull(response);
        assertEquals(new BigDecimal("50.00"), response.getAmount());
        assertEquals("PARTIALLY_PAID", invoice.getStatus());
        assertEquals(new BigDecimal("50.00"), invoice.getPaidAmount());
        assertEquals(new BigDecimal("55.00"), invoice.getBalanceAmount());
        verify(invoiceRepository).save(invoice);
    }

    @Test
    @DisplayName("Should record full payment and transition status to PAID")
    void testFullPaymentRecording() {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("105.00"));
        request.setPaymentMethod("CASH");

        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoice));
        when(userRepository.findById(5L)).thenReturn(Optional.of(cashier));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            p.setId(100L);
            return p;
        });

        PaymentResponse response = billingService.recordPayment(10L, request, 5L);

        assertNotNull(response);
        assertEquals("PAID", invoice.getStatus());
        assertEquals(new BigDecimal("105.00"), invoice.getPaidAmount());
        assertEquals(new BigDecimal("0.00"), invoice.getBalanceAmount());
        verify(invoiceRepository).save(invoice);
    }

    @Test
    @DisplayName("Should reject payment exceeding invoice balance amount")
    void testOverpaymentRejection() {
        PaymentRequest request = new PaymentRequest();
        request.setAmount(new BigDecimal("200.00"));
        request.setPaymentMethod("CARD");

        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(invoice));
        when(userRepository.findById(5L)).thenReturn(Optional.of(cashier));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            billingService.recordPayment(10L, request, 5L);
        });

        assertTrue(ex.getMessage().contains("exceeds outstanding balance"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }
}
