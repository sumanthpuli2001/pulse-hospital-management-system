package com.hospital.hms.modules.inpatient.service;

import com.hospital.hms.common.PagedResponse;
import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.department.entity.Department;
import com.hospital.hms.modules.department.repository.DepartmentRepository;
import com.hospital.hms.modules.doctor.entity.Doctor;
import com.hospital.hms.modules.doctor.repository.DoctorRepository;
import com.hospital.hms.modules.inpatient.dto.*;
import com.hospital.hms.modules.inpatient.entity.*;
import com.hospital.hms.modules.inpatient.repository.*;
import com.hospital.hms.modules.patient.entity.Patient;
import com.hospital.hms.modules.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InpatientService {

    private final WardRepository wardRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final AdmissionRepository admissionRepository;
    private final BedAllocationRepository bedAllocationRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DepartmentRepository departmentRepository;

    // --- Ward & Room Setup ---
    @Transactional
    public WardResponse createWard(WardRequest request) {
        if (wardRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException("Ward name already exists: " + request.getName());
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        }

        Ward ward = Ward.builder()
                .name(request.getName().trim())
                .wardType(request.getWardType().trim().toUpperCase())
                .department(department)
                .floorNumber(request.getFloorNumber())
                .capacity(request.getCapacity())
                .isActive(true)
                .build();

        return WardResponse.fromEntity(wardRepository.save(ward));
    }

    @Transactional(readOnly = true)
    public List<WardResponse> getActiveWards() {
        return wardRepository.findByIsActiveTrue().stream()
                .map(WardResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public WardResponse updateWard(Long id, WardRequest request) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward", "id", id));
        if (!ward.getName().equalsIgnoreCase(request.getName().trim()) && wardRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException("Ward name already exists: " + request.getName());
        }
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));
        }
        ward.setName(request.getName().trim());
        ward.setWardType(request.getWardType().trim().toUpperCase());
        ward.setDepartment(department);
        ward.setFloorNumber(request.getFloorNumber());
        ward.setCapacity(request.getCapacity());
        if (request.getIsActive() != null) {
            ward.setActive(request.getIsActive());
        }
        return WardResponse.fromEntity(wardRepository.save(ward));
    }

    @Transactional
    public void deleteWard(Long id) {
        Ward ward = wardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ward", "id", id));
        ward.setActive(false);
        wardRepository.save(ward);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        Ward ward = wardRepository.findById(request.getWardId())
                .orElseThrow(() -> new ResourceNotFoundException("Ward", "id", request.getWardId()));

        if (roomRepository.existsByWardIdAndRoomNumber(request.getWardId(), request.getRoomNumber().trim())) {
            throw new BadRequestException("Room " + request.getRoomNumber() + " already exists in ward " + ward.getName());
        }

        Room room = Room.builder()
                .ward(ward)
                .roomNumber(request.getRoomNumber().trim())
                .roomType(request.getRoomType().trim().toUpperCase())
                .dailyRate(request.getDailyRate())
                .isActive(true)
                .build();

        return RoomResponse.fromEntity(roomRepository.save(room));
    }

    @Transactional
    public BedResponse createBed(BedRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", request.getRoomId()));

        if (bedRepository.existsByRoomIdAndBedNumber(request.getRoomId(), request.getBedNumber().trim())) {
            throw new BadRequestException("Bed " + request.getBedNumber() + " already exists in room " + room.getRoomNumber());
        }

        Bed bed = Bed.builder()
                .room(room)
                .bedNumber(request.getBedNumber().trim())
                .status("AVAILABLE")
                .isActive(true)
                .build();

        return BedResponse.fromEntity(bedRepository.save(bed));
    }

    // --- Admission Workflow (with Pessimistic Concurrency Lock) ---
    @Transactional
    public AdmissionResponse admitPatient(AdmissionRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        if (request.getAdmittingDoctorId() == null) {
            throw new BadRequestException("Admitting doctor ID is required");
        }
        Doctor doctor = doctorRepository.findById(request.getAdmittingDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getAdmittingDoctorId()));

        // Check if patient is already actively admitted
        admissionRepository.findFirstByPatientIdAndStatus(request.getPatientId(), "ADMITTED")
                .ifPresent(existing -> {
                    throw new BadRequestException("Patient is already actively admitted under admission " + existing.getAdmissionNumber());
                });

        // Acquire pessimistic write lock on bed to strictly prevent concurrent double allocation
        Bed bed = bedRepository.findByIdWithLock(request.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", request.getBedId()));

        if (!bed.isActive()) {
            throw new BadRequestException("Bed " + bed.getBedNumber() + " is currently inactive");
        }

        if (!"AVAILABLE".equalsIgnoreCase(bed.getStatus())) {
            throw new BadRequestException("Bed " + bed.getBedNumber() + " is already occupied or under maintenance (Status: " + bed.getStatus() + ")");
        }

        // Reserve bed
        bed.setStatus("OCCUPIED");
        bedRepository.save(bed);

        LocalDateTime now = LocalDateTime.now();
        Admission admission = Admission.builder()
                .admissionNumber(generateAdmissionNumber())
                .patient(patient)
                .admittingDoctor(doctor)
                .admissionDate(now)
                .admissionReason(request.getAdmissionReason())
                .status("ADMITTED")
                .bedAllocations(new ArrayList<>())
                .build();

        Admission savedAdmission = admissionRepository.save(admission);

        BedAllocation allocation = BedAllocation.builder()
                .admission(savedAdmission)
                .bed(bed)
                .allocatedFrom(now)
                .dailyCharge(bed.getRoom().getDailyRate())
                .status("ACTIVE")
                .notes(request.getNotes() != null ? request.getNotes() : "Initial admission allocation")
                .build();

        BedAllocation savedAllocation = bedAllocationRepository.save(allocation);
        savedAdmission.getBedAllocations().add(savedAllocation);

        return AdmissionResponse.fromEntity(savedAdmission);
    }

    // --- Bed Transfer ---
    @Transactional
    public AdmissionResponse transferBed(Long admissionId, BedTransferRequest request) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BadRequestException("Cannot transfer bed for inactive admission (Status: " + admission.getStatus() + ")");
        }

        // Lock target bed
        Bed targetBed = bedRepository.findByIdWithLock(request.getTargetBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed", "id", request.getTargetBedId()));

        if (!"AVAILABLE".equalsIgnoreCase(targetBed.getStatus())) {
            throw new BadRequestException("Target bed " + targetBed.getBedNumber() + " is not available (Status: " + targetBed.getStatus() + ")");
        }

        // Find active allocation to release
        BedAllocation currentAllocation = bedAllocationRepository.findFirstByAdmissionIdAndStatus(admissionId, "ACTIVE")
                .orElseThrow(() -> new BadRequestException("No active bed allocation found for admission " + admissionId));

        LocalDateTime now = LocalDateTime.now();

        // Release old bed
        Bed oldBed = currentAllocation.getBed();
        oldBed.setStatus("AVAILABLE");
        bedRepository.save(oldBed);

        currentAllocation.setStatus("TRANSFERRED");
        currentAllocation.setAllocatedTo(now);
        bedAllocationRepository.save(currentAllocation);

        // Occupy target bed
        targetBed.setStatus("OCCUPIED");
        bedRepository.save(targetBed);

        BedAllocation newAllocation = BedAllocation.builder()
                .admission(admission)
                .bed(targetBed)
                .allocatedFrom(now)
                .dailyCharge(targetBed.getRoom().getDailyRate())
                .status("ACTIVE")
                .notes(request.getTransferReason() != null ? request.getTransferReason() : "Transferred from bed " + oldBed.getBedNumber())
                .build();

        BedAllocation savedNewAllocation = bedAllocationRepository.save(newAllocation);
        admission.getBedAllocations().add(savedNewAllocation);

        return AdmissionResponse.fromEntity(admission);
    }

    // --- Discharge Workflow ---
    @Transactional
    public AdmissionResponse dischargePatient(Long admissionId, DischargeRequest request) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", admissionId));

        if (!"ADMITTED".equalsIgnoreCase(admission.getStatus())) {
            throw new BadRequestException("Patient is not actively admitted (Current status: " + admission.getStatus() + ")");
        }

        LocalDateTime now = LocalDateTime.now();

        // Release active bed allocation
        Optional<BedAllocation> activeAllocOpt = bedAllocationRepository.findFirstByAdmissionIdAndStatus(admissionId, "ACTIVE");
        if (activeAllocOpt.isPresent()) {
            BedAllocation activeAlloc = activeAllocOpt.get();
            activeAlloc.setStatus("RELEASED");
            activeAlloc.setAllocatedTo(now);
            bedAllocationRepository.save(activeAlloc);

            Bed bed = activeAlloc.getBed();
            bed.setStatus("AVAILABLE");
            bedRepository.save(bed);
        }

        admission.setStatus("DISCHARGED");
        admission.setDischargeDate(now);
        admission.setDischargeSummary(request.getDischargeSummary());
        Admission updated = admissionRepository.save(admission);

        return AdmissionResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public AdmissionResponse getAdmissionById(Long id) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", "id", id));
        return AdmissionResponse.fromEntity(admission);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdmissionResponse> filterAdmissions(Long patientId, Long doctorId, String status, Pageable pageable) {
        Page<Admission> page = admissionRepository.filterAdmissions(patientId, doctorId, status, pageable);
        List<AdmissionResponse> content = page.getContent().stream()
                .map(AdmissionResponse::fromEntity)
                .collect(Collectors.toList());
        return PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    // --- Live Bed Board Matrix ---
    @Transactional(readOnly = true)
    public List<BedBoardItemResponse> getBedBoard() {
        List<Bed> allBeds = bedRepository.findAllBedsWithHierarchy();
        return allBeds.stream().map(bed -> {
            Optional<BedAllocation> activeAllocation = bedAllocationRepository.findFirstByBedIdAndStatus(bed.getId(), "ACTIVE");

            BedBoardItemResponse.BedBoardItemResponseBuilder builder = BedBoardItemResponse.builder()
                    .bedId(bed.getId())
                    .bedNumber(bed.getBedNumber())
                    .status(bed.getStatus())
                    .roomId(bed.getRoom().getId())
                    .roomNumber(bed.getRoom().getRoomNumber())
                    .roomType(bed.getRoom().getRoomType())
                    .dailyRate(bed.getRoom().getDailyRate())
                    .wardId(bed.getRoom().getWard().getId())
                    .wardName(bed.getRoom().getWard().getName())
                    .wardType(bed.getRoom().getWard().getWardType())
                    .floorNumber(bed.getRoom().getWard().getFloorNumber());

            activeAllocation.ifPresent(ba -> {
                Admission adm = ba.getAdmission();
                if (adm != null) {
                    builder.currentAdmissionId(adm.getId());
                    builder.currentAdmissionNumber(adm.getAdmissionNumber());
                    if (adm.getPatient() != null) {
                        builder.currentPatientId(adm.getPatient().getId());
                        builder.currentPatientName(adm.getPatient().getFirstName() + " " + adm.getPatient().getLastName());
                        builder.currentPatientCode(adm.getPatient().getPatientCode());
                    }
                }
            });

            return builder.build();
        }).collect(Collectors.toList());
    }

    private synchronized String generateAdmissionNumber() {
        long count = admissionRepository.countTotalAdmissions() + 1;
        String year = String.valueOf(LocalDate.now().getYear());
        String code = String.format("ADM-%s-%04d", year, count);
        while (admissionRepository.existsByAdmissionNumber(code)) {
            count++;
            code = String.format("ADM-%s-%04d", year, count);
        }
        return code;
    }
}
