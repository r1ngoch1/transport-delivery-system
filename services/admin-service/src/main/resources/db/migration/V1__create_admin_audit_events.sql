create table admin_audit_events (
    id uuid primary key,
    actor_id uuid not null,
    action varchar(64) not null,
    resource_type varchar(64) not null,
    resource_id uuid,
    payload jsonb not null,
    created_at timestamp with time zone not null
);

create index idx_admin_audit_events_actor_id on admin_audit_events(actor_id);
create index idx_admin_audit_events_resource on admin_audit_events(resource_type, resource_id);
create index idx_admin_audit_events_created_at on admin_audit_events(created_at);
