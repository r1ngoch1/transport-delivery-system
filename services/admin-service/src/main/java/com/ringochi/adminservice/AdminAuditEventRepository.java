package com.ringochi.adminservice;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AdminAuditEventRepository extends JpaRepository<AdminAuditEvent, UUID>, JpaSpecificationExecutor<AdminAuditEvent> {
}
