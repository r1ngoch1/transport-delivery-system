CREATE TABLE notifications (
    id uuid primary key,
    recipient_user_id uuid not null,
    type varchar(32) not null,
    severity varchar(32) not null,
    status varchar(32) not null,
    title varchar(160) not null,
    body text not null,
    entity_type varchar(32),
    entity_id uuid,
    delivery_channel varchar(32) not null,
    event_id uuid,
    created_at timestamp with time zone not null,
    read_at timestamp with time zone
);

CREATE UNIQUE INDEX uq_notifications_event_id
    ON notifications(event_id)
    WHERE event_id IS NOT NULL;

CREATE INDEX idx_notifications_recipient_status_created
    ON notifications(recipient_user_id, status, created_at DESC);
