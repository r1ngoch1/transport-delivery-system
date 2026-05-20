create table payments (
    id uuid primary key,
    target_type varchar(32) not null,
    target_id uuid not null,
    user_id uuid not null,
    amount numeric(12, 2) not null,
    currency varchar(8) not null,
    status varchar(32) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_payments_target on payments(target_type, target_id);
