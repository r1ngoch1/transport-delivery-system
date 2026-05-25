package com.ringochi.adminservice;

import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AdminAuditLogger {
    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogger.class);
    private final AdminAuditEventRepository auditEvents;

    public AdminAuditLogger(AdminAuditEventRepository auditEvents) {
        this.auditEvents = auditEvents;
    }

    public void log(UUID adminUserId, String action, String resourceType, UUID resourceId) {
        auditEvents.save(new AdminAuditEvent(adminUserId, action, resourceType, resourceId, Map.of()));
        log.info("admin_audit adminUserId={} action={} resourceType={} resourceId={}",
                adminUserId, action, resourceType, resourceId);
    }
}
