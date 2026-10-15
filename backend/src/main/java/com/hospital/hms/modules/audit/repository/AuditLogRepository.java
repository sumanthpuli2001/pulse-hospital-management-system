package com.hospital.hms.modules.audit.repository;

import com.hospital.hms.modules.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<AuditLog> findTop50ByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:resourceName IS NULL OR a.resourceName = :resourceName) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> filterAuditLogs(
            @org.springframework.data.repository.query.Param("username") String username,
            @org.springframework.data.repository.query.Param("action") String action,
            @org.springframework.data.repository.query.Param("resourceName") String resourceName,
            Pageable pageable
    );
}
