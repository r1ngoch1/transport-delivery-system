package com.ringochi.adminservice;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AdminAuditLogger {
    private static final Logger log = LoggerFactory.getLogger(AdminAuditLogger.class);

    public void log(UUID adminUserId, String action, String resourceType, UUID resourceId) {
        log.info("admin_audit adminUserId={} action={} resourceType={} resourceId={}",
                adminUserId, action, resourceType, resourceId);
    }
}
