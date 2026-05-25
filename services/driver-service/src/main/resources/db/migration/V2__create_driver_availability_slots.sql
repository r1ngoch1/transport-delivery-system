create table driver_availability_slots (
    id uuid primary key,
    driver_profile_id uuid not null references driver_profiles (id),
    start_at timestamp with time zone not null,
    end_at timestamp with time zone not null,
    note varchar(255),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint chk_driver_availability_slots_time check (end_at > start_at)
);

create index idx_driver_availability_slots_driver_time
    on driver_availability_slots (driver_profile_id, start_at, end_at);
