create table bookings (
    id uuid primary key,
    user_id uuid not null,
    trip_id uuid not null,
    payment_id uuid,
    seat_number varchar(32),
    status varchar(32) not null,
    price numeric(12, 2) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_bookings_user_id on bookings(user_id);
create unique index idx_bookings_payment_id on bookings(payment_id) where payment_id is not null;
