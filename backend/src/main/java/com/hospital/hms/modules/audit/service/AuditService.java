package com.hospital.hms.modules.audit.service;

import com.hospital.hms.modules.audit.entity.AuditLog;
import com.hospital.hms.modules.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(Long userId, String username, String action, String resourceName, String resourceId, String ipAddress, String userAgent, String details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .username(username)
                    .action(action)
                    .resourceName(resourceName)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .details(details)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception ex) {
            log.error("Failed to persist security audit log entry for user: {}", username, ex);
        }
    }

    @Transactional(readOnly = true)
    public com.hospital.hms.common.PagedResponse<com.hospital.hms.modules.audit.dto.AuditLogResponse> filterAuditLogs(
            String username, String action, String resourceName, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<AuditLog> page = auditLogRepository.filterAuditLogs(username, action, resourceName, pageable);
        java.util.List<com.hospital.hms.modules.audit.dto.AuditLogResponse> content = page.getContent().stream()
                .map(com.hospital.hms.modules.audit.dto.AuditLogResponse::fromEntity)
                .collect(java.util.stream.Collectors.toList());
        return com.hospital.hms.common.PagedResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
