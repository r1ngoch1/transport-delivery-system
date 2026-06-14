package com.ringochi.adminservice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuditLoggerTest {
    @Mock
    private AdminAuditEventRepository auditEvents;

    @Test
    void persistsAuditEventWhenAdminActionIsLogged() {
        AdminAuditLogger logger = new AdminAuditLogger(auditEvents);
        UUID adminUserId = UUID.randomUUID();
        UUID resourceId = UUID.randomUUID();
        when(auditEvents.save(any(AdminAuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        logger.log(adminUserId, "GET", "USER", resourceId);

        ArgumentCaptor<AdminAuditEvent> event = ArgumentCaptor.forClass(AdminAuditEvent.class);
        verify(auditEvents).save(event.capture());
        assertThat(event.getValue().getActorId()).isEqualTo(adminUserId);
        assertThat(event.getValue().getAction()).isEqualTo("GET");
        assertThat(event.getValue().getResourceType()).isEqualTo("USER");
        assertThat(event.getValue().getResourceId()).isEqualTo(resourceId);
        assertThat(event.getValue().getPayload()).isEmpty();
        assertThat(event.getValue().getCreatedAt()).isNotNull();
    }
}
