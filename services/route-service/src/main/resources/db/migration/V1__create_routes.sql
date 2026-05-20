create table cities (
    id uuid primary key,
    name varchar(255) not null,
    region varchar(255),
    country varchar(255) not null,
    active boolean not null
);

create table routes (
    id uuid primary key,
    from_city_id uuid not null references cities(id),
    to_city_id uuid not null references cities(id),
    distance_km integer not null,
    estimated_duration_minutes integer not null,
    active boolean not null
);

insert into cities (id, name, region, country, active) values
('11111111-1111-1111-1111-111111111111', 'Ekaterinburg', 'Sverdlovsk Oblast', 'Russia', true),
('22222222-2222-2222-2222-222222222222', 'Chelyabinsk', 'Chelyabinsk Oblast', 'Russia', true);

insert into routes (id, from_city_id, to_city_id, distance_km, estimated_duration_minutes, active) values
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 210, 180, true);
