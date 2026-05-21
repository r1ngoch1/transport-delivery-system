create table driver_profiles (
    id uuid primary key,
    user_id uuid not null unique,
    full_name varchar(255) not null,
    phone varchar(64) not null,
    license_number varchar(128) not null,
    license_category varchar(32) not null,
    license_expires_at date not null,
    availability_status varchar(32) not null,
    active boolean not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_driver_profiles_availability
    on driver_profiles (active, availability_status);
