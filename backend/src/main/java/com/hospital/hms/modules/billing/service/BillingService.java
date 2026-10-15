package com.hospital.hms.modules.billing.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.billing.dto.*;
import com.hospital.hms.modules.billing.entity.Invoice;
import com.hospital.hms.modules.billing.entity.InvoiceItem;
import com.hospital.hms.modules.billing.entity.Payment;
import com.hospital.hms.modules.billing.repository.InvoiceItemRepository;
import com.hospital.hms.modules.billing.repository.InvoiceRepository;
import com.hospital.hms.modules.billing.repository.PaymentRepository;
import com.hospital.hms.modules.inpatient.entity.Admission;
import com.hospital.hms.modules.inpatient.entity.BedAllocation;
import com.hospital.hms.modules.inpatient.repository.AdmissionRepository;
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
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final PatientRepository patientRepository;
    private final AdmissionRepository admissionRepository;
    private final UserRepository userRepository;

    @Transactional
    public InvoiceResponse createInvoice(InvoiceCreateRequest request, Long userId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));

        User creator = null;
        if (userId != null) {
            creator = userRepository.findById(userId).orElse(null);
        }

        Admission admission = null;
        if (request.getAdmissionId() != null) {
            admission = admissionRepository.findById(request.getAdmissionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", request.getAdmissionId()));
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .patient(patient)
                .admission(admission)
                .invoiceDate(LocalDate.now())
                .dueDate(request.getDueDate())
                .notes(request.getNotes())
                .createdByUser(creator)
                .taxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        for (InvoiceItemRequest itemReq : request.getItems()) {
            BigDecimal lineTotal = itemReq.getUnitPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .itemType(itemReq.getItemType().toUpperCase())
                    .itemReferenceId(itemReq.getItemReferenceId())
                    .description(itemReq.getDescription())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP))
                    .totalPrice(lineTotal)
                    .build();
            items.add(item);
        }

        BigDecimal total = subtotal.add(invoice.getTaxAmount()).subtract(invoice.getDiscountAmount())
                .setScale(2, RoundingMode.HALF_UP);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        invoice.setSubtotal(subtotal);
        invoice.setTotalAmount(total);
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setBalanceAmount(total);
        invoice.setStatus("ISSUED");
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);
        return InvoiceResponse.fromEntity(saved);
    }

    @Transactional
    public PaymentResponse recordPayment(Long invoiceId, PaymentRequest request, Long receiverUserId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));
        User receiver = userRepository.findById(receiverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverUserId));

        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new BadRequestException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
        }

        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus())) {
            throw new BadRequestException("Cannot accept payments for cancelled invoice " + invoice.getInvoiceNumber());
        }

        BigDecimal paymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BadRequestException("Payment amount (" + paymentAmount + ") exceeds outstanding balance (" +
                    invoice.getBalanceAmount() + ")");
        }

        Payment payment = Payment.builder()
                .paymentNumber(generatePaymentNumber())
                .invoice(invoice)
                .patient(invoice.getPatient())
                .amount(paymentAmount)
                .paymentMethod(request.getPaymentMethod().toUpperCase())
                .paymentDate(LocalDateTime.now())
                .transactionReference(request.getTransactionReference())
                .notes(request.getNotes())
                .receivedByUser(receiver)
                .status("COMPLETED")
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(paymentAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal newBalance = invoice.getBalanceAmount().subtract(paymentAmount).setScale(2, RoundingMode.HALF_UP);

        invoice.setPaidAmount(newPaidAmount);
        invoice.setBalanceAmount(newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus("PAID");
        } else {
            invoice.setStatus("PARTIALLY_PAID");
        }

        invoiceRepository.save(invoice);
        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public InvoiceResponse generateAdmissionInvoice(Long admissionId, Long userId) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", admissionId));

        List<InvoiceItemRequest> items = new ArrayList<>();

        // 1. Doctor Consultation Fee
        if (admission.getAdmittingDoctor() != null) {
            BigDecimal fee = admission.getAdmittingDoctor().getConsultationFee();
            items.add(InvoiceItemRequest.builder()
                    .itemType("CONSULTATION")
                    .itemReferenceId("DOC-" + admission.getAdmittingDoctor().getId())
                    .description("Inpatient Attending Physician Fee - Dr. " +
                            admission.getAdmittingDoctor().getUser().getFirstName() + " " +
                            admission.getAdmittingDoctor().getUser().getLastName())
                    .quantity(1)
                    .unitPrice(fee != null ? fee : new BigDecimal("100.00"))
                    .build());
        }

        // 2. Bed Occupancy Charges
        if (admission.getBedAllocations() != null) {
            for (BedAllocation ba : admission.getBedAllocations()) {
                LocalDateTime end = ba.getAllocatedTo() != null ? ba.getAllocatedTo() : LocalDateTime.now();
                long hours = Math.max(1, Duration.between(ba.getAllocatedFrom(), end).toHours());
                long days = Math.max(1, (hours + 23) / 24); // at least 1 day charge

                String roomInfo = ba.getBed() != null && ba.getBed().getRoom() != null ?
                        "Room " + ba.getBed().getRoom().getRoomNumber() + " (Bed " + ba.getBed().getBedNumber() + ")" : "Bed Allocation";

                items.add(InvoiceItemRequest.builder()
                        .itemType("ROOM_CHARGE")
                        .itemReferenceId("BA-" + ba.getId())
                        .description("Daily Accommodation Charge: " + roomInfo)
                        .quantity((int) days)
                        .unitPrice(ba.getDailyCharge())
                        .build());
            }
        }

        InvoiceCreateRequest createRequest = InvoiceCreateRequest.builder()
                .patientId(admission.getPatient().getId())
                .admissionId(admission.getId())
                .dueDate(LocalDate.now().plusDays(7))
                .items(items)
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .notes("Consolidated Inpatient Discharge Bill for " + admission.getAdmissionNumber())
                .build();

        return createInvoice(createRequest, userId);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceResponse> filterInvoices(Long patientId, String status, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<Invoice> page = invoiceRepository.filterInvoices(patientId, status, startDate, endDate, pageable);
        List<InvoiceResponse> content = page.getContent().stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPatientInvoices(Long patientId) {
        return invoiceRepository.findByPatientIdOrderByInvoiceDateDesc(patientId).stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private synchronized String generateInvoiceNumber() {
        long count = invoiceRepository.countTotalInvoices() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("INV-%s-%04d", year, count);
        while (invoiceRepository.existsByInvoiceNumber(code)) {
            count++;
            code = String.format("INV-%s-%04d", year, count);
        }
        return code;
    }

    private synchronized String generatePaymentNumber() {
        long count = paymentRepository.countTotalPayments() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("PAY-%s-%04d", year, count);
        while (paymentRepository.existsByPaymentNumber(code)) {
            count++;
            code = String.format("PAY-%s-%04d", year, count);
        }
        return code;
    }
}
