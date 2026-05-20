create table trips (
    id uuid primary key,
    route_id uuid not null,
    driver_id uuid,
    departure_time timestamp with time zone not null,
    arrival_time timestamp with time zone not null,
    total_seats integer not null,
    available_seats integer not null,
    total_cargo_volume double precision not null,
    available_cargo_volume double precision not null,
    price numeric(12, 2) not null,
    status varchar(32) not null,
    version bigint not null
);

insert into trips (
    id, route_id, departure_time, arrival_time, total_seats, available_seats,
    total_cargo_volume, available_cargo_volume, price, status, version
) values (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '2026-06-01T08:00:00Z',
    '2026-06-01T11:00:00Z',
    12,
    12,
    6.0,
    6.0,
    1500.00,
    'SCHEDULED',
    0
);
