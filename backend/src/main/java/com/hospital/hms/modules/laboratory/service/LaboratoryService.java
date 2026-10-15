package com.hospital.hms.modules.laboratory.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.appointment.entity.Appointment;
import com.hospital.hms.modules.appointment.repository.AppointmentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.laboratory.dto.*;
import com.hospital.hms.modules.laboratory.entity.LabOrder;
import com.hospital.hms.modules.laboratory.entity.LabOrderItem;
import com.hospital.hms.modules.laboratory.entity.LabResult;
import com.hospital.hms.modules.laboratory.entity.LabTest;
import com.hospital.hms.modules.laboratory.repository.LabOrderItemRepository;
import com.hospital.hms.modules.laboratory.repository.LabOrderRepository;
import com.hospital.hms.modules.laboratory.repository.LabResultRepository;
import com.hospital.hms.modules.laboratory.repository.LabTestRepository;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import com.hospital.hms.modules.user.entity.User;
import com.hospital.hms.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LaboratoryService {

    private final LabTestRepository labTestRepository;
    private final LabOrderRepository labOrderRepository;
    private final LabOrderItemRepository labOrderItemRepository;
    private final LabResultRepository labResultRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    // --- Test Catalog ---
    @Transactional(readOnly = true)
    public List<LabTestResponse> getActiveTests() {
        return labTestRepository.findByIsActiveTrue().stream()
                .map(LabTestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public LabTestResponse createLabTest(LabTestRequest request) {
        if (labTestRepository.existsByTestCode(request.getTestCode().trim().toUpperCase())) {
            throw new BadRequestException("Test code already exists: " + request.getTestCode());
        }

        LabTest test = LabTest.builder()
                .testCode(request.getTestCode().trim().toUpperCase())
                .testName(request.getTestName().trim())
                .category(request.getCategory().toUpperCase())
                .sampleType(request.getSampleType())
                .standardTurnaroundHours(request.getStandardTurnaroundHours())
                .cost(request.getCost())
                .referenceRanges(request.getReferenceRanges())
                .isActive(request.isActive())
                .build();

        return LabTestResponse.fromEntity(labTestRepository.save(test));
    }

    @Transactional
    public LabTestResponse updateLabTest(Long id, LabTestRequest request) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", id));
        if (!test.getTestCode().equalsIgnoreCase(request.getTestCode().trim()) &&
                labTestRepository.existsByTestCode(request.getTestCode().trim().toUpperCase())) {
            throw new BadRequestException("Test code already exists: " + request.getTestCode());
        }
        test.setTestCode(request.getTestCode().trim().toUpperCase());
        test.setTestName(request.getTestName().trim());
        test.setCategory(request.getCategory().toUpperCase());
        test.setSampleType(request.getSampleType());
        test.setStandardTurnaroundHours(request.getStandardTurnaroundHours());
        test.setCost(request.getCost());
        test.setReferenceRanges(request.getReferenceRanges());
        test.setActive(request.isActive());
        return LabTestResponse.fromEntity(labTestRepository.save(test));
    }

    @Transactional
    public void deleteLabTest(Long id) {
        LabTest test = labTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", id));
        test.setActive(false);
        labTestRepository.save(test);
    }

    // --- Lab Orders ---
    @Transactional
    public LabOrderResponse createLabOrder(LabOrderRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        Appointment appointment = null;
        if (request.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", request.getAppointmentId()));
        }

        LabOrder order = LabOrder.builder()
                .orderNumber(generateOrderNumber())
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .status("ORDERED")
                .clinicalIndications(request.getClinicalIndications())
                .orderDate(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        for (Long testId : request.getTestIds()) {
            LabTest test = labTestRepository.findById(testId)
                    .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId));

            LabOrderItem item = LabOrderItem.builder()
                    .order(order)
                    .test(test)
                    .status("PENDING")
                    .price(test.getCost())
                    .results(new ArrayList<>())
                    .build();
            order.getItems().add(item);
        }

        return LabOrderResponse.fromEntity(labOrderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public LabOrderResponse getLabOrderById(Long id) {
        LabOrder order = labOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LabOrder", "id", id));
        return LabOrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public PagedResponse<LabOrderResponse> filterLabOrders(Long patientId, Long doctorId, String status, Pageable pageable) {
        Page<LabOrder> page = labOrderRepository.filterOrders(patientId, doctorId, status, pageable);
        List<LabOrderResponse> content = page.getContent().stream()
                .map(LabOrderResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Transactional(readOnly = true)
    public List<LabOrderResponse> getPatientLabOrders(Long patientId) {
        return labOrderRepository.findByPatientIdOrderByOrderDateDesc(patientId).stream()
                .map(LabOrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // --- Specimen Collection ---
    @Transactional
    public LabOrderItemResponse collectSpecimen(Long orderItemId, SpecimenCollectionRequest request, Long collectorUserId) {
        LabOrderItem item = labOrderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("LabOrderItem", "id", orderItemId));
        User collector = userRepository.findById(collectorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", collectorUserId));

        String barcode = (request != null && request.getCustomBarcode() != null && !request.getCustomBarcode().isBlank())
                ? request.getCustomBarcode().trim()
                : "BC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        item.setStatus("SAMPLE_COLLECTED");
        item.setSampleBarcode(barcode);
        item.setCollectedAt(LocalDateTime.now());
        item.setCollectedByUser(collector);

        // Update overall order status if needed
        LabOrder order = item.getOrder();
        if ("ORDERED".equals(order.getStatus())) {
            order.setStatus("SAMPLE_COLLECTED");
            labOrderRepository.save(order);
        }

        return LabOrderItemResponse.fromEntity(labOrderItemRepository.save(item));
    }

    // --- Results Entry & Verification ---
    @Transactional
    public LabResultResponse enterResult(Long orderItemId, LabResultEntryRequest request, Long technicianUserId) {
        LabOrderItem item = labOrderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new ResourceNotFoundException("LabOrderItem", "id", orderItemId));
        User technician = userRepository.findById(technicianUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", technicianUserId));

        LabResult result = LabResult.builder()
                .orderItem(item)
                .test(item.getTest())
                .performedByUser(technician)
                .verifiedByUser(technician)
                .parameterName(request.getParameterName().trim())
                .resultValue(request.getResultValue().trim())
                .referenceRange(request.getReferenceRange() != null ? request.getReferenceRange() : item.getTest().getReferenceRanges())
                .unit(request.getUnit())
                .isAbnormal(request.isAbnormal())
                .remarks(request.getRemarks())
                .verifiedAt(LocalDateTime.now())
                .build();

        LabResult savedResult = labResultRepository.save(result);

        item.setStatus("COMPLETED");
        labOrderItemRepository.save(item);

        // Check if all items in the order are completed
        LabOrder order = item.getOrder();
        boolean allCompleted = order.getItems().stream().allMatch(i -> "COMPLETED".equals(i.getStatus()));
        if (allCompleted) {
            order.setStatus("COMPLETED");
            labOrderRepository.save(order);
        } else {
            order.setStatus("IN_PROGRESS");
            labOrderRepository.save(order);
        }

        return LabResultResponse.fromEntity(savedResult);
    }

    private synchronized String generateOrderNumber() {
        long count = labOrderRepository.countTotalOrders() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("LAB-%s-%04d", year, count);
        while (labOrderRepository.existsByOrderNumber(code)) {
            count++;
            code = String.format("LAB-%s-%04d", year, count);
        }
        return code;
    }
}
