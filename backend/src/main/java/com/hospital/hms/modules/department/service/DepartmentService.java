package com.hospital.hms.modules.department.service;

import com.hospital.hms.common.exceptions.BadRequestException;
import com.hospital.hms.common.exceptions.ResourceNotFoundException;
import com.hospital.hms.modules.department.dto.DepartmentRequest;
import com.hospital.hms.modules.department.dto.DepartmentResponse;
import com.hospital.hms.modules.department.entity.Department;
import com.hospital.hms.modules.department.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments(boolean onlyActive) {
        List<Department> list = onlyActive ? departmentRepository.findByIsActiveTrue() : departmentRepository.findAll();
        return list.stream().map(DepartmentResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        return DepartmentResponse.fromEntity(dept);
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode().trim().toUpperCase())) {
            throw new BadRequestException("Department code already exists: " + request.getCode());
        }
        if (departmentRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException("Department name already exists: " + request.getName());
        }

        Department department = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .description(request.getDescription())
                .isActive(request.isActive())
                .build();

        return DepartmentResponse.fromEntity(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));

        dept.setName(request.getName().trim());
        dept.setDescription(request.getDescription());
        dept.setActive(request.isActive());

        return DepartmentResponse.fromEntity(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
        dept.setActive(false);
        departmentRepository.save(dept);
    }
}
